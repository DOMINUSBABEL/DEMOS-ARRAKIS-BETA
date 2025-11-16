
import { extractDataFromDocument, extractDataFromText } from './geminiService';
import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';
import { read, utils, WorkBook, WorkSheet } from 'xlsx';
import Papa from 'papaparse';

// Required for pdf.js to work
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://aistudiocdn.com/pdfjs-dist@^4.5.136/build/pdf.worker.min.mjs`;

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const encoded = (reader.result as string).split(',')[1];
      resolve(encoded);
    };
    reader.onerror = error => reject(error);
  });
};

const readPdfText = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n';
    }
    return fullText;
};

const readDocxText = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
};

// --- NEW ROBUST XLSX PARSER ---

// Normalization function to handle accents, cases, and spacing
const normalizeHeader = (header: string): string => {
    if (!header) return '';
    return header
        .normalize('NFD') // Decompose combined characters (e.g., 'á' -> 'a' + '´')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
        .toLowerCase()
        .trim();
}

/**
 * Finds the best matching header from a list based on a scored keyword map.
 * This is more robust than a simple keyword search.
 */
const findBestHeader = (
    headers: string[],
    keywordMap: { [keyword: string]: number },
    usedHeaders: Set<string> // Keep track of headers that have already been assigned
): string | null => {
    let bestMatch: { header: string, score: number } | null = null;

    headers.forEach(header => {
        // Skip headers that have already been assigned to another essential column
        if (usedHeaders.has(header)) {
            return;
        }

        const normalizedHeader = normalizeHeader(String(header));
        if (!normalizedHeader) return;

        let currentScore = 0;
        for (const keyword in keywordMap) {
            if (normalizedHeader.includes(keyword)) {
                currentScore += keywordMap[keyword];
            }
        }
        
        // Give a bonus for exact matches to prioritize clear headers
        if (keywordMap[normalizedHeader]) {
            currentScore += 5;
        }

        if (currentScore > 0) {
            if (!bestMatch || currentScore > bestMatch.score) {
                bestMatch = { header, score: currentScore };
            }
        }
    });

    return bestMatch ? bestMatch.header : null;
}


