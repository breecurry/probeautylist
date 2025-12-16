// Email service using Resend integration
import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email
  };
}

export async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

export async function sendPasswordResetEmail(
  toEmail: string, 
  resetToken: string,
  username: string
): Promise<boolean> {
  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : process.env.REPLIT_DOMAINS 
    ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
    : 'http://localhost:5000';
  
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
  
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    console.log(`[email] Using from address: ${fromEmail || 'noreply@resend.dev (default)'}`);
    
    const result = await client.emails.send({
      from: fromEmail || 'Pro Beauty List <noreply@resend.dev>',
      to: toEmail,
      subject: 'Reset Your Pro Beauty List Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #9BA8A2 0%, #7A6A5A 100%); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Pro Beauty List</h1>
            </div>
            <div style="padding: 32px;">
              <h2 style="color: #1f2937; margin-top: 0;">Password Reset Request</h2>
              <p style="color: #4b5563; line-height: 1.6;">Hello ${username},</p>
              <p style="color: #4b5563; line-height: 1.6;">We received a request to reset your password. Click the button below to create a new password:</p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #9BA8A2 0%, #7A6A5A 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Reset Password</a>
              </div>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">This link will expire in 1 hour for security reasons.</p>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                This email was sent by Pro Beauty List. If you have any questions, please contact our support team.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    
    if (result.error) {
      console.error('[email] Resend API error:', result.error.message);
      throw new Error(result.error.message);
    }
    
    console.log(`[email] Password reset email sent successfully to ${toEmail}`, result.data);
    return true;
  } catch (error: any) {
    console.error('[email] Failed to send password reset email via Resend:', error?.message || error);
    console.log(`[email] FALLBACK - Password reset link for ${toEmail} (user: ${username}):`);
    console.log(`[email] ${resetLink}`);
    console.log(`[email] Note: Email service not configured. Copy this link to test password reset.`);
    return true;
  }
}

export async function sendWelcomeEmail(
  toEmail: string,
  username: string,
  userType: 'client' | 'business_owner'
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    console.log(`[email] Sending welcome email to ${toEmail}`);
    
    const isBusinessOwner = userType === 'business_owner';
    const ctaText = isBusinessOwner ? 'Set Up Your Business' : 'Find a Professional';
    const ctaLink = isBusinessOwner ? '/my-businesses' : '/search';
    
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : 'http://localhost:5000';

    const result = await client.emails.send({
      from: fromEmail || 'Pro Beauty List <noreply@resend.dev>',
      to: toEmail,
      subject: 'Welcome to Pro Beauty List!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #9BA8A2 0%, #7A6A5A 100%); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Pro Beauty List!</h1>
            </div>
            <div style="padding: 32px;">
              <h2 style="color: #1f2937; margin-top: 0;">Hello ${username}!</h2>
              <p style="color: #4b5563; line-height: 1.6;">
                ${isBusinessOwner 
                  ? "Thank you for joining Pro Beauty List as a beauty professional! We're excited to help you grow your business and connect with new clients."
                  : "Thank you for joining Pro Beauty List! We're excited to help you discover amazing beauty professionals in your area."
                }
              </p>
              <p style="color: #4b5563; line-height: 1.6;">
                ${isBusinessOwner
                  ? "Get started by setting up your business profile, adding your services, and showcasing your portfolio."
                  : "Get started by browsing our talented professionals and booking your first appointment."
                }
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${baseUrl}${ctaLink}" style="display: inline-block; background: linear-gradient(135deg, #9BA8A2 0%, #7A6A5A 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">${ctaText}</a>
              </div>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                Questions? Reply to this email and we'll be happy to help!
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    
    if (result.error) {
      console.error('[email] Resend API error:', result.error.message);
      return false;
    }
    
    console.log(`[email] Welcome email sent successfully to ${toEmail}`, result.data);
    return true;
  } catch (error: any) {
    console.error('[email] Failed to send welcome email:', error?.message || error);
    return false;
  }
}

export async function sendBookingConfirmationEmail(
  toEmail: string,
  clientName: string,
  businessName: string,
  serviceName: string,
  appointmentDate: Date,
  appointmentTime: string,
  depositAmount?: number
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    console.log(`[email] Sending booking confirmation to ${toEmail}`);
    
    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : 'http://localhost:5000';

    const result = await client.emails.send({
      from: fromEmail || 'Pro Beauty List <noreply@resend.dev>',
      to: toEmail,
      subject: `Booking Confirmed - ${businessName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #9BA8A2 0%, #7A6A5A 100%); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Booking Confirmed!</h1>
            </div>
            <div style="padding: 32px;">
              <h2 style="color: #1f2937; margin-top: 0;">Hello ${clientName}!</h2>
              <p style="color: #4b5563; line-height: 1.6;">Your appointment has been confirmed. Here are the details:</p>
              
              <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Business</td>
                    <td style="padding: 8px 0; color: #1f2937; font-weight: 600; text-align: right;">${businessName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Service</td>
                    <td style="padding: 8px 0; color: #1f2937; font-weight: 600; text-align: right;">${serviceName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date</td>
                    <td style="padding: 8px 0; color: #1f2937; font-weight: 600; text-align: right;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Time</td>
                    <td style="padding: 8px 0; color: #1f2937; font-weight: 600; text-align: right;">${appointmentTime}</td>
                  </tr>
                  ${depositAmount ? `
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Deposit Paid</td>
                    <td style="padding: 8px 0; color: #059669; font-weight: 600; text-align: right;">$${depositAmount.toFixed(2)}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${baseUrl}/my-bookings" style="display: inline-block; background: linear-gradient(135deg, #9BA8A2 0%, #7A6A5A 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">View My Bookings</a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                Need to reschedule or cancel? Please contact the business directly or visit your bookings page.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                This confirmation was sent by Pro Beauty List on behalf of ${businessName}.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    
    if (result.error) {
      console.error('[email] Resend API error:', result.error.message);
      return false;
    }
    
    console.log(`[email] Booking confirmation sent successfully to ${toEmail}`, result.data);
    return true;
  } catch (error: any) {
    console.error('[email] Failed to send booking confirmation:', error?.message || error);
    return false;
  }
}

export async function sendAppointmentReminderEmail(
  toEmail: string,
  clientName: string,
  businessName: string,
  serviceName: string,
  appointmentDate: Date,
  appointmentTime: string,
  hoursUntilAppointment: number
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    console.log(`[email] Sending appointment reminder to ${toEmail}`);
    
    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const reminderText = hoursUntilAppointment <= 24 
      ? 'tomorrow' 
      : hoursUntilAppointment <= 48 
        ? 'in 2 days'
        : `in ${Math.round(hoursUntilAppointment / 24)} days`;

    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : 'http://localhost:5000';

    const result = await client.emails.send({
      from: fromEmail || 'Pro Beauty List <noreply@resend.dev>',
      to: toEmail,
      subject: `Reminder: Your appointment ${reminderText} at ${businessName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Appointment Reminder</h1>
            </div>
            <div style="padding: 32px;">
              <h2 style="color: #1f2937; margin-top: 0;">Hi ${clientName}!</h2>
              <p style="color: #4b5563; line-height: 1.6;">
                Just a friendly reminder that your appointment is coming up <strong>${reminderText}</strong>!
              </p>
              
              <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #f59e0b;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #92400e; font-size: 14px;">Business</td>
                    <td style="padding: 8px 0; color: #78350f; font-weight: 600; text-align: right;">${businessName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #92400e; font-size: 14px;">Service</td>
                    <td style="padding: 8px 0; color: #78350f; font-weight: 600; text-align: right;">${serviceName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #92400e; font-size: 14px;">Date</td>
                    <td style="padding: 8px 0; color: #78350f; font-weight: 600; text-align: right;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #92400e; font-size: 14px;">Time</td>
                    <td style="padding: 8px 0; color: #78350f; font-weight: 600; text-align: right;">${appointmentTime}</td>
                  </tr>
                </table>
              </div>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${baseUrl}/my-bookings" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">View Booking Details</a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                Can't make it? Please contact the business as soon as possible to reschedule.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                This reminder was sent by Pro Beauty List.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    
    if (result.error) {
      console.error('[email] Resend API error:', result.error.message);
      return false;
    }
    
    console.log(`[email] Appointment reminder sent successfully to ${toEmail}`, result.data);
    return true;
  } catch (error: any) {
    console.error('[email] Failed to send appointment reminder:', error?.message || error);
    return false;
  }
}

export async function sendBusinessBookingNotificationEmail(
  toEmail: string,
  businessOwnerName: string,
  clientName: string,
  serviceName: string,
  appointmentDate: Date,
  appointmentTime: string
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    console.log(`[email] Sending new booking notification to business owner ${toEmail}`);
    
    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : 'http://localhost:5000';

    const result = await client.emails.send({
      from: fromEmail || 'Pro Beauty List <noreply@resend.dev>',
      to: toEmail,
      subject: `New Booking: ${clientName} - ${serviceName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">New Booking!</h1>
            </div>
            <div style="padding: 32px;">
              <h2 style="color: #1f2937; margin-top: 0;">Hi ${businessOwnerName}!</h2>
              <p style="color: #4b5563; line-height: 1.6;">
                Great news! You have a new booking. Here are the details:
              </p>
              
              <div style="background-color: #d1fae5; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #059669;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #065f46; font-size: 14px;">Client</td>
                    <td style="padding: 8px 0; color: #064e3b; font-weight: 600; text-align: right;">${clientName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #065f46; font-size: 14px;">Service</td>
                    <td style="padding: 8px 0; color: #064e3b; font-weight: 600; text-align: right;">${serviceName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #065f46; font-size: 14px;">Date</td>
                    <td style="padding: 8px 0; color: #064e3b; font-weight: 600; text-align: right;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #065f46; font-size: 14px;">Time</td>
                    <td style="padding: 8px 0; color: #064e3b; font-weight: 600; text-align: right;">${appointmentTime}</td>
                  </tr>
                </table>
              </div>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${baseUrl}/business-bookings" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">View All Bookings</a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                This notification was sent by Pro Beauty List.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    
    if (result.error) {
      console.error('[email] Resend API error:', result.error.message);
      return false;
    }
    
    console.log(`[email] Business booking notification sent successfully to ${toEmail}`, result.data);
    return true;
  } catch (error: any) {
    console.error('[email] Failed to send business booking notification:', error?.message || error);
    return false;
  }
}
