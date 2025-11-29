import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
	host: process.env.EMAIL_SERVER_HOST,
	port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
	secure: false,
	auth: {
		user: process.env.EMAIL_SERVER_USER,
		pass: process.env.EMAIL_SERVER_PASSWORD,
	},
})

export const emailTemplates = {
	accountVerification: (verificationUrl) => ({
		subject: 'Verifiera ditt Fixa2an-konto',
		html: `
	      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
	        <h1 style="color: #1C3F94;">Välkommen till Fixa2an!</h1>
	        <p>Klicka på länken nedan för att verifiera ditt konto:</p>
	        <a href="${verificationUrl}" style="background-color: #1C3F94; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verifiera konto</a>
	        <p>Om länken inte fungerar, kopiera och klistra in denna URL i din webbläsare:</p>
	        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
	      </div>
	    `,
		text: `Välkommen till Fixa2an! Verifiera ditt konto genom att besöka: ${verificationUrl}`,
	}),
	workshopRegistrationPending: (companyName) => ({
		subject: 'Verkstadsregistrering mottagen',
		html: `
	      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
	        <h1 style="color: #1C3F94;">Tack för din registrering!</h1>
	        <p>Hej ${companyName},</p>
	        <p>Din verkstadsregistrering har mottagits och väntar nu på administratörsgodkännande.</p>
	        <p>Du kommer att få ett e-postmeddelande när din registrering har granskats.</p>
	        <p>Med vänliga hälsningar,<br>Fixa2an-teamet</p>
	      </div>
	    `,
		text: `Tack för din registrering! Din verkstadsregistrering har mottagits och väntar på administratörsgodkännande.`,
	}),
}

export async function sendEmail(to, template) {
	await transporter.sendMail({
		from: process.env.EMAIL_FROM,
		to,
		subject: template.subject,
		html: template.html,
		text: template.text,
	})
}
