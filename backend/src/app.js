const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { supabase } = require('./config/supabase');

const catalogoRoutes = require('./routes/catalogo.routes');
const fdsRoutes = require('./routes/fds.routes');
const authRoutes = require('./routes/auth.routes');
const reactivoRoutes = require('./routes/reactivo.routes');
const mezclaRoutes = require('./routes/mezcla.routes');
const matrizRoutes = require('./routes/matriz.routes');

const app = express();

// 1. Suprimir cabecera de fingerprint de Express (CWE-497 / OWASP A01)
app.disable('x-powered-by');

// 2. Endurecimiento de cabeceras con Helmet (CWE-693 / OWASP A05)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Mitiga la alerta de ZAP sobre directivas sin fallback
        frameAncestors: ["'none'"],
        formAction: ["'none'"],
      },
    },
    // Activa X-Content-Type-Options: nosniff
    noSniff: true,
    // Previene inclusión en iframes ajenos (Clickjacking)
    frameguard: { action: 'deny' },
  })
);

// 3. Configuración de CORS
const origenesPermitidos = [
  'http://localhost:5173',
  process.env.FRONTEND_URL // Dominio asignado en Vercel
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir solicitudes directas/internas (Render health checks, Postman, curl)
    if (!origin) return callback(null, true);

    const esPermitido = origenesPermitidos.some((permitido) => 
      origin === permitido || origin.endsWith('.vercel.app')
    );

    if (esPermitido) {
      return callback(null, true);
    }
    return callback(new Error(`Acceso bloqueado por política CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middlewares base
app.use(express.json());

// 4. Rutas de la API
app.use('/api/catalogos', catalogoRoutes);
app.use('/api/fds', fdsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reactivos', reactivoRoutes);
app.use('/api/mezclas', mezclaRoutes);
app.use('/api/matriz', matrizRoutes);

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

// Manejador de rutas no encontradas (404 estándar)
app.use((req, res) => {
  return res.status(404).json({
    estado: 'ERROR',
    mensaje: 'Ruta o recurso no encontrado'
  });
});

// 5. Middleware centralizado de manejo de errores (CWE-550 / OWASP A05)
// Ubicado al final del pipeline para interceptar SyntaxError de JSON malformado
app.use((err, req, res, next) => {
  // Captura fallos de parsing de JSON inyectados durante escaneos o peticiones erróneas
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      estado: 'ERROR',
      mensaje: 'El cuerpo de la solicitud no contiene un formato JSON válido'
    });
  }

  // Captura bloqueos explícitos por CORS
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      estado: 'ERROR',
      mensaje: err.message
    });
  }

  // Error genérico sin exponer el stack trace al cliente
  console.error('[Error interno]:', err.message);
  return res.status(500).json({
    estado: 'ERROR',
    mensaje: 'Ocurrió un error interno en el servidor'
  });
});

module.exports = app;