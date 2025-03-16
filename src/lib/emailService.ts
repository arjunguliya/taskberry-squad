
import { toast } from 'sonner';
import { getUserByEmail, updateUserPassword } from './dataService';

/**
 * Sends a password reset email with a reset link
 * Note: In a real application, this would connect to an email service
 * like SendGrid, Mailgun, etc. Here we're simulating the process.
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
    
    // In a real application, this would connect to an email API
    // Just logging it for demonstration purposes
    console.log('Sending password reset email to:', email);
    console.log('Reset link:', `${window.location.origin}/reset-password?token=${token}`);
    
    // In a development/demo environment, provide the link in the UI
    toast.info(
      `Password reset link sent to ${email}. In a real app, an email would be sent. To simulate, use this link: /reset-password?token=${token}`,
      { duration: 10000 }
    );
    
    return true;
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
