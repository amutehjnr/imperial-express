const express        = require('express');
const path           = require('path');
const brevoModule = require('@getbrevo/brevo');
const BrevoClient = brevoModule.BrevoClient || brevoModule.default?.BrevoClient;

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Brevo Client Setup ──────────────────────────────────────
const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,  // set this in your environment
});

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

  // Server-side validation
  if (!firstName || !lastName || !email || !message) {
    return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
  }

  if (!process.env.BREVO_API_KEY) {
    console.error('❌ BREVO_API_KEY environment variable is not set.');
    return res.status(500).json({ success: false, message: 'Server configuration error. Please contact us directly.' });
  }

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
  const fullName     = `${firstName} ${lastName}`;

  const notificationPayload = {
    subject: `New Enquiry from ${fullName} — Imperial Engineering`,
    sender:  { name: 'Imperial Engineering Website', email: 'Talk2iec@imperialengineeringconstruction.com' },
    to:      [{ email: 'Talk2iec@imperialengineeringconstruction.com', name: 'Imperial Engineering' }],
    replyTo: { email, name: fullName },
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">
        <div style="background:#0a2fa6;padding:28px 32px;border-radius:8px 8px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:22px;">New Project Enquiry</h1>
          <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:14px;">Received via imperialengineeringconstruction.com</p>
        </div>
        <div style="background:#f9f9f9;padding:28px 32px;border-radius:0 0 8px 8px;border:1px solid #e5e5e5;border-top:none;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;width:38%;color:#555;">Full Name</td>
                <td style="padding:10px 0;border-bottom:1px solid #eee;">${fullName}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;color:#555;">Email</td>
                <td style="padding:10px 0;border-bottom:1px solid #eee;"><a href="mailto:${email}" style="color:#0a2fa6;">${email}</a></td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;color:#555;">Phone</td>
                <td style="padding:10px 0;border-bottom:1px solid #eee;">${phone || 'Not provided'}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;color:#555;">Company</td>
                <td style="padding:10px 0;border-bottom:1px solid #eee;">${company || 'Not provided'}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;color:#555;">Service</td>
                <td style="padding:10px 0;border-bottom:1px solid #eee;">${serviceLabel}</td></tr>
            <tr><td style="padding:10px 0;font-weight:600;color:#555;">Budget</td>
                <td style="padding:10px 0;">${budgetLabel}</td></tr>
          </table>
          <div style="margin-top:24px;">
            <p style="font-weight:600;color:#555;margin-bottom:8px;">Project Description / Message:</p>
            <div style="background:#fff;border:1px solid #ddd;border-radius:6px;padding:16px;font-size:15px;line-height:1.6;white-space:pre-wrap;">${message}</div>
          </div>
          <div style="margin-top:28px;text-align:center;">
            <a href="mailto:${email}" style="background:#0a2fa6;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;font-size:15px;display:inline-block;">Reply to ${firstName}</a>
          </div>
        </div>
        <p style="color:#aaa;font-size:12px;text-align:center;margin-top:16px;">Imperial Engineering Construction Limited &bull; Abule Egba, Lagos</p>
      </div>
    `,
  };

  const autoReplyPayload = {
    subject: `We received your enquiry — Imperial Engineering Construction Limited`,
    sender:  { name: 'Imperial Engineering Construction', email: 'Talk2iec@imperialengineeringconstruction.com' },
    to:      [{ email, name: fullName }],
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">
        <div style="background:#0a2fa6;padding:28px 32px;border-radius:8px 8px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:22px;">Thank You, ${firstName}!</h1>
          <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:14px;">We've received your enquiry.</p>
        </div>
        <div style="background:#f9f9f9;padding:28px 32px;border-radius:0 0 8px 8px;border:1px solid #e5e5e5;border-top:none;">
          <p style="font-size:15px;line-height:1.7;">Thank you for reaching out to <strong>Imperial Engineering Construction Limited</strong>. We have received your enquiry and a member of our team will get back to you within <strong>24 hours</strong>.</p>
          <p style="font-size:15px;line-height:1.7;">If you have any urgent questions, feel free to call us at <a href="tel:+2348065360379" style="color:#0a2fa6;font-weight:600;">+234 806 536 0379</a>.</p>
          <div style="background:#fff;border-left:4px solid #0a2fa6;padding:16px 20px;margin:24px 0;border-radius:0 6px 6px 0;">
            <p style="margin:0;font-weight:600;font-size:14px;color:#555;margin-bottom:4px;">Your enquiry summary:</p>
            <p style="margin:0;font-size:14px;color:#777;">Service: ${serviceLabel}</p>
            <p style="margin:4px 0 0;font-size:14px;color:#777;">Budget: ${budgetLabel}</p>
          </div>
          <p style="font-size:15px;margin-top:8px;">Warm regards,<br><strong>Imperial Engineering Construction Limited</strong></p>
        </div>
        <p style="color:#aaa;font-size:12px;text-align:center;margin-top:16px;">&copy; 2026 Imperial Engineering Construction Limited.</p>
      </div>
    `,
  };

  try {
    await Promise.all([
      brevo.transactionalEmails.sendTransacEmail(notificationPayload),
      brevo.transactionalEmails.sendTransacEmail(autoReplyPayload),
    ]);
    console.log(`📩 Enquiry from: ${fullName} | ${email}`);
    res.json({ success: true, message: 'Message received. We will get back to you within 24 hours.' });
  } catch (error) {
    const errBody = error?.response?.data || error?.message || error;
    console.error('❌ Brevo error:', JSON.stringify(errBody, null, 2));
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