const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Transportador de correo de Nodemailer (usa Gmail o tu servidor SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Ej: tu-correo@gmail.com
    pass: process.env.EMAIL_PASS  // Tu Contraseña de Aplicación de Google
  }
});

// Arreglo en memoria simulando base de datos (o puedes conectarlo a tu DB MongoDB/Supabase/PostgreSQL)
const donationsCloudDB = [];

// Endpoint para procesar la donación
app.post('/api/donate', async (req, res) => {
  const { name, email, amount, method } = req.body;

  if (!name || !email || !amount || !method) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  try {
    // 1. Guardar en la base de datos en la nube
    const newDonation = {
      id: Date.now(),
      name,
      email,
      amount,
      method,
      createdAt: new Date().toISOString()
    };
    donationsCloudDB.push(newDonation);
    console.log(' Donación guardada en la nube:', newDonation);

    // 2. Enviar correo de agradecimiento
    const mailOptions = {
      from: `"Blujeaan | Kikicode" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '¡Muchísimas gracias por tu apoyo! ☕',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #090d16; color: #f8fafc; padding: 20px; border-radius: 10px;">
          <h2 style="color: #38bdf8;">¡Hola, ${name}!</h2>
          <p>Quería agradecerte personalmente por tu valioso aporte a mi trabajo.</p>
          <div style="background: rgba(30, 41, 59, 0.8); padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <p style="margin: 5px 0;"><strong>Monto:</strong> $${amount} USD</p>
            <p style="margin: 5px 0;"><strong>Método de pago:</strong> ${method}</p>
          </div>
          <p style="margin-top: 20px;">Tu contribución me ayuda directamente a seguir creando contenido de código abierto y mejorando mis proyectos.</p>
          <br>
          <p style="color: #94a3b8;">Atentamente,<br><strong>Blujeaan / Kikicode</strong></p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'Donación registrada y correo de agradecimiento enviado exitosamente.'
    });

  } catch (error) {
    console.error('Error al procesar la donación:', error);
    res.status(500).json({ error: 'Ocurrió un error interno al registrar el pago o enviar el correo.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en puerto ${PORT}`);
});