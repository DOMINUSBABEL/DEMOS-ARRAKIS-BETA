import { HistoricalDataset, CoalitionBreakdown, PartyData } from '../types';

const KNOWN_COALITIONS: Record<string, string[]> = {
    'JUNTOS': ['CAMBIO RADICAL', 'MIRA', 'PARTIDO DE LA U'],
    'COALICION CAMBIO RADICAL -MIRA': ['PARTIDO CAMBIO RADICAL', 'PARTIDO MIRA'],
    'COALICION PARTIDOS CAMBIO RADICAL - COLOMBIA JUSTA LIBRES - MIRA': ['PARTIDO CAMBIO RADICAL', 'COLOMBIA JUSTA LIBRES', 'PARTIDO MIRA'],
};

export const calculateCoalitionBreakdown = (
    coalitionDataset: HistoricalDataset,
    referenceDataset: HistoricalDataset,
    coalitionName: string
): CoalitionBreakdown[] => {

    const coalitionData = coalitionDataset.partyData.find(p => p.name === coalitionName);
    if (!coalitionData) {
        throw new Error(`La coalición "${coalitionName}" no fue encontrada en el conjunto de datos seleccionado.`);
    }
    const coalitionTotalVotes = coalitionData.votes;
    
    let memberParties: PartyData[];
    const normalizedCoalitionName = coalitionName.toUpperCase();

    const knownMatch = Object.keys(KNOWN_COALITIONS).find(key => normalizedCoalitionName.includes(key));
    
    if (knownMatch) {
        const memberNames = KNOWN_COALITIONS[knownMatch];
        memberParties = referenceDataset.partyData.filter(p => memberNames.some(memberName => p.name.includes(memberName)));
        
        if (memberParties.length === 0) {
             throw new Error(`No se encontraron miembros para la coalición predefinida "${coalitionName}" en el set de datos de referencia.`);
        }
    } else {
        memberParties = referenceDataset.partyData.filter(p => 
            coalitionName.includes(p.name) && p.name !== coalitionName
        );
    }


    if (memberParties.length === 0) {
        throw new Error(`No se encontraron partidos miembros para "${coalitionName}" en el set de datos de referencia. Para coaliciones no predefinidas, asegúrate de que sus nombres estén incluidos en el nombre de la coalición.`);
    }

    const totalReferenceVotes = memberParties.reduce((sum, p) => sum + p.votes, 0);

    if (totalReferenceVotes === 0) {
        throw new Error("Los partidos miembros no tienen votos en la elección de referencia.");
    }

    const breakdown: CoalitionBreakdown[] = memberParties.map(party => {
        const referenceShare = party.votes / totalReferenceVotes;
        const estimatedVotes = Math.round(referenceShare * coalitionTotalVotes);
        return {
            party: party.name,
            estimatedVotes: estimatedVotes,
            contributionPercentage: estimatedVotes / coalitionTotalVotes,
            color: party.color
        };
    });
    
    const totalPercentage = breakdown.reduce((sum, p) => sum + p.contributionPercentage, 0);
    if (totalPercentage > 0) {
      breakdown.forEach(p => p.contributionPercentage /= totalPercentage);
    }


    return breakdown.sort((a, b) => b.estimatedVotes - a.estimatedVotes);
};