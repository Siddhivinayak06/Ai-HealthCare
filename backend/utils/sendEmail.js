const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Create a transporter (using Ethereal for testing if no env vars)
    // In production, these should be in .env

    let transporter;

    if (process.env.SMTP_HOST) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });
    } else {
        // Fallback to Ethereal for dev/demo if no real SMTP provided
        const testAccount = await nodemailer.createTestAccount();
        console.log('Using Ethereal Email for testing');
        console.log('Ethereal User:', testAccount.user);
        console.log('Ethereal Pass:', testAccount.pass);

        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
    }

    const message = {
        from: `${process.env.FROM_NAME || 'AI Healthcare'} <${process.env.FROM_EMAIL || 'noreply@medai.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    const info = await transporter.sendMail(message);

    console.log('Message sent: %s', info.messageId);
    // Preview only available when sending through an Ethereal account
    if (!process.env.SMTP_HOST) {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
};

module.exports = sendEmail;
