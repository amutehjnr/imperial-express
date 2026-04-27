const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ──────────────────────────────────────────────────
app.get('/',          (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/services',  (req, res) => res.sendFile(path.join(__dirname, 'views', 'services.html')));
app.get('/contact',   (req, res) => res.sendFile(path.join(__dirname, 'views', 'contact.html')));

// Contact form POST handler
app.post('/send-message', (req, res) => {
  const { firstName, lastName, email, phone, company, service, budget, message } = req.body;
  // Log submission (replace with nodemailer / DB in production)
  console.log('📩 New enquiry from:', firstName, lastName, '|', email);
  res.json({ success: true, message: 'Message received. We will get back to you within 24 hours.' });
});

// 404 fallback
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'views', 'index.html'));
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Imperial Engineering server running on port ${PORT}`);
});
