import nodemailer from 'nodemailer';

// In a production environment, you would use a proper email service like SendGrid, Mailgun, etc.
// For development, we'll use a test account from Ethereal Email
let transporter: nodemailer.Transporter;

async function createTransporter() {
  if (transporter) {
    return transporter;
  }

  // For production
  if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT) || 587,
      secure: process.env.EMAIL_SERVER_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });
    
    // Verify connection configuration
    try {
      await transporter.verify();
      console.log('SMTP connection verified successfully');
    } catch (error) {
      console.error('SMTP connection verification failed:', error);
    }
    
    return transporter;
  }

  // For development - create a test account
  try {
    const testAccount = await nodemailer.createTestAccount();
    console.log('Created test email account:', testAccount.user);
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    
    return transporter;
  } catch (error) {
    console.error('Failed to create test email account:', error);
    throw error;
  }
}

export async function sendVerificationEmail(email: string, otp: string) {
  try {
    const transport = await createTransporter();
    
    const mailOptions = {
      from: 'Daddy\'s AI <daddysartificialintelligence@gmail.com>', // Sender name and email
      to: email, // Recipient email
      subject: 'Confirm Your Daddy\'s AI Registration', // Email subject
      html: `
          <div style="font-family: 'Poppins', sans-serif; background: linear-gradient(135deg,rgb(73, 53, 26),rgb(67, 40, 32),rgb(100, 69, 44)); color: #ffffff; padding: 40px; border-radius: 12px; max-width: 600px; margin: 0 auto; text-align: center; box-shadow: 0 10px 30px rgba(8, 7, 6, 0.25);">
              <!-- Header -->
              <h2 style="font-weight: 600; font-size: 1.8rem; margin-bottom: 20px; background: linear-gradient(90deg, #fff, #d0e1ff); background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: 0.5px;">
                  Daddy's AI Chatbot
              </h2>

              <!-- Body -->
              <div style="font-size: 16px; line-height: 1.6;">
                  <p style="margin-bottom: 20px;">
                      Hi <strong>${email.split('@')[0]}</strong>,
                  </p>
                  <p style="margin-bottom: 20px;">
                      Thank you for registering with <strong>Daddy's AI Chatbot</strong>. Your One-Time Password (OTP) for completing your registration is:
                  </p>

                  <!-- OTP Box -->
                  <div style="background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 8px; margin: 20px 0; display: inline-block;">
                      <h2 style="color:rgb(206, 115, 41); margin: 0; font-size: 32px; letter-spacing: 2px;">${otp}</h2>
                  </div>

                  <!-- Instructions -->
                  <p style="margin-bottom: 20px;">
                      This OTP is valid for <strong>10 minutes</strong>. Please do not share it with anyone for security reasons.
                  </p>
                  <p style="margin-bottom: 20px;">
                      If you did not request this OTP, please ignore this email or contact our support team immediately.
                  </p>
              </div>

              <!-- Footer -->
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.2); font-size: 14px;">
                  <p style="margin: 0;">
                      Best regards,<br>
                      <strong>Team Daddy's AI</strong>
                  </p>
                  <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.7);">
                      This is an automated message. Please do not reply directly to this email.
                  </p>
              </div>
          </div>
      `,
    };

    const info = await transport.sendMail(mailOptions);
    
    // Log the URL for development environments
    if (!process.env.EMAIL_SERVER) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw error;
  }
}

// Function to send a welcome email after verification
export async function sendWelcomeEmail(email: string, username: string) {
  try {
    const transport = await createTransporter();
    
    const mailOptions = {
      from: 'Daddy\'s AI <daddysartificialintelligence@gmail.com>',
      to: email,
      subject: 'Welcome to Daddy\'s AI!',
      html: `
        <div style="font-family: 'Poppins', sans-serif; background: linear-gradient(135deg,rgb(73, 53, 26),rgb(67, 40, 32),rgb(100, 69, 44)); color: #ffffff; padding: 40px; border-radius: 12px; max-width: 600px; margin: 0 auto; text-align: center; box-shadow: 0 10px 30px rgba(8, 7, 6, 0.25);">
            <!-- Header -->
            <h2 style="font-weight: 600; font-size: 1.8rem; margin-bottom: 20px; background: linear-gradient(90deg, #fff, #d0e1ff); background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: 0.5px;">
                Daddy's AI Chatbot
            </h2>

            <!-- Body -->
            <div style="font-size: 16px; line-height: 1.6;">
                <p style="margin-bottom: 20px;">
                    Hi <strong>${username}</strong>,
                </p>
                <p style="margin-bottom: 20px;">
                    Welcome to <strong>Daddy's AI Chatbot</strong>! Your account has been successfully verified and is now ready to use.
                </p>

                <!-- Welcome Message -->
                <div style="background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #ffffff;">
                        We're excited to have you on board! Explore our features and start chatting with Daddy's AI.
                    </p>
                </div>

                <!-- CTA Button -->
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard" 
                   style="background: linear-gradient(90deg, #f97316, #fb923c); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-top: 20px;">
                    Go to Dashboard
                </a>
            </div>

            <!-- Footer -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.2); font-size: 14px;">
                <p style="margin: 0;">
                    Best regards,<br>
                    <strong>Team Daddy's AI</strong>
                </p>
                <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.7);">
                    This is an automated message. Please do not reply directly to this email.
                </p>
            </div>
        </div>
      `,
    };

    const info = await transport.sendMail(mailOptions);
    
    // Log the URL for development environments
    if (!process.env.EMAIL_SERVER) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
} 