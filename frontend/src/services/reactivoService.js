const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const fetchReactivos = async (filtroTexto = '', idGrupo = '', pictograma = '') => {
  const params = new URLSearchParams();
  if (filtroTexto) params.append('q', filtroTexto);
  if (idGrupo) params.append('grupo', idGrupo);
  if (pictograma) params.append('pictograma', pictograma);

  const res = await fetch(`${API_URL}/reactivos?${params.toString()}`);
  if (!res.ok) throw new Error('Error al consultar el catálogo');
  const json = await res.json();
  return json.data || [];
};

export const fetchGruposQuimicos = async () => {
  try {
    const res = await fetch(`${API_URL}/grupos`);
    if (res.ok) {
      const json = await res.json();
      return json.data || [];
    }
  } catch {
    // Si el endpoint dedicado no está disponible, se retorna la lista base
  }
  return [
    { id_grupo: 1, nombre_grupo: 'Ácidos' },
    { id_grupo: 2, nombre_grupo: 'Bases' },
    { id_grupo: 3, nombre_grupo: 'Alcoholes' },
    { id_grupo: 4, nombre_grupo: 'Reactivos Orgánicos' },
    { id_grupo: 5, nombre_grupo: 'Reactivos Inorgánicos' },
    { id_grupo: 6, nombre_grupo: 'Soluciones Buffer' },
    { id_grupo: 7, nombre_grupo: 'Colorantes' },
    { id_grupo: 8, nombre_grupo: 'Reactivos de Biología Molecular' },
    { id_grupo: 9, nombre_grupo: 'Reactivos de Grado Comercial' },
  ];
};