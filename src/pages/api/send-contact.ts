import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Extraer datos JSON del request
    const data = await request.json();

    // Validar datos requeridos
    if (!data.nombre || !data.email || !data.mensaje) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Faltan datos requeridos'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Debug: Verificar variables de entorno
    console.log('=== DEBUG CONTACT FORM ===');
    console.log('Enviando mensaje de contacto desde:', data.email);
    console.log('===========================');

    // Configuración de Mailtrap
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
      port: parseInt(process.env.SMTP_PORT || '2525'),
      auth: {
        user: process.env.SMTP_USER || 'your-mailtrap-user',
        pass: process.env.SMTP_PASS || 'your-mailtrap-pass'
      }
    });

    // Configurar el email
    const mailOptions = {
      from: `"${data.nombre}" <${data.email}>`,
      to: process.env.EMAIL_TO || 'josmendev@gmail.com',
      subject: `Nuevo Mensaje de Contacto - ${data.nombre}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(90deg, #10b981, #3b82f6); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Nuevo Mensaje de Contacto</h1>
          </div>

          <div style="padding: 20px; background: #f9fafb;">
            <h2 style="color: #1f2937; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
              👤 Información del Contacto
            </h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="background: white;">
                <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Nombre:</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${data.nombre}</td>
              </tr>
              <tr style="background: #f9fafb;">
                <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Email:</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">
                  <a href="mailto:${data.email}" style="color: #3b82f6;">${data.email}</a>
                </td>
              </tr>
              ${data.telefono ? `
              <tr style="background: white;">
                <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Teléfono:</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">
                  <a href="tel:${data.telefono}" style="color: #3b82f6;">${data.telefono}</a>
                </td>
              </tr>
              ` : ''}
            </table>

            <h2 style="color: #1f2937; border-bottom: 2px solid #10b981; padding-bottom: 10px; margin-top: 30px;">
              💬 Mensaje
            </h2>
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
              <p style="margin: 0; color: #374151; line-height: 1.6; white-space: pre-wrap;">${data.mensaje}</p>
            </div>

            <div style="margin-top: 30px; padding: 15px; background: #e0f2fe; border-radius: 8px;">
              <p style="margin: 0; color: #0e7490; text-align: center;">
                📅 Mensaje recibido el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}
              </p>
            </div>

            <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px; text-align: center;">
              <p style="margin: 0; color: #92400e;">
                <strong>🔔 Acción requerida:</strong> Responder al cliente en un máximo de 24 horas
              </p>
            </div>
          </div>

          <div style="background: #1f2937; padding: 15px; text-align: center;">
            <p style="color: #9ca3af; margin: 0; font-size: 14px;">
              Mensaje enviado desde el formulario de contacto de LUZGAS
            </p>
          </div>
        </div>
      `
    };

    // Enviar el email
    await transporter.sendMail(mailOptions);

    return new Response(JSON.stringify({
      success: true,
      message: 'Mensaje enviado correctamente'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error enviando mensaje de contacto:', error);

    return new Response(JSON.stringify({
      success: false,
      message: 'Error al enviar el mensaje'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};