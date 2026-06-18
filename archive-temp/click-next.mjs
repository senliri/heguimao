const fs = require('fs');
const btn = document.querySelectorAll('button');
for (var i = 0; i < btn.length; i++) {
  var el = btn[i];
  if (el.textContent.trim().includes('下一步') || el.textContent.trim().includes('Next')) {
    for (var j = 0; j < el.childNodes.length; j++) {
      var child = el.childNodes[j];
      if (child.nodeType === 3 && child.textContent.includes('下一步') && child.textContent.includes('投资者')) {
        el.onclick = null;
        el.click();
        break;
      }
    }
  }
}
console.log('triggered');
