// server.js

// 1. Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
// Using 4000 as fallback for local dev, Render uses process.env.PORT
const PORT = process.env.PORT || 4000;

// --- 👇 STRICTER CORS CONFIGURATION 👇 ---
const allowedOrigins = [
    'http://localhost:5173', // Your local frontend dev URL
    'https://my-portfolio-bd3e.onrender.com' // <<--- REPLACE WITH YOUR DEPLOYED FRONTEND URL LATER
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests) for testing,
    // or requests from allowed origins
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));
// --- 👆 END OF CORS CONFIGURATION 👆 ---

app.use(express.json()); // Middleware to parse JSON bodies

// Simple test route
app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

// Nodemailer Transporter using environment variables
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // false for port 587 (STARTTLS)
  auth: {
    user: process.env.GMAIL_USER,       // From .env or Render env vars
    pass: process.env.GMAIL_APP_PASS    // From .env or Render env vars
  },
});

// API Endpoint to Send Email
app.post('/api/send-message', async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Basic validation
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Email options
  const mailOptions = {
    from: `"${name}" <${email}>`,        // Sender info from form
    to: process.env.MAIL_TO,            // Your receiving email from env vars
    subject: `Portfolio Contact: ${subject}`,
    text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
  };

  // Send email logic with error handling
  try {
    // Verify connection config (optional check)
    await transporter.verify();
    console.log('📬 Transporter configured correctly.');

    // Send the mail
    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully via Gmail');
    res.status(200).json({ success: 'Message sent successfully!' });

  } catch (error) {
    console.error('❌ Error during email process:', error);
    // Specific error responses
    if (error.code === 'EAUTH' || (error.responseCode && error.responseCode === 535)) {
        console.error('Authentication Error: Check GMAIL_USER and GMAIL_APP_PASS.');
        res.status(401).json({ error: 'Authentication failed. Check server configuration.' });
    } else if (error.code === 'ECONNECTION' || error.command === 'CONN') {
         console.error('Connection Error: Could not connect to SMTP server.');
         res.status(503).json({ error: 'Could not connect to email server.' });
    } else {
        res.status(500).json({ error: 'Failed to send message. Please check server logs.' });
    }
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${5173}`);
});
