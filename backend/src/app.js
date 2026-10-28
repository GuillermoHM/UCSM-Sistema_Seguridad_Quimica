const express = require('express');
const cors = require('cors');
const { supabase } = require('./config/supabase');

const catalogoRoutes = require('./routes/catalogo.routes');
const fdsRoutes = require('./routes/fds.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas de la API
app.use('/api/catalogos', catalogoRoutes);
app.use('/api/fds', fdsRoutes);
app.use('/api/auth', authRoutes);

// Endpoint de verificación de estado y conexión
app.get('/api/health', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pictograma_sga')
      .select('cod_ghs, peligro')
      .limit(1);

    if (error) throw error;

    return res.status(200).json({
      estado: 'OK',
      mensaje: 'Servidor Express operativo y enlace con Supabase confirmado',
      dato_prueba: data
    });
  } catch (error) {
    return res.status(500).json({
      estado: 'ERROR',
      mensaje: 'Fallo al comunicar con Supabase',
      detalle: error.message
    });
  }
});

module.exports = app;