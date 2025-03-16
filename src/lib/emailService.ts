
import { toast } from 'sonner';
import { getUserByEmail } from './dataService';

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
      <div className="space-y-2">
        <p>In a real app, an email would be sent to {email}</p>
        <p className="text-xs">
          <a 
            href={`/reset-password?token=${token}`}
            className="underline text-blue-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            Click here to simulate opening the reset link
          </a>
        </p>
      </div>,
      { duration: 10000 }
    );
    
    return true;
  } catch (error) {
    console.error('Error sending reset email:', error);
    return false;
  }
};
