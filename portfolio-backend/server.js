const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Inicialización de Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Endpoint para procesar la donación
app.post('/api/donate', async (req, res) => {
  const { name, email, amount, method, reference, bank } = req.body;

  if (!name || !email || !amount || !method) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  try {
    // 1. Guardar en Supabase
    const { data, error: dbError } = await supabase
      .from('donaciones')
      .insert([
        {
          nombre: name,
          email: email,
          monto: String(amount),
          metodo: method
        }
      ]);

    if (dbError) {
      console.error('Error insertando en Supabase:', dbError.message);
    } else {
      console.log('Donación guardada exitosamente en Supabase');
    }

    // 2. Enviar correo vía Resend API (destinatario forzado a tu correo de prueba)
    try {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'Kikicode <onboarding@resend.dev>',
          to: ['19-10572@usb.ve'], // Correo registrado en tu cuenta de Resend
          subject: '¡Muchísimas gracias por tu apoyo! ☕',
          html: `
            <div style="font-family: Arial, sans-serif; background-color: #090d16; color: #f8fafc; padding: 20px; border-radius: 10px;">
              <h2 style="color: #38bdf8;">¡Hola, ${name}!</h2>
              <p>Quería agradecerte personalmente por tu valioso aporte a mi trabajo.</p>
              <div style="background: rgba(30, 41, 59, 0.8); padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 5px 0;"><strong>Monto:</strong> ${amount}</p>
                <p style="margin: 5px 0;"><strong>Método de pago:</strong> ${method}</p>
                ${reference ? `<p style="margin: 5px 0;"><strong>Referencia:</strong> ${reference}</p>` : ''}
              </div>
              <p style="margin-top: 20px;">Tu contribución me ayuda directamente a seguir creando contenido de código abierto y mejorando mis proyectos.</p>
              <br>
              <p style="color: #94a3b8;">Atentamente,<br><strong>Blujeaan / Kikicode</strong></p>
            </div>
          `
        })
      });

      const resendData = await resendResponse.json();

      if (resendResponse.ok) {
        console.log('Correo enviado exitosamente vía Resend:', resendData.id);
      } else {
        console.error('Error al enviar correo vía Resend:', resendData);
      }
    } catch (emailError) {
      console.error('El correo no se pudo enviar, pero la donación sí fue registrada:', emailError.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Donación registrada exitosamente en la nube.'
    });

  } catch (error) {
    console.error('Error interno:', error);
    return res.status(500).json({ error: 'Ocurrió un error interno al registrar el pago.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en puerto ${PORT}`);
});