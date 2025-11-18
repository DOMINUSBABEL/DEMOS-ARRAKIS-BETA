import React, { useState, useMemo } from 'react';
import { DHondtAnalysis, PartyData, PartyAnalysisData } from '../types';
import { BarChart as RechartsBarChart, PieChart, ResponsiveContainer, Cell, Tooltip, Bar, XAxis, YAxis, CartesianGrid, Pie, Sector } from 'recharts';
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

// Active Shape for Donut Chart interaction
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;

  return (
    <g>
      <text x={cx} y={cy} dy={-10} textAnchor="middle" fill="#f5e5d5" className="text-xs font-bold font-mono uppercase tracking-wider drop-shadow-md">
        {payload.name}
      </text>
      <text x={cx} y={cy} dy={15} textAnchor="middle" fill="#d97706" className="text-sm font-mono font-bold drop-shadow-[0_0_5px_rgba(217,119,6,0.8)]">
        {`${(percent * 100).toFixed(1)}%`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 8}
        outerRadius={outerRadius + 10}
        fill={fill}
        fillOpacity={0.3}
      />
    </g>
  );
};


const DHondtResults: React.FC<DHondtResultsProps> = ({ analysis, parties, partyAnalysis, isDetailed = false }) => {
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

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
    const othersParty: PartyData = { id: -1, name: 'Otros', votes: othersVotes, color: '#4b5563' };
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
        className={`px-4 py-1.5 text-xs font-medium rounded transition-all duration-300 border uppercase tracking-wider font-mono ${activeTab === tabId ? 'bg-brand-primary/10 border-brand-primary text-brand-primary shadow-[0_0_10px_rgba(217,119,6,0.2)]' : 'border-transparent text-dark-text-secondary hover:bg-white/5 hover:text-white'} ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
    >
        {children}
    </button>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-[#0f0a06]/90 border border-brand-primary/30 p-3 rounded shadow-[0_0_20px_rgba(0,0,0,0.6)] backdrop-blur-xl">
             <p className="text-[10px] text-gray-400 mb-1 font-mono uppercase">{label}</p>
             <p className="text-brand-glow font-bold text-lg font-mono">{payload[0].value.toLocaleString('es-CO')}</p>
          </div>
        );
      }
      return null;
  };

  return (
    <div className="space-y-8">
        <div className="flex justify-center">
             <div className="bg-black/40 p-1 rounded border border-white/5 backdrop-blur-md inline-flex gap-1">
                <TabButton tabId="summary">Resumen</TabButton>
                <TabButton tabId="details">Detalles</TabButton>
                <TabButton tabId="efficiency">Eficiencia</TabButton>
                <TabButton tabId="steps">Pasos</TabButton>
                <TabButton tabId="trends" disabled={!partyAnalysis}>Tendencias</TabButton>
            </div>
        </div>
        
        <div className={activeTab === 'summary' ? 'block animate-fade-in' : 'hidden'}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-center">
                <div className="glass-panel p-5 rounded border border-brand-primary/20 relative overflow-hidden group">
                     <div className="absolute -top-10 -right-10 w-24 h-24 bg-brand-primary/10 rounded-full blur-2xl group-hover:bg-brand-primary/20 transition-colors"></div>
                    <div className="text-3xl font-bold text-brand-glow font-mono tracking-tighter">{analysis.totalVotes.toLocaleString('es-CO')}</div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-dark-text-secondary mt-2 font-bold">Votos Totales</div>
                </div>
                 <div className="glass-panel p-5 rounded border border-white/5 relative overflow-hidden">
                    <div className="text-xl font-bold text-white truncate font-mono" title={analysis.lastSeatWinner?.party}>{analysis.lastSeatWinner ? shorten(analysis.lastSeatWinner.party) : 'N/A'}</div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-brand-primary mt-2 font-bold">Ganador Última Curul</div>
                </div>
                 <div className="glass-panel p-5 rounded border border-white/5 relative overflow-hidden">
                    <div className="text-xl font-bold text-dark-text-secondary truncate font-mono" title={analysis.runnerUp?.party}>{analysis.runnerUp ? shorten(analysis.runnerUp.party) : 'N/A'}</div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-dark-text-muted mt-2 font-bold">Siguiente en Fila</div>
                </div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="w-full glass-panel rounded p-6 border border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                    <h4 className="text-xs font-bold text-center mb-6 text-dark-text-secondary uppercase tracking-[0.2em]">Escaños por Partido</h4>
                    <ResponsiveContainer width="100%" height={Math.max(isDetailed ? 350 : 300, seatData.length * (isDetailed ? 40 : 32) + 40)}>
                         <RechartsBarChart data={seatData} layout="vertical" margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
                            <defs>
                                <linearGradient id="seatGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#d97706" stopOpacity={0.4}/>
                                    <stop offset="100%" stopColor="#fbbf24" stopOpacity={1}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.03)" horizontal={false}/>
                            <XAxis type="number" stroke="#6b5a4e" tick={{ fontSize: 10, fill: '#6b5a4e' }} allowDecimals={false} hide/>
                            <YAxis type="category" dataKey="name" stroke="#6b5a4e" tick={{ fontSize: isDetailed ? 11 : 10, fill: '#a18f7c', fontWeight: 600, fontFamily: 'Inter' }} width={isDetailed ? 110 : 85} interval={0} axisLine={false} tickLine={false}/>
                            <Tooltip cursor={{fill: 'rgba(255, 255, 255, 0.02)'}} content={<CustomTooltip />}/>
                            <Bar dataKey="value" name="Escaños" barSize={isDetailed ? 16 : 12} radius={[0, 4, 4, 0]}>
                                {seatData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={partyColorMap.get(entry.name) || 'url(#seatGradient)'} strokeWidth={0} />
                                ))}
                            </Bar>
                        </RechartsBarChart>
                    </ResponsiveContainer>
                </div>
                 <div className={`${isDetailed ? "h-96" : "h-80"} glass-panel rounded p-6 border border-white/5 bg-gradient-to-bl from-white/5 to-transparent`}>
                    <h4 className="text-xs font-bold text-center mb-2 text-dark-text-secondary uppercase tracking-[0.2em]">Distribución de Votos</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                activeShape={renderActiveShape as any}
                                data={voteData}
                                cx="50%"
                                cy="50%"
                                innerRadius={isDetailed ? 70 : 65}
                                outerRadius={isDetailed ? 100 : 90}
                                dataKey="value"
                                onMouseEnter={onPieEnter}
                                stroke="none"
                                {...{ activeIndex } as any}
                            >
                                {voteData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={partyColorMap.get(entry.name) || '#333'} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        <div className={activeTab === 'details' ? 'block space-y-6 animate-fade-in' : 'hidden'}>
            <div className={isDetailed ? "h-96" : "h-80"}>
                <h4 className="text-xs font-bold text-center mb-4 text-dark-text-secondary uppercase tracking-[0.2em]">Votos Totales por Partido</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={voteDistributionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis dataKey="name" stroke="#6b5a4e" tick={{ fontSize: 10, fill: '#a18f7c' }} interval={0} angle={-30} textAnchor="end" height={70} />
                        <YAxis stroke="#6b5a4e" tick={{ fontSize: 11, fill: '#a18f7c', fontFamily: 'JetBrains Mono' }} />
                        <Tooltip cursor={{fill: 'rgba(255, 255, 255, 0.02)'}} content={<CustomTooltip />}/>
                        <Bar dataKey="Votos" name="Votos" radius={[4, 4, 0, 0]}>
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

        <div className={activeTab === 'efficiency' ? 'block space-y-6 animate-fade-in' : 'hidden'}>
            <div className={isDetailed ? "h-96" : "h-80"}>
                <h4 className="text-xs font-bold text-center mb-4 text-dark-text-secondary uppercase tracking-[0.2em]">Eficiencia del Voto (Costo por Escaño)</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={efficiencyChartData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                        <XAxis type="number" stroke="#6b5a4e" tick={{ fontSize: 11, fill: '#a18f7c', fontFamily: 'JetBrains Mono' }} />
                        <YAxis type="category" dataKey="name" stroke="#6b5a4e" tick={{ fontSize: 11, fill: '#f5e5d5' }} width={isDetailed ? 110 : 85} interval={0} />
                        <Tooltip cursor={{fill: 'rgba(255, 255, 255, 0.02)'}} content={<CustomTooltip />}/>
                        <Bar dataKey="Votos por Escaño" name="Votos por Escaño" radius={[0, 4, 4, 0]}>
                            {efficiencyChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={partyColorMap.get(entry.name) || '#8884d8'} fillOpacity={0.8} />
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

        <div className={activeTab === 'steps' ? 'block animate-fade-in' : 'hidden'}>
             <DataTable
                title=""
                headers={['# Escaño', 'Partido Ganador', 'Votos del Partido', 'Escaños Acumulados', 'Cociente']}
                data={stepsTableData}
                colorMap={partyColorMap}
                colorColumnKey="Partido Ganador"
            />
        </div>

        <div className={activeTab === 'trends' ? 'block animate-fade-in' : 'hidden'}>
            {partyAnalysis && <TrendsAnalysis partyAnalysis={partyAnalysis} />}
        </div>
    </div>
  );
};

export default DHondtResults;