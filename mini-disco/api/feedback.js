// Vercel Serverless Function - Feedback submission
// Replaces Netlify Functions → Vercel Serverless Function (/api/feedback)

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  // Parse request body
  let body;
  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const bodyStr = Buffer.concat(chunks).toString();
    body = JSON.parse(bodyStr);
  } catch {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Invalid request body' }));
    return;
  }

  try {
    // Log feedback
    console.log('[Feedback]', JSON.stringify(body));

    // Optionally send email notification if SMTP configured
    if (process.env.SMTP_USER && process.env.SMTP_PASS && body.email) {
      try {
        const { createTransport } = await import('nodemailer');
        const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@compliance.cat';
        const transporter = createTransport({
          host: process.env.SMTP_HOST || 'smtp.126.com',
          port: parseInt(process.env.SMTP_PORT || '465', 10),
          secure: true,
          auth: {
            user: process.env.SMTP_USER || 'senlin2027@126.com',
            pass: process.env.SMTP_PASS || '',
          },
        });

        await transporter.sendMail({
          from: fromAddress,
          to: process.env.FEEDBACK_EMAIL || process.env.SMTP_USER || 'noreply@compliance.cat',
          subject: `New Feedback from ${body.email || 'Anonymous'}`,
          html: `
            <h3>New User Feedback</h3>
            <p><strong>Email:</strong> ${body.email || 'N/A'}</p>
            <p><strong>Type:</strong> ${body.type || 'general'}</p>
            <p><strong>Message:</strong></p>
            <p>${(body.message || '').replace(/\n/g, '<br>')}</p>
            <hr/>
            <p><small>Submitted at: ${new Date().toISOString()}</small></p>
          `,
        });
      } catch (emailErr) {
        console.warn('[Feedback] Email notification failed:', emailErr.message);
      }
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true }));
  } catch {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Failed to submit feedback' }));
  }
}
