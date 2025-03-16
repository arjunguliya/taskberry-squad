
import { toast } from 'sonner';
import { getUserByEmail, updateUserPassword } from './dataService';

// Email service configuration
// In a real application, you'd use environment variables for these settings
interface EmailConfig {
  apiKey: string;
  from: string;
  service: 'sendgrid' | 'mailgun' | 'smtp' | 'mock';
}

// Default to mock service for development
const emailConfig: EmailConfig = {
  apiKey: 'your-api-key',
  from: 'noreply@chatzy-taskmaster.com',
  service: 'mock'
};

/**
 * Configure the email service
 * In a production app, you would call this with values from environment variables
 */
export const configureEmailService = (config: Partial<EmailConfig>): void => {
  Object.assign(emailConfig, config);
};

/**
 * Interface for email data
 */
interface EmailData {
  to: string;
  from?: string; // Added the missing from property
  subject: string;
  html: string;
  text?: string;
}

/**
 * Abstract email sender interface
 */
interface EmailSender {
  send(data: EmailData): Promise<boolean>;
}

/**
 * Mock email sender for development/testing
 */
class MockEmailSender implements EmailSender {
  async send(data: EmailData): Promise<boolean> {
    console.log('MOCK EMAIL SERVICE');
    console.log('-------------------');
    console.log(`To: ${data.to}`);
    console.log(`Subject: ${data.subject}`);
    console.log('Content:');
    console.log(data.text || data.html);
    console.log('-------------------');
    return true;
  }
}

/**
 * SendGrid email sender implementation
 * In a real app, you would install the @sendgrid/mail package
 */
class SendGridEmailSender implements EmailSender {
  private apiKey: string;
  private from: string;

  constructor(apiKey: string, from: string) {
    this.apiKey = apiKey;
    this.from = from;
  }

  async send(data: EmailData): Promise<boolean> {
    try {
      // This is just a placeholder. In a real app, you would:
      // 1. Import @sendgrid/mail
      // 2. Configure it with this.apiKey
      // 3. Send the email using their API
      console.log('Would send via SendGrid:', data);
      
      // Simulate API call
      return true;
    } catch (error) {
      console.error('SendGrid error:', error);
      return false;
    }
  }
}

/**
 * Mailgun email sender implementation
 * In a real app, you would install the mailgun-js package
 */
class MailgunEmailSender implements EmailSender {
  private apiKey: string;
  private from: string;

  constructor(apiKey: string, from: string) {
    this.apiKey = apiKey;
    this.from = from;
  }

  async send(data: EmailData): Promise<boolean> {
    try {
      // This is just a placeholder. In a real app, you would:
      // 1. Import mailgun-js
      // 2. Configure it with this.apiKey
      // 3. Send the email using their API
      console.log('Would send via Mailgun:', data);
      
      // Simulate API call
      return true;
    } catch (error) {
      console.error('Mailgun error:', error);
      return false;
    }
  }
}

/**
 * SMTP email sender implementation
 * In a real app, you would install the nodemailer package
 */
class SmtpEmailSender implements EmailSender {
  private apiKey: string;
  private from: string;

  constructor(apiKey: string, from: string) {
    this.apiKey = apiKey;
    this.from = from;
  }

  async send(data: EmailData): Promise<boolean> {
    try {
      // This is just a placeholder. In a real app, you would:
      // 1. Import nodemailer
      // 2. Configure it with SMTP settings
      // 3. Send the email using the transport
      console.log('Would send via SMTP:', data);
      
      // Simulate API call
      return true;
    } catch (error) {
      console.error('SMTP error:', error);
      return false;
    }
  }
}

/**
 * Get the appropriate email sender based on configuration
 */
