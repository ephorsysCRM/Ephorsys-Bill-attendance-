import nodemailer from 'nodemailer';

/**
 * Interface for SMTP configuration
 */
interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

/**
 * Retrieve SMTP configuration from environment variables
 */
function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  return {
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  };
}

/**
 * Create or reuse nodemailer transport
 */
function createTransporter() {
  const config = getSmtpConfig();

  if (!config) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });
}

/**
 * Send Password Reset OTP Email
 */
export async function sendOtpEmail(toEmail: string, otp: string, userName?: string): Promise<{ success: boolean; simulated?: boolean }> {
  const transporter = createTransporter();
  const fromAddress = process.env.SMTP_FROM || `"${process.env.SMTP_FROM_NAME || 'Ephorsys Security'}" <${process.env.SMTP_USER || 'no-reply@ephorsys.com'}>`;
  const recipientName = userName || 'Admin';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ephorsys Admin Password Reset OTP</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #0b0f17;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #e2e8f0;
        }
        .container {
          max-width: 580px;
          margin: 40px auto;
          background: #111827;
          border: 1px solid #1f2937;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
        }
        .header {
          background: linear-gradient(135deg, #064e3b 0%, #022c22 100%);
          padding: 32px 30px;
          text-align: center;
          border-bottom: 1px solid #059669;
        }
        .logo-title {
          color: #ffffff;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.5px;
          margin: 0;
        }
        .sub-header {
          color: #34d399;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-top: 6px;
          font-weight: 600;
        }
        .content {
          padding: 36px 32px;
        }
        .greeting {
          font-size: 17px;
          font-weight: 600;
          color: #f1f5f9;
          margin-bottom: 16px;
        }
        .message {
          font-size: 15px;
          line-height: 1.6;
          color: #94a3b8;
          margin-bottom: 28px;
        }
        .otp-box {
          background: #030712;
          border: 2px dashed #10b981;
          border-radius: 12px;
          padding: 22px 16px;
          text-align: center;
          margin: 28px 0;
        }
        .otp-label {
          font-size: 12px;
          text-transform: uppercase;
          color: #6ee7b7;
          letter-spacing: 1.5px;
          margin-bottom: 8px;
          font-weight: 600;
        }
        .otp-code {
          font-family: 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
          font-size: 38px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 12px;
          text-indent: 12px;
          margin: 0;
        }
        .expiry-badge {
          display: inline-block;
          margin-top: 10px;
          padding: 4px 12px;
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }
        .warning-box {
          background: #1e1b4b15;
          border-left: 4px solid #f59e0b;
          background-color: rgba(245, 158, 11, 0.08);
          padding: 14px 16px;
          border-radius: 0 8px 8px 0;
          margin: 26px 0;
          font-size: 13px;
          line-height: 1.5;
          color: #fbbf24;
        }
        .security-list {
          margin: 20px 0;
          padding-left: 20px;
          color: #64748b;
          font-size: 13px;
          line-height: 1.6;
        }
        .footer {
          background: #0b0f17;
          padding: 24px 30px;
          text-align: center;
          border-top: 1px solid #1f2937;
          font-size: 12px;
          color: #475569;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-title">Ephorsys Pvt Ltd</div>
          <div class="sub-header">Billing & Attendance Management</div>
        </div>
        <div class="content">
          <div class="greeting">Hello, ${recipientName}</div>
          <div class="message">
            We received a request to reset the password for your administrative account. Use the one-time verification code below to authorize this request:
          </div>

          <div class="otp-box">
            <div class="otp-label">Verification OTP Code</div>
            <div class="otp-code">${otp}</div>
            <div class="expiry-badge">⏱ Expires in 10 minutes</div>
          </div>

          <div class="warning-box">
            <strong>Security Notice:</strong> Never share this verification code with anyone. Ephorsys administrators or support staff will never ask for your OTP.
          </div>

          <div class="message" style="margin-bottom: 0;">
            If you did not request this password reset, please disregard this email or change your password immediately if you suspect unauthorized access.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Ephorsys Pvt Ltd. All rights reserved.<br/>
          This is an automated security transmission. Please do not reply directly to this email.
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Ephorsys Pvt Ltd - Admin Password Reset OTP

Hello ${recipientName},

We received a request to reset the password for your administrator account.
Your 6-digit verification code is: ${otp}

This code will expire in 10 minutes.

Security Notice: Never share this OTP with anyone. Ephorsys staff will never request this code.
If you did not initiate this request, you can safely ignore this email.

© ${new Date().getFullYear()} Ephorsys Pvt Ltd.
  `.trim();

  if (!transporter) {
    // Development / fallback mode when SMTP is not configured yet
    console.log('\n======================================================');
    console.log(' [SECURITY] NODEMAILER SMTP NOT CONFIGURED');
    console.log(` [OTP CODE FOR TESTING]: >>> ${otp} <<<`);
    console.log(` [RECIPIENT]: ${toEmail}`);
    console.log(' [ACTION REQUIRED]: Configure SMTP_HOST, SMTP_USER, SMTP_PASS in .env to send live emails.');
    console.log('======================================================\n');
    return { success: true, simulated: true };
  }

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `[${otp}] Ephorsys Admin Password Reset OTP`,
      text: textContent,
      html: htmlContent,
    });
    return { success: true, simulated: false };
  } catch (error) {
    console.error('Failed to send OTP email via nodemailer:', error);
    // In dev mode, log the OTP anyway to allow recovery
    console.log(`[FALLBACK] OTP for ${toEmail}: ${otp}`);
    throw error;
  }
}

/**
 * Send Confirmation Email after Password has been Successfully Reset
 */
export async function sendPasswordResetSuccessEmail(toEmail: string, userName?: string): Promise<{ success: boolean }> {
  const transporter = createTransporter();
  const fromAddress = process.env.SMTP_FROM || `"${process.env.SMTP_FROM_NAME || 'Ephorsys Security'}" <${process.env.SMTP_USER || 'no-reply@ephorsys.com'}>`;
  const recipientName = userName || 'Admin';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Successful</title>
      <style>
        body {
          margin: 0; padding: 0; background-color: #0b0f17;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #e2e8f0;
        }
        .container {
          max-width: 580px; margin: 40px auto; background: #111827;
          border: 1px solid #1f2937; border-radius: 16px; overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #064e3b 0%, #022c22 100%);
          padding: 28px; text-align: center; border-bottom: 1px solid #059669;
        }
        .logo-title { color: #ffffff; font-size: 20px; font-weight: 700; margin: 0; }
        .content { padding: 32px; }
        .success-badge {
          display: inline-block; background: rgba(16, 185, 129, 0.2);
          color: #10b981; border: 1px solid #059669; padding: 6px 16px;
          border-radius: 20px; font-weight: 600; font-size: 13px; margin-bottom: 20px;
        }
        .greeting { font-size: 17px; font-weight: 600; color: #f1f5f9; margin-bottom: 12px; }
        .message { font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px; }
        .alert-box {
          background-color: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444;
          padding: 14px 16px; border-radius: 0 8px 8px 0; margin: 24px 0;
          font-size: 13px; line-height: 1.5; color: #fca5a5;
        }
        .footer {
          background: #0b0f17; padding: 20px; text-align: center;
          border-top: 1px solid #1f2937; font-size: 12px; color: #475569;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-title">Ephorsys Pvt Ltd</div>
        </div>
        <div class="content">
          <div class="success-badge">✓ Password Changed</div>
          <div class="greeting">Hello, ${recipientName}</div>
          <div class="message">
            This confirmation email notifies you that the password for your Ephorsys Administrator account was changed successfully on <strong>${new Date().toUTCString()}</strong>.
          </div>
          <div class="alert-box">
            <strong>Did not perform this action?</strong> If you did not authorize this change, please immediately reset your password and contact the security administrator.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Ephorsys Pvt Ltd. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  if (!transporter) {
    console.log(`[SECURITY EMAIL SIMULATED] Password reset success email logged for ${toEmail}`);
    return { success: true };
  }

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: 'Security Alert: Your Ephorsys Admin Password Was Reset',
      html: htmlContent,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send password reset confirmation email:', error);
    return { success: false };
  }
}
