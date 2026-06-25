const nodemailer = require('nodemailer');
const dns = require('dns');

// Force Node.js to prioritize IPv4 over IPv6. 
// Deployed environments (like Render) often lack IPv6 route support, causing IPv6 SMTP connections to fail with ENETUNREACH.
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const sendOTPEmail = async (email, otp) => {
  console.log(`🔑 [OTP VERIFICATION] OTP code for ${email} is: ${otp}`);

  const { SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('⚠️ SMTP_USER and SMTP_PASS are not configured in .env. OTP printed to console above for testing.');
    return true; // Return true so backend behaves as if email was sent during testing
  }

  try {
    console.log(`✉️ Attempting to send OTP email to ${email} via Gmail SMTP...`);
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      connectionTimeout: 5000, // 5 seconds connection timeout
      greetingTimeout: 5000,   // 5 seconds greeting timeout
      socketTimeout: 5000,     // 5 seconds socket timeout
      // Custom DNS lookup to force IPv4 (family: 4) and prevent IPv6 connection hangs/errors
      lookup: (hostname, options, callback) => {
        dns.lookup(hostname, { ...options, family: 4 }, (err, addresses, family) => {
          if (err) return callback(err);
          if (Array.isArray(addresses)) {
            return callback(null, addresses.filter(addr => addr.family === 4));
          }
          return callback(null, addresses, family);
        });
      }
    });

    const mailOptions = {
      from: `"Devclothes" <${SMTP_USER}>`,
      to: email,
      subject: 'Devclothes - Password Reset Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #000; text-align: center; letter-spacing: 1px;">DEVCLOTHES</h2>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
          <p>Hello,</p>
          <p>We received a request to reset your password. Please use the following One-Time Password (OTP) to complete the verification process:</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; text-align: center; margin: 25px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #000;">${otp}</span>
          </div>
          <p style="color: #666; font-size: 13px;">This OTP is valid for 15 minutes. If you did not request this, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
          <p style="color: #999; font-size: 11px; text-align: center;">&copy; ${new Date().getFullYear()} Devclothes. All rights reserved.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✉️ OTP email sent to ${email} successfully!`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send OTP email via SMTP:', error);
    throw new Error('Failed to send password reset email. Please try again later.');
  }
};

module.exports = {
  sendOTPEmail,
};
