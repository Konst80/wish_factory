// Email service for sending invitations
// In development, emails are logged to console
// In production, configure RESEND_API_KEY in .env

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const PUBLIC_APP_URL = process.env.PUBLIC_APP_URL || 'http://localhost:5173';

interface SendInvitationEmailParams {
	to: string;
	fullName: string;
	inviterName: string;
	role: string;
	token: string;
}

export async function sendInvitationEmail({
	to,
	fullName,
	inviterName,
	role,
	token
}: SendInvitationEmailParams) {
	// For development, just log the email
	if (!RESEND_API_KEY || process.env.NODE_ENV === 'development') {
		console.log('📧 Invitation Email (Development Mode):');
		console.log(`To: ${to}`);
		console.log(`Name: ${fullName}`);
		console.log(`Role: ${role}`);
		console.log(`Invitation URL: ${PUBLIC_APP_URL}/auth/accept-invite?token=${token}`);
		return { success: true };
	}

	// Production: Send actual email using Resend
	try {
		const response = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${RESEND_API_KEY}`
			},
			body: JSON.stringify({
				from: 'Wish Factory <noreply@wishfactory.app>',
				to: [to],
				subject: 'Einladung zu Wish Factory',
				html: `
					<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
						<h1 style="color: #333;">Willkommen bei Wish Factory!</h1>
						<p>Hallo ${fullName},</p>
						<p>${inviterName} hat Sie eingeladen, dem Wish Factory Team als <strong>${role}</strong> beizutreten.</p>
						<p>Klicken Sie auf den folgenden Link, um Ihre Einladung anzunehmen und ein Passwort festzulegen:</p>
						<div style="margin: 30px 0;">
							<a href="${PUBLIC_APP_URL}/auth/accept-invite?token=${token}" 
							   style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
								Einladung annehmen
							</a>
						</div>
						<p style="color: #666; font-size: 14px;">
							Diese Einladung ist 7 Tage gültig. Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:
							<br>
							${PUBLIC_APP_URL}/auth/accept-invite?token=${token}
						</p>
						<hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
						<p style="color: #999; font-size: 12px;">
							Diese E-Mail wurde von Wish Factory gesendet. Wenn Sie diese Einladung nicht erwartet haben, können Sie diese E-Mail ignorieren.
						</p>
					</div>
				`
			})
		});

		if (!response.ok) {
			const error = await response.text();
			console.error('Email send error:', error);
			return { success: false, error };
		}

		return { success: true };
	} catch (error) {
		console.error('Email send error:', error);
		return { success: false, error: String(error) };
	}
}