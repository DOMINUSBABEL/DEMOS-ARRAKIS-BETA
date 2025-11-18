import React, { useState, useMemo, useEffect } from 'react';
import { DHondtAnalysis, PartyData, PartyAnalysisData } from '../types';
import { BarChart as RechartsBarChart, PieChart, ResponsiveContainer, Cell, Tooltip, Legend, Bar, XAxis, YAxis, CartesianGrid, Pie, Sector } from 'recharts';
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

// Active Shape for Pie Chart interaction
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

  return (
    <g>
      <text x={cx} y={cy} dy={-8} textAnchor="middle" fill="#f5e5d5" className="text-sm font-bold font-mono">
        {payload.name}
      </text>
      <text x={cx} y={cy} dy={12} textAnchor="middle" fill="#999" className="text-xs font-mono">
        {`${(percent * 100).toFixed(1)}%`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 4}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 8}
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
        className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${activeTab === tabId ? 'bg-brand-primary text-white shadow-[0_0_10px_rgba(217,119,6,0.4)]' : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-white/5 hover:text-white'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        {children}
    </button>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-[#1c1611]/95 border border-[#4f4235] p-3 rounded-lg shadow-xl backdrop-blur-md">
             <p className="text-xs text-gray-400 mb-1">{label}</p>
             <p className="text-brand-primary font-bold">{payload[0].value.toLocaleString('es-CO')}</p>
          </div>
        );
      }
      return null;
  };

  return (
    <div className="space-y-6">
        <div className="bg-black/20 p-1 rounded-xl flex flex-wrap gap-1 justify-center border border-white/5 w-fit mx-auto">
            <TabButton tabId="summary">Resumen</TabButton>
            <TabButton tabId="details">Detalles</TabButton>
            <TabButton tabId="efficiency">Eficiencia</TabButton>
            <TabButton tabId="steps">Pasos</TabButton>
            <TabButton tabId="trends" disabled={!partyAnalysis}>Tendencias</TabButton>
        </div>
        
        <div className={activeTab === 'summary' ? 'block animate-fade-in' : 'hidden'}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
                <div className="bg-gradient-to-br from-dark-card to-dark-bg p-6 rounded-xl border border-white/5 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-16 h-16 bg-brand-primary/10 rounded-bl-full transition-transform group-hover:scale-110"></div>
                    <div className="text-3xl font-bold text-brand-primary font-mono tracking-tight">{analysis.totalVotes.toLocaleString('es-CO')}</div>
                    <div className="text-xs uppercase tracking-widest text-dark-text-secondary mt-1">Votos Totales</div>
                </div>
                 <div className="bg-gradient-to-br from-dark-card to-dark-bg p-6 rounded-xl border border-white/5 relative overflow-hidden">
                    <div className="text-xl font-bold text-brand-glow truncate" title={analysis.lastSeatWinner?.party}>{analysis.lastSeatWinner ? shorten(analysis.lastSeatWinner.party) : 'N/A'}</div>
                    <div className="text-xs uppercase tracking-widest text-dark-text-secondary mt-1">Ganador Última Curul</div>
                </div>
                 <div className="bg-gradient-to-br from-dark-card to-dark-bg p-6 rounded-xl border border-white/5 relative overflow-hidden">
                    <div className="text-xl font-bold text-gray-400 truncate" title={analysis.runnerUp?.party}>{analysis.runnerUp ? shorten(analysis.runnerUp.party) : 'N/A'}</div>
                    <div className="text-xs uppercase tracking-widest text-dark-text-secondary mt-1">Siguiente en la Fila</div>
                </div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="w-full bg-dark-card/30 rounded-xl p-4 border border-white/5">
                    <h4 className="text-sm font-bold text-center mb-4 text-dark-text-primary uppercase tracking-wider">Escaños por Partido</h4>
                    <ResponsiveContainer width="100%" height={Math.max(isDetailed ? 300 : 250, seatData.length * (isDetailed ? 40 : 32) + 40)}>
                         <RechartsBarChart data={seatData} layout="vertical" margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false}/>
                            <XAxis type="number" stroke="#6b5a4e" tick={{ fontSize: 10, fill: '#a18f7c' }} allowDecimals={false} hide/>
                            <YAxis type="category" dataKey="name" stroke="#6b5a4e" tick={{ fontSize: isDetailed ? 11 : 10, fill: '#f5e5d5', fontWeight: 500 }} width={isDetailed ? 110 : 85} interval={0} axisLine={false} tickLine={false}/>
                            <Tooltip cursor={{fill: 'rgba(255, 255, 255, 0.03)'}} content={<CustomTooltip />}/>
                            <Bar dataKey="value" name="Escaños" barSize={isDetailed ? 20 : 16} radius={[0, 4, 4, 0]}>
                                {seatData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={partyColorMap.get(entry.name) || '#8884d8'} />
                                ))}
                            </Bar>
                        </RechartsBarChart>
                    </ResponsiveContainer>
                </div>
                 <div className={`${isDetailed ? "h-96" : "h-80"} bg-dark-card/30 rounded-xl p-4 border border-white/5`}>
                    <h4 className="text-sm font-bold text-center mb-2 text-dark-text-primary uppercase tracking-wider">Distribución de Votos</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            {/* @ts-ignore */}
                            <Pie
                                activeIndex={activeIndex}
                                activeShape={renderActiveShape}
                                data={voteData}
                                cx="50%"
                                cy="50%"
                                innerRadius={isDetailed ? 70 : 60}
                                outerRadius={isDetailed ? 100 : 85}
                                dataKey="value"
                                onMouseEnter={onPieEnter}
                                stroke="none"
                            >
                                {voteData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={partyColorMap.get(entry.name) || '#8884d8'} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        <div className={activeTab === 'details' ? 'block space-y-6 animate-fade-in' : 'hidden'}>
            <div className={isDetailed ? "h-96" : "h-80"}>
                <h4 className="text-sm font-bold text-center mb-4 text-dark-text-primary uppercase tracking-wider">Votos Totales por Partido</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={voteDistributionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="#6b5a4e" tick={{ fontSize: 10, fill: '#a18f7c' }} interval={0} angle={-30} textAnchor="end" height={70} />
                        <YAxis stroke="#6b5a4e" tick={{ fontSize: 11, fill: '#a18f7c' }} />
                        <Tooltip cursor={{fill: 'rgba(255, 255, 255, 0.03)'}} content={<CustomTooltip />}/>
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
                <h4 className="text-sm font-bold text-center mb-4 text-dark-text-primary uppercase tracking-wider">Eficiencia del Voto (Costo por Escaño)</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={efficiencyChartData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                        <XAxis type="number" stroke="#6b5a4e" tick={{ fontSize: 11, fill: '#a18f7c' }} />
                        <YAxis type="category" dataKey="name" stroke="#6b5a4e" tick={{ fontSize: 11, fill: '#f5e5d5' }} width={isDetailed ? 110 : 85} interval={0} />
                        <Tooltip cursor={{fill: 'rgba(255, 255, 255, 0.03)'}} content={<CustomTooltip />}/>
                        <Bar dataKey="Votos por Escaño" name="Votos por Escaño" radius={[0, 4, 4, 0]}>
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
