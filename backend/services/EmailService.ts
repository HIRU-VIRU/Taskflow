import nodemailer from 'nodemailer';
import { env } from '../config/env';

export interface Invitation {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  role: string;
  token: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (env.SMTP_HOST && env.SMTP_USER) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASSWORD,
        },
      });
      console.log('[EmailService] SMTP configured for:', env.SMTP_HOST);
    } else {
      console.log('[EmailService] SMTP not configured - invite URLs will be logged to console');
    }
  }

  private isConfigured(): boolean {
    return this.transporter !== null;
  }

  private getInviteUrl(token: string): string {
    return `${env.APP_URL}/accept-invite?token=${token}`;
  }

  async sendInvitation(invitation: Invitation, tenant: Tenant): Promise<boolean> {
    const inviteUrl = this.getInviteUrl(invitation.token);

    // Always log the invite URL for development
    console.log('[EmailService] =============================================');
    console.log('[EmailService] INVITATION CREATED');
    console.log('[EmailService] To:', invitation.email);
    console.log('[EmailService] Name:', invitation.name);
    console.log('[EmailService] Organization:', tenant.name);
    console.log('[EmailService] Role:', invitation.role);
    console.log('[EmailService] Invite URL:', inviteUrl);
    console.log('[EmailService] =============================================');

    if (!this.isConfigured()) {
      console.log('[EmailService] SMTP not configured - email not sent');
      return false;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're Invited to Join ${tenant.name}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #3b82f6, #6366f1); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">TaskFlow</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Project Management Made Simple</p>
            </div>

            <!-- Content -->
            <div style="padding: 40px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0;">Hi ${invitation.name},</h2>

              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
                You've been invited to join <strong>${tenant.name}</strong> on TaskFlow as a <strong>${invitation.role}</strong>.
              </p>

              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">
                Click the button below to accept the invitation and create your account:
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #14b8a6); color: white; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  Accept Invitation
                </a>
              </div>

              <p style="color: #6b7280; font-size: 14px; margin: 30px 0 0 0;">
                This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
              </p>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${inviteUrl}" style="color: #3b82f6; word-break: break-all;">${inviteUrl}</a>
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 20px;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              &copy; ${new Date().getFullYear()} TaskFlow. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Hi ${invitation.name},

You've been invited to join ${tenant.name} on TaskFlow as a ${invitation.role}.

Click the link below to accept the invitation and create your account:
${inviteUrl}

This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.

- The TaskFlow Team
    `;

    try {
      await this.transporter!.sendMail({
        from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`,
        to: invitation.email,
        subject: `You're invited to join ${tenant.name} on TaskFlow`,
        text: textContent,
        html: htmlContent,
      });
      console.log(`[EmailService] Invitation email sent successfully to ${invitation.email}`);
      return true;
    } catch (error) {
      console.error('[EmailService] Failed to send invitation email:', error);
      return false;
    }
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      await this.transporter!.verify();
      console.log('[EmailService] SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('[EmailService] SMTP connection verification failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
