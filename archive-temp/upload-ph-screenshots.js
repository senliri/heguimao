const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function uploadScreenshots() {
  const wsUrl = 'ws://127.0.0.1:9222';
  const browser = await chromium.connectOverCDP(wsUrl);
  
  // Find the Product Hunt tab
  const pages = browser.contexts()[0].pages();
  let phPage = null;
  for (const page of pages) {
    try {
      const url = page.url();
      if (url.includes('producthunt.com/posts/new/submission')) {
        phPage = page;
        break;
      }
    } catch (e) {}
  }
  
  if (!phPage) {
    console.log('Product Hunt submission page not found, trying to find by title...');
    for (const page of pages) {
      try {
        const title = await page.title();
        if (title.includes('Product Hunt') || title.includes('producthunt')) {
          phPage = page;
          break;
        }
      } catch (e) {}
    }
  }
  
  if (!phPage) {
    console.log('ERROR: Cannot find Product Hunt page');
    process.exit(1);
  }
  
  console.log('Found PH page:', phPage.url());
  
  // Wait a moment for page to settle
  await phPage.waitForTimeout(2000);
  
  // Find the file input element for screenshot upload
  const fileInputs = await phPage.$$('input[type="file"]');
  console.log('Found', fileInputs.length, 'file inputs');
  
  if (fileInputs.length === 0) {
    console.log('No file inputs found. Trying to find upload area...');
    // Try clicking the Browse for files button and using setInputFiles on the body
    const browseBtn = await phPage.$('button:has-text("Browse for files")');
    if (browseBtn) {
      console.log('Found Browse for files button, clicking...');
      await browseBtn.click();
      await phPage.waitForTimeout(1000);
    }
    
    // Try to find file input by looking for common patterns
    const allInputs = await phPage.$$('input');
    for (const input of allInputs) {
      const type = await input.getAttribute('type');
      if (type === 'file') {
        console.log('Found file input via getAllInputs');
        fileInputs.push(input);
      }
    }
  }
  
  // Screenshots to upload
  const screenshots = [
    'screenshots/01_landing_page.png',
    'screenshots/03_compliance_report.png',
    'screenshots/04_appeal_assistant.png',
    'screenshots/02_search_analysis.png'
  ];
  
  const absScreenshots = screenshots.map(s => path.resolve(s));
  
  // Check which files exist
  for (const f of absScreenshots) {
    console.log(f, fs.existsSync(f) ? 'EXISTS' : 'MISSING');
  }
  
  // Try uploading via the first file input
  if (fileInputs.length > 0) {
    console.log('Uploading screenshots via file input...');
    await fileInputs[0].setInputFiles(absScreenshots);
    console.log('Screenshots uploaded!');
  } else {
    console.log('No file input found. Will need manual upload.');
  }
  
  await browser.close();
}

uploadScreenshots().catch(console.error);
