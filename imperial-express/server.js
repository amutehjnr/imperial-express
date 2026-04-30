const express = require('express');
const path    = require('path');
const SibApiV3Sdk = require('@getbrevo/brevo');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Brevo API Setup ─────────────────────────────────────────
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
apiInstance.setApiKey(
  SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY  // Set this in your environment
);

// ── Middleware ──────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ──────────────────────────────────────────────────
app.get('/',         (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/services', (req, res) => res.sendFile(path.join(__dirname, 'views', 'services.html')));
app.get('/contact',  (req, res) => res.sendFile(path.join(__dirname, 'views', 'contact.html')));

// ── Contact form POST handler ───────────────────────────────
app.post('/send-message', async (req, res) => {
  const { firstName, lastName, email, phone, company, service, budget, message } = req.body;

  // Basic server-side validation
  if (!firstName || !lastName || !email || !message) {
    return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
  }

  // Map service value to readable label
  const serviceLabels = {
    building:    'Building Construction (Residential/Commercial)',
    civil:       'Civil Engineering & Infrastructure',
    contracting: 'General Contracting',
    consultancy: 'Engineering Consultancy',
    renovation:  'Renovation & Remodeling',
    procurement: 'Procurement & Supply',
    industrial:  'Industrial Projects',
    borehole:    'Borehole & Water Projects',
    maintenance: 'Service & Maintenance',
    equipment:   'Equipment Renting / Leasing',
    other:       'Other',
  };

  const budgetLabels = {
    'under5m': 'Under ₦5 Million',
    '5-20m':   '₦5 Million – ₦20 Million',
    '20-100m': '₦20 Million – ₦100 Million',
    '100m+':   'Above ₦100 Million',
    'tbd':     'To Be Discussed',
  };

  const serviceLabel = serviceLabels[service] || service || 'Not specified';
  const budgetLabel  = budgetLabels[budget]   || budget  || 'Not specified';

  // ── Email to company (notification) ──────────────────────
  const notificationEmail = new SibApiV3Sdk.SendSmtpEmail();
  notificationEmail.subject = `New Enquiry from ${firstName} ${lastName} — Imperial Engineering`;
  notificationEmail.sender  = { name: 'Imperial Engineering Website', email: 'no-reply@imperialengineeringconstruction.com' };
  notificationEmail.to      = [{ email: 'Talk2iec@imperialengineeringconstruction.com', name: 'Imperial Engineering' }];
  notificationEmail.replyTo = { email, name: `${firstName} ${lastName}` };
  notificationEmail.htmlContent = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">
      <div style="background:#0a2fa6;padding:28px 32px;border-radius:8px 8px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:22px;">New Project Enquiry</h1>
        <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:14px;">Received via imperialengineeringconstruction.com</p>
      </div>
      <div style="background:#f9f9f9;padding:28px 32px;border-radius:0 0 8px 8px;border:1px solid #e5e5e5;border-top:none;">

        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;width:38%;color:#555;">Full Name</td>
              <td style="padding:10px 0;border-bottom:1px solid #eee;">${firstName} ${lastName}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;color:#555;">Email</td>
              <td style="padding:10px 0;border-bottom:1px solid #eee;"><a href="mailto:${email}" style="color:#0a2fa6;">${email}</a></td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;color:#555;">Phone</td>
              <td style="padding:10px 0;border-bottom:1px solid #eee;">${phone || 'Not provided'}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;color:#555;">Company</td>
              <td style="padding:10px 0;border-bottom:1px solid #eee;">${company || 'Not provided'}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;color:#555;">Service</td>
              <td style="padding:10px 0;border-bottom:1px solid #eee;">${serviceLabel}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;color:#555;">Budget</td>
              <td style="padding:10px 0;border-bottom:1px solid #eee;">${budgetLabel}</td></tr>
        </table>

        <div style="margin-top:24px;">
          <p style="font-weight:600;color:#555;margin-bottom:8px;">Project Description / Message:</p>
          <div style="background:#fff;border:1px solid #ddd;border-radius:6px;padding:16px;font-size:15px;line-height:1.6;white-space:pre-wrap;">${message}</div>
        </div>

        <div style="margin-top:28px;text-align:center;">
          <a href="mailto:${email}" style="background:#0a2fa6;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;font-size:15px;display:inline-block;">Reply to ${firstName}</a>
        </div>
      </div>
      <p style="color:#aaa;font-size:12px;text-align:center;margin-top:16px;">
        Imperial Engineering Construction Limited &bull; No.6 Akinwande Ogundipe Close, Abule Egba, Lagos
      </p>
    </div>
  `;

  // ── Auto-reply to client ──────────────────────────────────
  const autoReplyEmail = new SibApiV3Sdk.SendSmtpEmail();
  autoReplyEmail.subject = `We received your enquiry — Imperial Engineering Construction Limited`;
  autoReplyEmail.sender  = { name: 'Imperial Engineering Construction', email: 'Talk2iec@imperialengineeringconstruction.com' };
  autoReplyEmail.to      = [{ email, name: `${firstName} ${lastName}` }];
  autoReplyEmail.htmlContent = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">
      <div style="background:#0a2fa6;padding:28px 32px;border-radius:8px 8px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:22px;">Thank You, ${firstName}!</h1>
        <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:14px;">We've received your enquiry.</p>
      </div>
      <div style="background:#f9f9f9;padding:28px 32px;border-radius:0 0 8px 8px;border:1px solid #e5e5e5;border-top:none;">
        <p style="font-size:15px;line-height:1.7;">
          Thank you for reaching out to <strong>Imperial Engineering Construction Limited</strong>. 
          We have received your enquiry and a member of our team will get back to you 
          within <strong>24 hours</strong>.
        </p>
        <p style="font-size:15px;line-height:1.7;">
          In the meantime, if you have any urgent questions, feel free to call us directly at 
          <a href="tel:+2348065360379" style="color:#0a2fa6;font-weight:600;">+234 806 536 0379</a>.
        </p>

        <div style="background:#fff;border-left:4px solid #0a2fa6;padding:16px 20px;margin:24px 0;border-radius:0 6px 6px 0;">
          <p style="margin:0;font-weight:600;font-size:14px;color:#555;margin-bottom:4px;">Your enquiry summary:</p>
          <p style="margin:0;font-size:14px;color:#777;">Service: ${serviceLabel}</p>
          <p style="margin:4px 0 0;font-size:14px;color:#777;">Budget: ${budgetLabel}</p>
        </div>

        <p style="font-size:15px;line-height:1.7;margin-bottom:0;">
          We look forward to working with you and building something great together.
        </p>
        <p style="font-size:15px;margin-top:8px;">
          Warm regards,<br>
          <strong>Imperial Engineering Construction Limited</strong><br>
          <span style="color:#888;font-size:13px;">No.6 Akinwande Ogundipe Close, Abule Egba, Lagos</span>
        </p>
      </div>
      <p style="color:#aaa;font-size:12px;text-align:center;margin-top:16px;">
        &copy; 2026 Imperial Engineering Construction Limited. All rights reserved.
      </p>
    </div>
  `;

  try {
    // Send both emails in parallel
    await Promise.all([
      apiInstance.sendTransacEmail(notificationEmail),
      apiInstance.sendTransacEmail(autoReplyEmail),
    ]);

    console.log(`📩 Enquiry sent successfully from: ${firstName} ${lastName} | ${email}`);
    res.json({ success: true, message: 'Message received. We will get back to you within 24 hours.' });

  } catch (error) {
    console.error('❌ Brevo email error:', error?.response?.body || error.message);
    res.status(500).json({
      success: false,
      message: 'Sorry, there was an issue sending your message. Please try calling us directly at +234 806 536 0379.',
    });
  }
});

// ── 404 fallback ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'views', 'index.html'));
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Imperial Engineering server running on port ${PORT}`);
});