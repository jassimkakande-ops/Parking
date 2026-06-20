const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { successResponse, errorResponse } = require('../../utils/apiResponse');

router.post('/', async (req, res, next) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json(errorResponse('Name, email, and message are required', 400));
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('EMAIL_USER and EMAIL_PASS not configured. Contact form submission skipped.');
      return res.status(200).json(successResponse({ status: 'ok', note: 'Email not configured but request received' }));
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'parkeaseuganda@gmail.com', // Sending to ParkEase
      subject: `New Contact Request from ${name}`,
      text: `You have received a new message from the ParkEase Landing Page.
      
Name: ${name}
Email: ${email}
Message:
${message}
`,
      replyTo: email,
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json(successResponse({ status: 'success', message: 'Message sent successfully' }));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
