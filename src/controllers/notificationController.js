const nodemailer = require('nodemailer');

// Function to send a notification via email
exports.sendNotification = async (req, res) => {
  const { type, recipient, message } = req.body;

  if (!type || !recipient || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GOOGLE_EMAIL,
      pass: process.env.GOOGLE_PASSWORD
    }
  });

  const mailOptions = {
    from: process.env.GOOGLE_EMAIL,
    to: recipient,
    subject: 'Appointment Notification',
    text: message
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ status: 'Notification sent' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send notification' });
  }
};
