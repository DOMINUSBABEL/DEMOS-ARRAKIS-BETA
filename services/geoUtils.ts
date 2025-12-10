
// Utility to map municipalities to Antioquia's 9 subregions for strategic analysis

export type Subregion = 
  | 'Valle de Aburrá'
  | 'Oriente'
  | 'Suroeste'
  | 'Occidente'
  | 'Norte'
  | 'Nordeste'
  | 'Bajo Cauca'
  | 'Magdalena Medio'
  | 'Urabá';

export const SUBREGIONS: Subregion[] = [
  'Valle de Aburrá', 'Oriente', 'Suroeste', 'Occidente', 'Norte', 'Nordeste', 'Bajo Cauca', 'Magdalena Medio', 'Urabá'
];

// Mapping of major municipalities to subregions. 
// Note: This is a partial list for demonstration. In production, list all 125.
const MUNICIPIO_TO_SUBREGION: Record<string, Subregion> = {
  // Valle de Aburrá
  'MEDELLIN': 'Valle de Aburrá', 'BELLO': 'Valle de Aburrá', 'ITAGUI': 'Valle de Aburrá', 'ENVIGADO': 'Valle de Aburrá',
  'SABANETA': 'Valle de Aburrá', 'LA ESTRELLA': 'Valle de Aburrá', 'COPACABANA': 'Valle de Aburrá', 'GIRARDOTA': 'Valle de Aburrá',
  'CALDAS': 'Valle de Aburrá', 'BARBOSA': 'Valle de Aburrá',

  // Oriente
  'RIONEGRO': 'Oriente', 'MARINILLA': 'Oriente', 'LA CEJA': 'Oriente', 'EL CARMEN DE VIBORAL': 'Oriente',
  'GUARNE': 'Oriente', 'EL RETIRO': 'Oriente', 'SANTUARIO': 'Oriente', 'SONSON': 'Oriente', 'ABEJORRAL': 'Oriente',

  // Urabá
  'APARTADO': 'Urabá', 'TURBO': 'Urabá', 'CAREPA': 'Urabá', 'CHIGORODO': 'Urabá', 'NECOCLI': 'Urabá', 'ARBOLETES': 'Urabá',

  // Bajo Cauca
  'CAUCASIA': 'Bajo Cauca', 'EL BAGRE': 'Bajo Cauca', 'ZARAGOZA': 'Bajo Cauca', 'TARAZA': 'Bajo Cauca',

  // Norte
  'YARUMAL': 'Norte', 'SANTA ROSA DE OSOS': 'Norte', 'ITUANGO': 'Norte', 'DONMATIAS': 'Norte',

  // Occidente
  'SANTA FE DE ANTIOQUIA': 'Occidente', 'SOPETRAN': 'Occidente', 'SAN JERONIMO': 'Occidente', 'FRONTINO': 'Occidente',

  // Suroeste
  'ANDES': 'Suroeste', 'CIUDAD BOLIVAR': 'Suroeste', 'URRAO': 'Suroeste', 'JERICO': 'Suroeste', 'JARDIN': 'Suroeste',

  // Nordeste
  'SEGOVIA': 'Nordeste', 'REMEDIOS': 'Nordeste', 'AMALFI': 'Nordeste', 'YOLOMBO': 'Nordeste',

  // Magdalena Medio
  'PUERTO BERRIO': 'Magdalena Medio', 'YONDO': 'Magdalena Medio', 'PUERTO NARE': 'Magdalena Medio',
};

export const getSubregion = (municipio: string): Subregion | 'Desconocido' => {
  const normalized = municipio.toUpperCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove accents
  
  // Direct lookup
  if (MUNICIPIO_TO_SUBREGION[normalized]) return MUNICIPIO_TO_SUBREGION[normalized];

  // Heuristic fallbacks for common unmapped ones or small towns based on proximity logic could go here
  // For safety in this demo, map unknown to 'Desconocido' or assign to nearest major hub logic
  
  return 'Desconocido';
};

export const aggregateVotesBySubregion = (data: any[], filterParty?: string): Record<Subregion, number> => {
  const aggregation: Record<string, number> = {};
  
  SUBREGIONS.forEach(s => aggregation[s] = 0);

  data.forEach(row => {
    // If filter is active, check party match
    if (filterParty && row.UnidadPolitica !== filterParty && row.Candidato !== filterParty) return;

    const sub = getSubregion(row.Municipio || row.UnidadPolitica); // Fallback to UP if geography is missing (rare)
    if (sub !== 'Desconocido') {
      aggregation[sub] = (aggregation[sub] || 0) + parseInt(row.Votos || 0, 10);
    }
  });

  return aggregation;
};
