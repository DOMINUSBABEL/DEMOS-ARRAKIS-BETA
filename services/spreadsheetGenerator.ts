import { WorkBook, WorkSheet, utils, writeFile } from 'xlsx';
import { HistoricalDataset, PartyAnalysisData, DHondtAnalysis, PartyData, CoalitionBreakdown } from '../types';

export const exportGeneralAnalysisToXLSX = (
    dataset: HistoricalDataset, 
    partyAnalysis: Map<string, PartyAnalysisData>,
    partyFilter: string
) => {
    const wb: WorkBook = utils.book_new();

    // Sheet 1: Summary
    const summaryData = [
        ["Nombre del Conjunto de Datos", dataset.name],
        ["Tipo de Análisis", dataset.analysisType === 'candidate' ? 'Por Candidato' : 'Por Partido'],
        ["Total de Registros Válidos", dataset.processedData.length],
        ["Votos en Blanco", dataset.invalidVoteCounts.blankVotes],
        ["Votos Nulos", dataset.invalidVoteCounts.nullVotes],
    ];
    const summaryWs: WorkSheet = utils.aoa_to_sheet(summaryData);
    utils.book_append_sheet(wb, summaryWs, "Resumen");

    // Sheet 2: Base Ranking
    const rankingData = (partyFilter ? dataset.baseRanking.filter(r => r.unidadPolitica === partyFilter) : dataset.baseRanking)
        .map(r => ({
            Candidato: r.candidato,
            "Unidad Política": r.unidadPolitica,
            "Poder Electoral Base": r.poderElectoralBase
        }));
    const rankingWs: WorkSheet = utils.json_to_sheet(rankingData);
    utils.book_append_sheet(wb, rankingWs, "Ranking Base");

    // Sheet 3: Techos y Pisos
    const historyData = Array.from(partyAnalysis.values()).map(party => {
        const history = party.history;
        if (history.length === 0) return null;
        const techo = history.reduce((max, curr) => curr.votes > max.votes ? curr : max, history[0]);
        const piso = history.reduce((min, curr) => curr.votes < min.votes ? curr : min, history[0]);
        return {
            "Partido": party.name,
            "Votos Techo": techo.votes,
            "Elección Techo": techo.datasetName,
            "Votos Piso": piso.votes,
            "Elección Piso": piso.datasetName,
        }
    }).filter(d => d !== null);
    const historyWs: WorkSheet = utils.json_to_sheet(historyData);
    utils.book_append_sheet(wb, historyWs, "Techos y Pisos");

    writeFile(wb, `Analisis_${dataset.name}.xlsx`);
};

export const exportDHondtToXLSX = (
    analysis: DHondtAnalysis,
    parties: PartyData[]
) => {
    const wb: WorkBook = utils.book_new();

    // Sheet 1: Seat Allocation
    const allocationData = analysis.seats.map(s => {
        const partyVotes = parties.find(p => p.name === s.party)?.votes || 0;
        const percentage = analysis.totalVotes > 0 ? (partyVotes / analysis.totalVotes) : 0;
        return {
            Partido: s.party,
            Votos: partyVotes,
            "Porcentaje (%)": percentage * 100,
            "Escaños Asignados": s.seats
        };
    });
    const allocationWs: WorkSheet = utils.json_to_sheet(allocationData);
    utils.book_append_sheet(wb, allocationWs, "Asignación de Escaños");

    // Sheet 2: Efficiency
    const efficiencyData = analysis.votesPerSeat.map(v => ({
        Partido: v.party,
        "Votos por Escaño": v.votes
    }));
    const efficiencyWs: WorkSheet = utils.json_to_sheet(efficiencyData);
    utils.book_append_sheet(wb, efficiencyWs, "Eficiencia de Voto");
    
    // Sheet 3: Step-by-step
    const stepsData = analysis.steps.map(s => ({
        "# Escaño": s.seatNumber,
        "Partido Ganador": s.party,
        "Votos del Partido": s.partyVotes,
        "Escaños Acumulados": s.seatsWon,
        "Cociente": s.quotient
    }));
    const stepsWs: WorkSheet = utils.json_to_sheet(stepsData);
    utils.book_append_sheet(wb, stepsWs, "Cálculo Paso a Paso");
    
    writeFile(wb, `Simulacion_DHondt.xlsx`);
};

export const exportCoalitionAnalysisToXLSX = (
    breakdown: CoalitionBreakdown[],
    coalitionName: string
) => {
    const wb: WorkBook = utils.book_new();
    const data = breakdown.map(item => ({
        "Partido Miembro": item.party,
        "Votos Estimados Aportados": item.estimatedVotes,
        "Porcentaje de Aporte (%)": item.contributionPercentage * 100
    }));
    const ws: WorkSheet = utils.json_to_sheet(data);
    utils.book_append_sheet(wb, ws, "Desglose de Coalición");
    writeFile(wb, `Analisis_Coalicion_${coalitionName}.xlsx`);
};

export const exportStrategicReportToXLSX = (reportText: string, fileName: string) => {
    const wb = utils.book_new();
    const sections = reportText.split('--- TABLE START:');

    // The first section is text before any table, ignore for table extraction
    for (let i = 1; i < sections.length; i++) {
        const section = sections[i];
        const [titlePart, ...tableParts] = section.split('---');
        const tableName = titlePart.trim().slice(0, 30); // Excel sheet names are max 31 chars
        const tableContent = tableParts.join('---').replace('TABLE END ---', '').trim();

        const rows = tableContent.split('\n').map(row => 
            row.split('|').map(cell => cell.trim()).filter(cell => cell)
        ).filter(row => row.length > 0 && !row.every(cell => cell.startsWith('-')));
        
        if (rows.length > 1) { // Header + at least one data row
            const ws = utils.aoa_to_sheet(rows);
            utils.book_append_sheet(wb, ws, tableName);
        }
    }

    if (wb.SheetNames.length === 0) {
        alert("No se encontraron tablas de datos en el informe para exportar a Excel.");
        return;
    }
    
    writeFile(wb, `${fileName}.xlsx`);
};