require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo exitosamente en el puerto ${PORT}`);
  console.log(`Prueba de salud disponible en: http://localhost:${PORT}/api/health`);
});