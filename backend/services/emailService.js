const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Check if credentials exist, otherwise log to console for development testing
  const useRealEmail = 
    process.env.EMAIL_USER && 
    process.env.EMAIL_USER !== 'your_email@gmail.com' &&
    process.env.EMAIL_PASS && 
    process.env.EMAIL_PASS !== 'your_email_app_password';

  if (!useRealEmail) {
    console.log('\n======================================================');
    console.log('DEVELOPMENT EMAIL SIMULATION:');
    console.log(`TO: ${options.email}`);
    console.log(`SUBJECT: ${options.subject}`);
    console.log(`MESSAGE:\n${options.message}`);
    console.log('======================================================\n');
    return { simulated: true };
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Define email options
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'AI To-Do & Diary'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || `<p>${options.message}</p>`,
  };

  // Send email
  const info = await transporter.sendMail(mailOptions);
  console.log(`Message sent: %s`, info.messageId);
  return info;
};

module.exports = sendEmail;
