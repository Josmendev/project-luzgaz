import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Extraer datos FormData del request
    const formData = await request.formData();

    const data = {
      nombre: formData.get('nombre') as string,
      email: formData.get('email') as string,
      telefono: formData.get('telefono') as string,
      tipo_cliente: formData.get('tipo_cliente') as string,
      comentarios: formData.get('comentarios') as string || 'Sin comentarios adicionales',
    };

    // Obtener archivo
    const file = formData.get('factura') as File;

    // Validar datos requeridos
    if (!data.nombre || !data.email || !data.telefono || !data.tipo_cliente) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Faltan datos requeridos'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar archivo
    if (!file || file.size === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No se recibió el archivo de factura'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Debug: Verificar variables de entorno
    console.log('=== DEBUG MAILTRAP CREDENTIALS ===');
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_PORT:', process.env.SMTP_PORT);
    console.log('SMTP_USER:', process.env.SMTP_USER);
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***hidden***' : 'NOT SET');
    console.log('EMAIL_TO:', process.env.EMAIL_TO);
    console.log('================================');

    // Configuración de Mailtrap
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
      port: parseInt(process.env.SMTP_PORT || '2525'),
      auth: {
        user: process.env.SMTP_USER || 'your-mailtrap-user',
        pass: process.env.SMTP_PASS || 'your-mailtrap-pass'
      }
    });

    // Convertir archivo a buffer para adjunto
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Configurar el email
    const mailOptions = {
      from: `"${data.nombre}" <${data.email}>`,
      to: process.env.EMAIL_TO || 'josmendev@gmail.com',
      subject: `Nueva Solicitud de Estudio Energético - ${data.nombre}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(90deg, #10b981, #3b82f6); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Nueva Solicitud de Estudio Energético</h1>
          </div>

          <div style="padding: 20px; background: #f9fafb;">
            <h2 style="color: #1f2937; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
              📋 Datos del Cliente
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
              <tr style="background: white;">
                <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Teléfono:</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">
                  <a href="tel:${data.telefono}" style="color: #3b82f6;">${data.telefono}</a>
                </td>
              </tr>
              <tr style="background: #f9fafb;">
                <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Tipo de cliente:</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; text-transform: capitalize;">${data.tipo_cliente}</td>
              </tr>
            </table>

            <h2 style="color: #1f2937; border-bottom: 2px solid #10b981; padding-bottom: 10px; margin-top: 30px;">
              💬 Mensaje del Cliente
            </h2>
            <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
              ${data.comentarios || 'Sin comentarios adicionales'}
            </div>

            <h2 style="color: #1f2937; border-bottom: 2px solid #10b981; padding-bottom: 10px; margin-top: 30px;">
              📄 Archivo Adjunto
            </h2>
            <div style="background: #d1fae5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
              <p style="margin: 0; color: #065f46;">
                <strong>✅ Archivo incluido:</strong> ${file.name}
                <br><strong>Tamaño:</strong> ${(file.size / 1024 / 1024).toFixed(2)} MB
                <br><strong>Tipo:</strong> ${file.type || 'Desconocido'}
              </p>
            </div>

            <div style="margin-top: 30px; padding: 15px; background: #e0f2fe; border-radius: 8px;">
              <p style="margin: 0; color: #0e7490; text-align: center;">
                📅 Solicitud recibida el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}
              </p>
            </div>
          </div>

          <div style="background: #1f2937; padding: 15px; text-align: center;">
            <p style="color: #9ca3af; margin: 0; font-size: 14px;">
              Solicitud enviada desde el formulario web de LUZGAS
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: file.name,
          content: fileBuffer,
          contentType: file.type
        }
      ]
    };

    // Enviar el email
    await transporter.sendMail(mailOptions);

    return new Response(JSON.stringify({
      success: true,
      message: 'Email enviado correctamente'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error enviando email:', error);

    return new Response(JSON.stringify({
      success: false,
      message: 'Error al enviar el email'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};