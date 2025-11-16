import React, { useState, useMemo, useEffect } from 'react';
import { DHondtAnalysis, PartyData, PartyAnalysisData } from '../types';
import { BarChart as RechartsBarChart, PieChart, ResponsiveContainer, Cell, Tooltip, Legend, Bar, XAxis, YAxis, CartesianGrid, Pie } from 'recharts';
import DataTable from './DataTable';
import TrendsAnalysis from './TrendsAnalysis';

interface DHondtResultsProps {
  analysis: DHondtAnalysis;
  parties: PartyData[];
  partyAnalysis?: Map<string, PartyAnalysisData>;
  isDetailed?: boolean;
}

type Tab = 'summary' | 'details' | 'efficiency' | 'steps' | 'trends';

const shortenPartyName = (name: string): string => {
    if (!name) return '';
    const lowerName = name.toLowerCase();
    if (lowerName.includes('centro democratico')) return 'C. Democ.';
    if (lowerName.includes('liberal colombiano')) return 'Liberal';
    if (lowerName.includes('conservador colombiano')) return 'Conservador';
    if (lowerName.includes('cambio radical')) return 'Cambio Rad.';
    if (lowerName.includes('alianza verde')) return 'A. Verde';
    if (lowerName.includes('de la u')) return 'De la U';
    if (lowerName.includes('polo democratico')) return 'Polo';
    if (lowerName.includes('pacto historico')) return 'Pacto Hist.';
    if (lowerName.includes('creemos')) return 'Creemos';
    if (lowerName.includes('independientes')) return 'Independ.';
    if (lowerName.includes('alianza social')) return 'ASI';
    if (lowerName.includes('mira')) return 'MIRA';
    if (lowerName.includes('justa libres')) return 'J. Libres';
    if (name.length > 12 && !name.includes(' ')) return name.substring(0, 9) + '...';
    
    const words = name.split(' ').filter(w => /^[A-ZÁÉÍÓÚÑ]+$/.test(w) && w.length > 1);
    if (words.length > 2) {
        const acronym = words.map(w => w[0]).join('');
        return acronym;
    }
    
    return name.length > 12 ? name.substring(0, 9) + '...' : name;
};


