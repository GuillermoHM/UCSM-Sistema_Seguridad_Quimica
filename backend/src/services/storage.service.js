const { supabase } = require('../config/supabase');

const subirFdsStorage = async (file, codigoIdentificador) => {
  // Sanitizar el nombre del archivo: fds-[codigo]-[timestamp].pdf
  const timestamp = Date.now();
  const nombreLimpio = codigoIdentificador ? codigoIdentificador.toLowerCase().replace(/[^a-z0-9]/g, '') : 'sustancia';
  const fileName = `fds-${nombreLimpio}-${timestamp}.pdf`;
  const filePath = `fichas/${fileName}`;

  // 1. Subir el buffer directo al bucket fds-documents
  const { data, error } = await supabase.storage
    .from('archivos_fds')
    .upload(filePath, file.buffer, {
      contentType: 'application/pdf',
      upsert: false
    });

  if (error) {
    throw new Error(`Error al subir archivo a Supabase Storage: ${error.message}`);
  }

  // 2. Obtener la URL pública permanente generada
  const { data: publicUrlData } = supabase.storage
    .from('archivos_fds')
    .getPublicUrl(filePath);

  return {
    path: data.path,
    url_fds: publicUrlData.publicUrl
  };
};

module.exports = { subirFdsStorage };