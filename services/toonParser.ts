import { ProcessedElectionData } from '../types';

/**
 * Serializes an array of objects into a compact TOON string format.
 * Dynamically includes optional keys only if they are present in the data.
 * @param data The array of objects to serialize.
 * @param name The name for the data collection.
 * @returns A string in TOON format.
 */
export function serializeToToon(data: ProcessedElectionData[], name: string): string {
    if (!Array.isArray(data) || data.length === 0) {
        return `${name}[0]{}:`;
    }

    // Define base keys that should always be checked for consistency
    const baseKeys: (keyof ProcessedElectionData)[] = [
        'Eleccion', 'Año', 'UnidadPolitica', 'Candidato', 'Votos',
        'EsCabezaDeLista', 'AlianzaHistoricaID', 'votos_calculados'
    ];
    
    // Define the optional classification keys
    const optionalKeys: (keyof ProcessedElectionData)[] = [
        'Departamento', 'CodigoDepartamento', 'Municipio', 'CodigoMunicipio',
        'Comuna', 'Zona', 'Puesto', 'Circunscripcion', 'CodigoCandidato'
    ];

    // Find which optional keys are actually present in the dataset
    const presentOptionalKeys = optionalKeys.filter(key => 
        data.some(item => item[key] !== undefined && item[key] !== null && String(item[key]).trim() !== '')
    );

    // The final set of keys to be included in the output
    const allKeys = [...baseKeys, ...presentOptionalKeys];

    const header = `${name}[${data.length}]{${allKeys.join(',')}}:`;

    const rows = data.map(item => {
        return allKeys.map(key => {
            const value = item[key];
            const displayValue = (value === undefined || value === null) ? '' : String(value);

            // Quote strings that contain commas to maintain structure
            if (typeof displayValue === 'string' && displayValue.includes(',')) {
                return `"${displayValue}"`;
            }
            return displayValue;
        }).join(',');
    });

    return `${header}\n${rows.join('\n')}`;
}

/**
 * Parses a CSV-like row string, correctly handling quoted fields and empty values.
 * @param rowStr The string for a single row.
 * @returns An array of field values.
 */
function parseToonRow(rowStr: string): string[] {
    const values: string[] = [];
    let currentVal = '';
    let inQuotes = false;

    for (let i = 0; i < rowStr.length; i++) {
        const char = rowStr[i];

        if (inQuotes) {
            // Handle escaped quotes ("")
            if (char === '"' && i < rowStr.length - 1 && rowStr[i + 1] === '"') {
                currentVal += '"';
                i++; // Skip the next quote
            } else if (char === '"') {
                inQuotes = false;
            } else {
                currentVal += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                values.push(currentVal);
                currentVal = '';
            } else {
                currentVal += char;
            }
        }
    }
    values.push(currentVal); // Add the final value after the loop
    return values;
}


/**
 * Parses a TOON string back into an array of ProcessedElectionData objects.
 * @param toonString The string in TOON format.
 * @returns An array of ProcessedElectionData objects.
 */
export function parseToon(toonString: string): ProcessedElectionData[] {
    if (!toonString || !toonString.includes('\n')) {
        // Handle case where there might be a header but no data rows.
        if (toonString.includes('[0]')) return [];
        return [];
    }
    
    // Trim any trailing newlines to prevent parsing an empty row at the end.
    const lines = toonString.trim().split('\n');
    const header = lines[0];
    
    const headerMatch = header.match(/^(.*)\[(\d+)\]\{(.*)\}:$/);
    if (!headerMatch) {
        console.error("Invalid TOON header:", header);
        if (header.match(/^(.*)\[0\]\{(.*)\}:$/)) return []; // Valid case for empty dataset
        throw new Error("Invalid TOON header format");
    }

    const keys = headerMatch[3].split(',').map(k => k.trim());
    const dataRows = lines.slice(1);

    const data: ProcessedElectionData[] = [];

    for (const rowStr of dataRows) {
        if (!rowStr.trim()) continue;
        
        // Use the robust manual parser instead of a faulty regex.
        const values = parseToonRow(rowStr);

        if (values.length !== keys.length) {
            console.warn(`Skipping malformed TOON row. Expected ${keys.length} values, found ${values.length}: "${rowStr}"`);
            continue;
        }

        const item: any = {};
        keys.forEach((key, index) => {
            // Trim values that are not quoted to handle potential whitespace
            const value = values[index];
            item[key] = value;
        });

        // Type conversion
        item.Votos = parseInt(item.Votos, 10) || 0;
        item.votos_calculados = parseInt(item.votos_calculados, 10) || 0;
        item.EsCabezaDeLista = item.EsCabezaDeLista === 'true';

        data.push(item as ProcessedElectionData);
    }
    return data;
}

/**
 * Efficiently extracts the record count from a TOON string header.
 * @param toonData The string in TOON format.
 * @returns The number of records.
 */
export function getToonRecordCount(toonData: string): number {
    if (!toonData) return 0;
    const header = toonData.split('\n')[0];
    const match = header.match(/\[(\d+)\]/);
    return match ? parseInt(match[1], 10) : 0;
}