const readXlsxAsCsv = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const workbook: WorkBook = read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet: WorkSheet = workbook.Sheets[sheetName];
    
    const jsonData: any[][] = utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    // --- NEW DYNAMIC HEADER FINDING LOGIC ---
    const allKeywords = new Set([
        'partido', 'unidad', 'movimiento', 'agrupacion', 'politico', 'politica', 'lista', 'organizacion',
        'candidato', 'nombre',
        'votos', 'voto', 'total', 'votacion',
        'corporacion', 'eleccion', 'cargo',
        'departamento',
        'municipio',
        'comuna', 'zona', 'puesto',
        'circunscripcion',
        'codigo'
    ]);

    let bestHeaderRow = { index: -1, score: 0 };

    // Scan the first 10 rows to find the best candidate for a header row
    const rowsToScan = Math.min(10, jsonData.length);
    for (let i = 0; i < rowsToScan; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0 || row.every(cell => String(cell).trim() === '')) {
            continue;
        }

        let score = 0;
        row.forEach(cell => {
            const normalizedCell = normalizeHeader(String(cell));
            if (normalizedCell) {
                for (const keyword of allKeywords) {
                    if (normalizedCell.includes(keyword)) {
                        score++; // A cell matches, increment score and move to next cell.
                        break; 
                    }
                }
            }
        });

        if (score > bestHeaderRow.score) {
            bestHeaderRow = { index: i, score };
        }
    }

    if (bestHeaderRow.index === -1 || bestHeaderRow.score < 2) {
        throw new Error("No se pudo identificar una fila de encabezado válida en el archivo XLSX. Asegúrate de que las columnas tengan nombres como 'Partido', 'Votos', 'Candidato', etc.");
    }

    const headerRowIndex = bestHeaderRow.index;
    // --- END OF NEW LOGIC ---

    const headers: string[] = jsonData[headerRowIndex].map(h => String(h));
    const body = jsonData.slice(headerRowIndex + 1);
    
    // Define scored keywords for better matching
    const partyKeywords = { 'partido': 10, 'unidad': 8, 'movimiento': 8, 'agrupacion': 8, 'politico': 5, 'politica': 5, 'lista': 7, 'organizacion': 8, 'corporacion': 6 };
    const candidateKeywords = { 'candidato': 10, 'nombre': 8 };
    const votesKeywords = { 'votos': 10, 'total': 8, 'votacion': 8, 'voto': 9 };
    
    const usedHeaders = new Set<string>();

    const partyHeader = findBestHeader(headers, partyKeywords, usedHeaders);
    if (partyHeader) usedHeaders.add(partyHeader);

    const votesHeader = findBestHeader(headers, votesKeywords, usedHeaders);
    if (votesHeader) usedHeaders.add(votesHeader);

    // Candidate is optional but let's try to find it
    const candidateHeader = findBestHeader(headers, candidateKeywords, usedHeaders);
    if (candidateHeader) usedHeaders.add(candidateHeader);

    // Check for mandatory headers
    if (!partyHeader || !votesHeader) {
        const missingParts = [];
        if (!partyHeader) missingParts.push("'Partido/Agrupación'");
        if (!votesHeader) missingParts.push("'Votos'");
        throw new Error(`No se pudieron encontrar las columnas requeridas (${missingParts.join(' y ')}). Se intentó usar la fila ${headerRowIndex + 1} como encabezado, pero faltan coincidencias. Por favor, revisa el archivo.`);
    }

    // Now find the optional/contextual headers
    const electionHeader = findBestHeader(headers, { 'corporacion': 10, 'eleccion': 8, 'cargo': 8 }, usedHeaders);
    const departmentHeader = findBestHeader(headers, { 'departamento': 10 }, usedHeaders);
    const municipioHeader = findBestHeader(headers, { 'municipio': 10 }, usedHeaders);
    const comunaHeader = findBestHeader(headers, { 'comuna': 10 }, usedHeaders);
    const zonaHeader = findBestHeader(headers, { 'zona': 10 }, usedHeaders);
    const puestoHeader = findBestHeader(headers, { 'puesto': 10 }, usedHeaders);
    const circunscripcionHeader = findBestHeader(headers, { 'circunscripcion': 10 }, usedHeaders);
    const codigoDepartamentoHeader = findBestHeader(headers, { 'codigo departamento': 10, 'código departamento': 10 }, usedHeaders);
    const codigoMunicipioHeader = findBestHeader(headers, { 'codigo municipio': 10, 'código municipio': 10 }, usedHeaders);
    const codigoCandidatoHeader = findBestHeader(headers, { 'codigo candidato': 10, 'código candidato': 10 }, usedHeaders);

    const partyIndex = headers.indexOf(partyHeader);
    const votesIndex = headers.indexOf(votesHeader);
    const candidateIndex = candidateHeader ? headers.indexOf(candidateHeader) : -1;
    
    // Get indices for optional columns
    const getIndex = (header: string | null) => header ? headers.indexOf(header) : -1;
    const electionIndex = getIndex(electionHeader);
    const departmentIndex = getIndex(departmentHeader);
    const municipioIndex = getIndex(municipioHeader);
    const comunaIndex = getIndex(comunaHeader);
    const zonaIndex = getIndex(zonaHeader);
    const puestoIndex = getIndex(puestoHeader);
    const circunscripcionIndex = getIndex(circunscripcionHeader);
    const codigoDepartamentoIndex = getIndex(codigoDepartamentoHeader);
    const codigoMunicipioIndex = getIndex(codigoMunicipioHeader);
    const codigoCandidatoIndex = getIndex(codigoCandidatoHeader);

    const yearMatch = file.name.match(/\d{4}/);
    const year = yearMatch ? yearMatch[0] : new Date().getFullYear().toString();
    
    const getCell = (row: any[], index: number) => (index !== -1 && row[index]) ? String(row[index]) : '';

    const reconstructedData = body.map(row => {
        const unidadPolitica = getCell(row, partyIndex);
        const votosStr = getCell(row, votesIndex).replace(/\D/g, ''); // Clean non-numeric chars from votes
        const votos = parseInt(votosStr, 10);
        
        // Skip if essential data is missing or invalid
        if (!unidadPolitica || isNaN(votos)) return null;

        let candidato = getCell(row, candidateIndex);
        if (!candidato || normalizeHeader(candidato) === normalizeHeader(unidadPolitica)) {
            candidato = 'SOLO POR LA LISTA';
        }
        
        const isCabezaDeLista = normalizeHeader(candidato) === 'solo por la lista';

        const electionType = getCell(row, electionIndex) || 'Elección';
        const department = getCell(row, departmentIndex);
        const eleccion = `${electionType} ${department}`.trim();

        return {
            Eleccion: eleccion,
            Año: year,
            UnidadPolitica: unidadPolitica,
            Candidato: candidato,
            Votos: votos,
            EsCabezaDeLista: isCabezaDeLista ? 'TRUE' : 'FALSE',
            AlianzaHistoricaID: '',
            Departamento: department,
            CodigoDepartamento: getCell(row, codigoDepartamentoIndex),
            Municipio: getCell(row, municipioIndex),
            CodigoMunicipio: getCell(row, codigoMunicipioIndex),
            Comuna: getCell(row, comunaIndex),
            Zona: getCell(row, zonaIndex),
            Puesto: getCell(row, puestoIndex),
            Circunscripcion: getCell(row, circunscripcionIndex),
            CodigoCandidato: getCell(row, codigoCandidatoIndex),
        };
    }).filter((row): row is Exclude<typeof row, null> => row !== null && row.Votos > 0);
    
    return Papa.unparse(reconstructedData);
};


export const parseFiles = async (
    files: File[],
    setLoadingMessage: (message: string) => void
): Promise<string[]> => {
    const csvPromises = files.map(async (file): Promise<string> => {
        setLoadingMessage(`Procesando ${file.name}...`);
        
        switch (file.type) {
            case 'text/csv':
                return file.text();
            
            case 'text/plain':
                setLoadingMessage(`Extrayendo texto de ${file.name} (TXT)...`);
                const txtText = await file.text();
                setLoadingMessage(`Estructurando datos de ${file.name} con IA...`);
                return extractDataFromText(txtText);

            case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': // XLSX
                setLoadingMessage(`Procesando ${file.name} (XLSX)...`);
                return await readXlsxAsCsv(file);

            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': // DOCX
                setLoadingMessage(`Extrayendo texto de ${file.name} (DOCX)...`);
                const docxText = await readDocxText(file);
                setLoadingMessage(`Estructurando datos de ${file.name} con IA...`);
                return extractDataFromText(docxText);

            case 'application/pdf':
                setLoadingMessage(`Extrayendo texto de ${file.name} (PDF)...`);
                const pdfText = await readPdfText(file);
                setLoadingMessage(`Estructurando datos de ${file.name} con IA...`);
                return extractDataFromText(pdfText);

            case 'image/jpeg':
            case 'image/png':
                setLoadingMessage(`Extrayendo datos de la imagen ${file.name} con IA...`);
                const base64Data = await fileToBase64(file);
                return extractDataFromDocument({ mimeType: file.type, data: base64Data });

            default:
                throw new Error(`Tipo de archivo no soportado: ${file.type}`);
        }
    });

    return Promise.all(csvPromises);
};