const DHondtResults: React.FC<DHondtResultsProps> = ({ analysis, parties, partyAnalysis, isDetailed = false }) => {
  const [activeTab, setActiveTab] = useState<Tab>('summary');
   const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));

    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.attributeName === 'class') {
                    setIsDarkMode(document.documentElement.classList.contains('dark'));
                }
            }
        });
        observer.observe(document.documentElement, { attributes: true });
        return () => observer.disconnect();
    }, []);

    const themeColors = useMemo(() => ({
      textColor: isDarkMode ? '#f5e5d5' : '#1e293b', // text-primary
      gridColor: isDarkMode ? '#4f4235' : '#e2e8f0', // border
      tooltip: {
          backgroundColor: isDarkMode ? '#2a221b' : '#ffffff', // card
          border: isDarkMode ? '#4f4235' : '#e2e8f0', // border
          color: isDarkMode ? '#f5e5d5' : '#1e293b' // text-primary
      }
  }), [isDarkMode]);


  const { displayParties, displaySeats } = useMemo(() => {
    if (isDetailed || !analysis.totalVotes || analysis.totalVotes === 0) {
      return { displayParties: parties, displaySeats: analysis.seats };
    }

    const SIMPLIFICATION_THRESHOLD = 0.015;
    const partiesToGroupNames = new Set<string>();
    
    analysis.seats.forEach(seatAllocation => {
      const party = parties.find(p => p.name === seatAllocation.party);
      if (!party) return;

      const voteShare = party.votes / analysis.totalVotes;
      if (seatAllocation.seats === 0 && voteShare < SIMPLIFICATION_THRESHOLD) {
        partiesToGroupNames.add(party.name);
      }
    });

    if (partiesToGroupNames.size <= 1) {
      return { displayParties: parties, displaySeats: analysis.seats };
    }

    const partiesToKeep: PartyData[] = [];
    const partiesToGroup: PartyData[] = [];
    parties.forEach(p => {
        if(partiesToGroupNames.has(p.name)) {
            partiesToGroup.push(p);
        } else {
            partiesToKeep.push(p);
        }
    });

    const othersVotes = partiesToGroup.reduce((sum, p) => sum + p.votes, 0);
    const othersParty: PartyData = { id: -1, name: 'Otros', votes: othersVotes, color: '#6b7280' };
    const finalDisplayParties = [...partiesToKeep, othersParty];
    const finalDisplaySeats = [
      ...analysis.seats.filter(s => !partiesToGroupNames.has(s.party)),
      { party: 'Otros', seats: 0 }
    ];

    return {
      displayParties: finalDisplayParties,
      displaySeats: finalDisplaySeats
    };

  }, [isDetailed, parties, analysis]);
  
  const shorten = (name: string) => isDetailed ? name : shortenPartyName(name);

  const displayTotalVotes = useMemo(() => displayParties.reduce((sum, p) => sum + p.votes, 0), [displayParties]);
  const partyColorMap = new Map(displayParties.map(p => [shorten(p.name), p.color]));

  const seatData = displaySeats.filter(s => s.seats > 0).map(s => ({
    name: shorten(s.party),
    value: s.seats,
  })).sort((a,b) => a.value - b.value);
  
  const voteData = displayParties.map(s => {
      return {
          name: shorten(s.name),
          value: s.votes
      };
  });

    const voteDistributionData = displayParties
    .map(p => ({
        name: shorten(p.name),
        Votos: p.votes
    }))
    .sort((a, b) => b.Votos - a.Votos);

    const efficiencyChartData = analysis.votesPerSeat
    .filter(v => displayParties.some(p => p.name === v.party))
    .map(v => ({
        name: shorten(v.party),
        'Votos por Escaño': v.votes,
    }))
    .sort((a, b) => a['Votos por Escaño'] - b['Votos por Escaño']);
    
    const detailsTableData = displaySeats.map(s => {
        const partyVotes = displayParties.find(p => p.name === s.party)?.votes || 0;
        const percentage = displayTotalVotes > 0 ? ((partyVotes / displayTotalVotes) * 100).toFixed(2) + '%' : '0.00%';
        return [shorten(s.party), partyVotes, percentage, s.seats];
    });

    const efficiencyTableData = analysis.votesPerSeat.filter(v => displayParties.some(p => p.name === v.party)).map(v => [shorten(v.party), v.votes]);
    
    const stepsTableData = analysis.steps.map(s => [s.seatNumber, shorten(s.party), s.partyVotes, s.seatsWon, Math.round(s.quotient).toLocaleString('es-CO')]);


  const TabButton: React.FC<{ tabId: Tab, children: React.ReactNode, disabled?: boolean }> = ({ tabId, children, disabled = false }) => (
    <button
        onClick={() => !disabled && setActiveTab(tabId)}
        disabled={disabled}
        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeTab === tabId ? 'bg-brand-primary text-white' : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-border/50 dark:hover:bg-dark-border'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        {children}
    </button>
  );

  return (
    <div className="space-y-4">
        <div className="bg-light-bg dark:bg-dark-bg p-1 rounded-lg flex flex-wrap gap-1 justify-center">
            <TabButton tabId="summary">Resumen</TabButton>
            <TabButton tabId="details">Detalles</TabButton>
            <TabButton tabId="efficiency">Eficiencia</TabButton>
            <TabButton tabId="steps">Pasos</TabButton>
            <TabButton tabId="trends" disabled={!partyAnalysis}>Tendencias</TabButton>
        </div>
        
        <div className={activeTab === 'summary' ? 'block' : 'hidden'}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
                <div className="bg-light-bg dark:bg-dark-bg p-4 rounded-lg">
                    <div className="text-2xl font-bold text-brand-primary">{analysis.totalVotes.toLocaleString('es-CO')}</div>
                    <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Votos Totales</div>
                </div>
                 <div className="bg-light-bg dark:bg-dark-bg p-4 rounded-lg">
                    <div className="text-xl font-bold text-brand-primary truncate" title={analysis.lastSeatWinner?.party}>{analysis.lastSeatWinner ? shorten(analysis.lastSeatWinner.party) : 'N/A'}</div>
                    <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Ganador Última Curul</div>
                </div>
                 <div className="bg-light-bg dark:bg-dark-bg p-4 rounded-lg">
                    <div className="text-xl font-bold text-brand-primary truncate" title={analysis.runnerUp?.party}>{analysis.runnerUp ? shorten(analysis.runnerUp.party) : 'N/A'}</div>
                    <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Siguiente en la Fila</div>
                </div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="w-full">
                    <h4 className="text-md font-semibold text-center mb-2 text-light-text-primary dark:text-dark-text-primary">Escaños por Partido</h4>
                    <ResponsiveContainer width="100%" height={Math.max(isDetailed ? 200 : 180, seatData.length * (isDetailed ? 35 : 28) + 40)}>
                         <RechartsBarChart data={seatData} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={themeColors.gridColor} />
                            <XAxis type="number" stroke={themeColors.textColor} tick={{ fontSize: 10, fill: themeColors.textColor }} allowDecimals={false} />
                            <YAxis type="category" dataKey="name" stroke={themeColors.textColor} tick={{ fontSize: isDetailed ? 10 : 9, fill: themeColors.textColor }} width={isDetailed ? 100 : 75} interval={0}/>
                            <Tooltip contentStyle={themeColors.tooltip} itemStyle={{color: themeColors.textColor}} cursor={{fill: 'rgba(217, 119, 6, 0.1)'}}/>
                            <Bar dataKey="value" name="Escaños" barSize={isDetailed ? 18 : 14}>
                                {seatData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={partyColorMap.get(entry.name) || '#8884d8'} />
                                ))}
                            </Bar>
                        </RechartsBarChart>
                    </ResponsiveContainer>
                </div>
                 <div className={isDetailed ? "h-72" : "h-64"}>
                    <h4 className="text-md font-semibold text-center mb-2 text-light-text-primary dark:text-dark-text-primary">Distribución de Votos</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={voteData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={isDetailed ? 70 : 55}
                                labelLine={!isDetailed ? false : { stroke: themeColors.textColor, strokeWidth: 0.5 }}
                                label={isDetailed ? ({ name, percent }) => (Number(percent ?? 0)) > 0.02 ? `${name} (${(Number(percent ?? 0) * 100).toFixed(0)}%)` : '' : false}
                                fontSize={isDetailed ? 10 : 9}
                                stroke={themeColors.tooltip.backgroundColor}
                            >
                                {voteData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={partyColorMap.get(entry.name) || '#8884d8'} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={themeColors.tooltip} itemStyle={{color: themeColors.textColor}} />
                            <Legend wrapperStyle={{color: themeColors.textColor, fontSize: isDetailed ? '12px' : '10px', overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        <div className={activeTab === 'details' ? 'block space-y-6' : 'hidden'}>
            <div className={isDetailed ? "h-72" : "h-64"}>
                <h4 className="text-md font-semibold text-center mb-2 text-light-text-primary dark:text-dark-text-primary">Votos Totales por Partido</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={voteDistributionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={themeColors.gridColor} />
                        <XAxis dataKey="name" stroke={themeColors.textColor} tick={{ fontSize: isDetailed ? 10 : 9, fill: themeColors.textColor }} interval={0} angle={-30} textAnchor="end" height={isDetailed ? 70: 50} />
                        <YAxis stroke={themeColors.textColor} tick={{ fontSize: 12, fill: themeColors.textColor }} />
                        <Tooltip contentStyle={themeColors.tooltip} itemStyle={{color: themeColors.textColor}} cursor={{fill: 'rgba(217, 119, 6, 0.1)'}}/>
                        <Legend wrapperStyle={{color: themeColors.textColor}}/>
                        <Bar dataKey="Votos" name="Votos">
                            {voteDistributionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={partyColorMap.get(entry.name) || '#8884d8'} />
                            ))}
                        </Bar>
                    </RechartsBarChart>
                </ResponsiveContainer>
            </div>
            <DataTable 
                title="Tabla de Detalles"
                headers={['Partido', 'Votos', 'Porcentaje (%)', 'Escaños Asignados']}
                data={detailsTableData}
                colorMap={partyColorMap}
                colorColumnKey="Partido"
            />
        </div>

        <div className={activeTab === 'efficiency' ? 'block space-y-6' : 'hidden'}>
            <div className={isDetailed ? "h-72" : "h-64"}>
                <h4 className="text-md font-semibold text-center mb-2 text-light-text-primary dark:text-dark-text-primary">Eficiencia del Voto (Votos por Escaño)</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={efficiencyChartData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={themeColors.gridColor} />
                        <XAxis type="number" stroke={themeColors.textColor} tick={{ fontSize: 12, fill: themeColors.textColor }} />
                        <YAxis type="category" dataKey="name" stroke={themeColors.textColor} tick={{ fontSize: isDetailed ? 10 : 9, fill: themeColors.textColor }} width={isDetailed ? 100 : 75} interval={0} />
                        <Tooltip contentStyle={themeColors.tooltip} itemStyle={{color: themeColors.textColor}} cursor={{fill: 'rgba(217, 119, 6, 0.1)'}}/>
                        <Legend wrapperStyle={{color: themeColors.textColor}}/>
                        <Bar dataKey="Votos por Escaño" name="Votos por Escaño">
                            {efficiencyChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={partyColorMap.get(entry.name) || '#8884d8'} />
                            ))}
                        </Bar>
                    </RechartsBarChart>
                </ResponsiveContainer>
            </div>
            <DataTable
                title="Tabla de Eficiencia"
                headers={['Partido', 'Votos por Escaño']}
                data={efficiencyTableData}
                colorMap={partyColorMap}
                colorColumnKey="Partido"
            />
        </div>

        <div className={activeTab === 'steps' ? 'block' : 'hidden'}>
             <DataTable
                title=""
                headers={['# Escaño', 'Partido Ganador', 'Votos del Partido', 'Escaños Acumulados', 'Cociente']}
                data={stepsTableData}
                colorMap={partyColorMap}
                colorColumnKey="Partido Ganador"
            />
        </div>

        <div className={activeTab === 'trends' ? 'block' : 'hidden'}>
            {partyAnalysis && <TrendsAnalysis partyAnalysis={partyAnalysis} />}
        </div>
    </div>
  );
};

export default DHondtResults;