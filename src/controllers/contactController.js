const nodemailer = require("nodemailer");

// Controller to handle sending contact emails
exports.sendContactEmail = async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: "All fields are required." });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS,
            },
        });

        const mailOptions = {
            from: email,
            to: process.env.GMAIL_USER,
            subject: `Contact Form Submission from ${name}`,
            text: message,
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Email sent successfully." });
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ error: "Failed to send email." });
    }
};