function getEmailSender(): EmailSender {
  switch (emailConfig.service) {
    case 'sendgrid':
      return new SendGridEmailSender(emailConfig.apiKey, emailConfig.from);
    case 'mailgun':
      return new MailgunEmailSender(emailConfig.apiKey, emailConfig.from);
    case 'smtp':
      return new SmtpEmailSender(emailConfig.apiKey, emailConfig.from);
    case 'mock':
    default:
      return new MockEmailSender();
  }
}

/**
 * Send an email using the configured service
 */
export async function sendEmail(data: EmailData): Promise<boolean> {
  const sender = getEmailSender();
  return sender.send({
    ...data,
    from: emailConfig.from
  });
}

/**
 * Generate a password reset email with HTML content
 */
function generatePasswordResetEmail(email: string, resetUrl: string): EmailData {
  const subject = 'Reset Your Chatzy TaskMaster Password';
  
  // HTML version of the email
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f0f0f0; padding: 20px; text-align: center;">
        <h1 style="color: #333;">Chatzy TaskMaster</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; background-color: #fff;">
        <h2>Password Reset Request</h2>
        <p>We received a request to reset your password for your Chatzy TaskMaster account.</p>
        <p>Please click the button below to reset your password. This link will expire in 1 hour.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
        <p>If the button doesn't work, copy and paste this URL into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
      </div>
      <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
        <p>This is an automated email. Please do not reply.</p>
        <p>&copy; ${new Date().getFullYear()} Chatzy TaskMaster. All rights reserved.</p>
      </div>
    </div>
  `;
  
  // Text version for email clients that don't support HTML
  const text = `
    CHATZY TASKMASTER
    
    PASSWORD RESET REQUEST
    
    We received a request to reset your password for your Chatzy TaskMaster account.
    
    Please visit the following link to reset your password:
    ${resetUrl}
    
    If you didn't request a password reset, you can safely ignore this email.
    
    This is an automated email. Please do not reply.
    
    © ${new Date().getFullYear()} Chatzy TaskMaster. All rights reserved.
  `;
  
  return {
    to: email,
    subject,
    html,
    text
  };
}

/**
 * Sends a password reset email with a reset link
 */
export const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
  try {
    // Check if the user exists
    const user = getUserByEmail(email);
    
    if (!user) {
      // For security reasons, don't indicate if the email exists or not
      console.log(`Reset requested for non-existent email: ${email}`);
      return true; // Return true to simulate success even for non-existent users
    }
    
    // Generate a token (in a real app, this would be a secure token stored in a database)
    const token = btoa(`reset-${email}-${Date.now()}`);
    
    // Create the reset URL
    const resetUrl = `${window.location.origin}/reset-password?token=${token}`;
    
    // Generate and send the email
    const emailData = generatePasswordResetEmail(email, resetUrl);
    const success = await sendEmail(emailData);
    
    if (success) {
      console.log('Password reset email sent successfully to:', email);
      
      // For development, provide the reset link in the UI
      if (emailConfig.service === 'mock') {
        toast.info(
          `Password reset email sent to ${email}. In a development environment, use this link: /reset-password?token=${token}`,
          { duration: 10000 }
        );
      } else {
        toast.success(`Password reset instructions sent to ${email}`);
      }
    } else {
      console.error('Failed to send password reset email');
      toast.error('Failed to send reset instructions. Please try again later.');
    }
    
    return success;
  } catch (error) {
    console.error('Error sending reset email:', error);
    return false;
  }
};

/**
 * Reset a user's password with the provided token
 */
export const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
  try {
    // In a real app, you would validate this token against a database
    // Here we're just decoding it and extracting the email
    const decodedToken = atob(token);
    
    if (!decodedToken.startsWith('reset-')) {
      return false;
    }
    
    // Extract the email from the token
    const tokenParts = decodedToken.split('-');
    const email = tokenParts[1];
    
    if (!email) {
      return false;
    }
    
    // Update the user's password
    return updateUserPassword(email, newPassword);
  } catch (error) {
    console.error('Error resetting password:', error);
    return false;
  }
};
