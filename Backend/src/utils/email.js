const dns = require('dns');

const sendOTPEmail = async (email, otp) => {
  console.log(`🔑 [OTP VERIFICATION] OTP code for ${email} is: ${otp}`);

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn('⚠️ RESEND_API_KEY is not configured in .env. OTP printed to console above for testing.');
    return true; // Return true so backend behaves as if email was sent during testing
  }

  try {
    console.log(`✉️ Attempting to send OTP email to ${email} via Resend HTTP API...`);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Devclothes <onboarding@resend.dev>',
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
        `
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Resend HTTP API returned an error.');
    }

    console.log(`✉️ OTP email sent to ${email} successfully via Resend! ID: ${data.id}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send OTP email via Resend API:', error);
    throw new Error('Failed to send password reset email. Please try again later.');
  }
};

module.exports = {
  sendOTPEmail,
};
