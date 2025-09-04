import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"Apolo" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Recuperación de contraseña - Apolo',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Recuperación de contraseña</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎵 Apolo</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Recuperación de contraseña</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
            <h2 style="color: #333; margin-top: 0;">¡Hola!</h2>
            
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta de Apolo.</p>
            
            <p>Si solicitaste este cambio, haz clic en el botón de abajo para crear una nueva contraseña:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        text-decoration: none; 
                        padding: 15px 30px; 
                        border-radius: 8px; 
                        font-size: 16px; 
                        font-weight: bold; 
                        display: inline-block; 
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                Restablecer contraseña
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              Si el botón no funciona, también puedes copiar y pegar este enlace en tu navegador:
            </p>
            <p style="font-size: 14px; word-break: break-all; background: #e9e9e9; padding: 10px; border-radius: 5px;">
              ${resetUrl}
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="font-size: 14px; color: #666; margin: 0;">
                <strong>Nota importante:</strong> Este enlace expirará en 1 hora por motivos de seguridad.
              </p>
              <p style="font-size: 14px; color: #666; margin: 10px 0 0 0;">
                Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña permanecerá sin cambios.
              </p>
            </div>
            
            <div style="margin-top: 30px; text-align: center; font-size: 14px; color: #888;">
              <p>¿Necesitas ayuda? Contáctanos en soporte@apolo.com</p>
              <p style="margin: 5px 0 0 0;">© 2025 Apolo. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);

      console.log('Email sent successfully to:', email);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Error al enviar el email de recuperación');
    }
  }
}
