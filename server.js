// server.js

// 1. Load environment variables from .env file
require('dotenv').config(); // Add this line at the very top

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5173;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

// --- 👇 UPDATE TRANSPORTER AND MAILOPTIONS 👇 ---

// 2. Use process.env to access the variables
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,       // Use variable
    pass: process.env.GMAIL_APP_PASS    // Use variable
  },
});

app.post('/api/send-message', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const mailOptions = {
    from: `"${name}" <${email}>`,
    to: process.env.MAIL_TO,            // Use variable
    subject: `Portfolio Contact: ${subject}`,
    text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
  };

  try {
    // 3. Verify transporter connection (optional but good practice)
    await transporter.verify(); // Check if credentials are valid
    console.log('📬 Transporter configured correctly.');

    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully via Gmail');
    res.status(200).json({ success: 'Message sent successfully!' });
  } catch (error) {
    console.error('❌ Error during email process:', error);
    if (error.code === 'EAUTH' || (error.responseCode && error.responseCode === 535)) {
        console.error('Authentication Error: Check GMAIL_USER and GMAIL_APP_PASS in .env file.');
        res.status(401).json({ error: 'Authentication failed. Check server configuration.' });
    } else if (error.code === 'ECONNECTION' || error.command === 'CONN') {
         console.error('Connection Error: Could not connect to SMTP server. Check host/port.');
         res.status(503).json({ error: 'Could not connect to email server.' });
    }
     else {
        res.status(500).json({ error: 'Failed to send message. Please check server logs.' });
    }
  }
});

// --- 👆 END OF UPDATES 👆 ---

app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${5173}`);
});