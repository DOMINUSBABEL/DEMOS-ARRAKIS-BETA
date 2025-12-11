
import React, { useState, useMemo, useEffect, useRef } from 'react';
import AnalysisCard from './AnalysisCard';
import { FingerPrintIcon, LoadingSpinner, SparklesIcon, WarningIcon, ChartBarIcon, MapIcon, ShareIcon, BeakerIcon, ClipboardDocumentIcon, TableCellsIcon, ChevronDownIcon, ScaleIcon, PlusIcon, TrashIcon, UserGroupIcon, FilePdfIcon, CpuChipIcon, DatabaseIcon, ArrowsUpDownIcon, MegaphoneIcon } from './Icons';
import { generateCandidateProfile, generateCandidateComparison } from '../services/geminiService';
import { generateStrategicReportPDF } from '../services/reportGenerator';
import { CandidateProfileResult, ElectoralDataset, PartyData, ProcessedElectionData, CandidateComparisonResult, ComparisonScenario, HistoricalDataset, CandidateAnalysis } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import MemorySystem from './MemorySystem';

interface CandidateIntelligenceProps {
    datasets: ElectoralDataset[];
    activeDataset: HistoricalDataset | null;
    onProjectAndSimulate: (projectedParties: PartyData[]) => void;
}

// Helper types for the breakdown view
interface LocationNode {
    name: string;
    type: 'municipio' | 'zona' | 'puesto';
    votes: number;
    children?: LocationNode[];
}

const CollapsibleNode: React.FC<{ node: LocationNode; level: number; totalVotes: number }> = ({ node, level, totalVotes }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = node.children && node.children.length > 0;
    const percentage = totalVotes > 0 ? (node.votes / totalVotes) * 100 : 0;

    const colors = ['bg-blue-50 border-blue-200', 'bg-gray-50 border-gray-200', 'bg-white border-gray-100'];
    const indent = level * 20;

    return (
        <div className="mb-2" style={{ marginLeft: `${indent}px` }}>
            <div 
                className={`flex items-center justify-between p-3 rounded-md border cursor-pointer hover:bg-opacity-80 transition-colors ${colors[Math.min(level, 2)]}`}
                onClick={() => hasChildren && setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    {hasChildren && <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
                    <span className="text-sm font-bold text-gray-700">{node.name}</span>
                    <span className="text-[10px] uppercase text-gray-400 bg-gray-100 px-1 rounded">{node.type}</span>
                </div>
                <div className="text-right">
                    <span className="text-sm font-bold text-brand-primary">{node.votes.toLocaleString('es-CO')}</span>
                    <span className="text-xs text-gray-500 ml-2">({percentage.toFixed(1)}%)</span>
                </div>
            </div>
            {isOpen && hasChildren && (
                <div className="mt-2 border-l-2 border-gray-200 ml-3">
                    {node.children!.map((child, idx) => (
                        <CollapsibleNode key={idx} node={child} level={level + 1} totalVotes={totalVotes} />
                    ))}
                </div>
            )}
        </div>
    );
};

const CandidateIntelligence: React.FC<CandidateIntelligenceProps> = ({ datasets, activeDataset, onProjectAndSimulate }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'trace' | 'comparison'>('profile');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
    const [profileResult, setProfileResult] = useState<CandidateProfileResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Trace State
    const [traceData, setTraceData] = useState<LocationNode[]>([]);
    
    // Comparison State
    const [opponentName, setOpponentName] = useState('');
    const [comparisonResult, setComparisonResult] = useState<CandidateComparisonResult | null>(null);

    const reportRef = useRef<HTMLDivElement>(null);

    // Search logic (local dataset)
    const filteredCandidates = useMemo(() => {
        if (!activeDataset || !searchTerm || searchTerm.length < 3) return [];
        const candidates = new Set<string>();
        activeDataset.processedData.forEach(row => {
            if (row.Candidato && row.Candidato.toLowerCase().includes(searchTerm.toLowerCase()) && row.Candidato !== 'SOLO POR LA LISTA') {
                candidates.add(row.Candidato);
            }
        });
        return Array.from(candidates).slice(0, 10);
    }, [activeDataset, searchTerm]);

    const handleSelectCandidate = (name: string) => {
        setSelectedCandidate(name);
        setSearchTerm('');
        setProfileResult(null);
        setTraceData([]);
        setComparisonResult(null);
    };

    const handleGenerateProfile = async () => {
        if (!selectedCandidate || !activeDataset) return;
        setIsLoading(true);
        setError(null);
        try {
            // Calculate basic stats for context
            const candidateRows = activeDataset.processedData.filter(r => r.Candidato === selectedCandidate);
            const totalVotes = candidateRows.reduce((sum, r) => sum + r.Votos, 0);
            const party = candidateRows[0]?.UnidadPolitica || 'Desconocido';
            
            const context = `Candidato: ${selectedCandidate}, Partido: ${party}, Votos en dataset activo: ${totalVotes}. Año: ${activeDataset.name}`;
            const history = [{ election: activeDataset.name, votes: totalVotes, party }]; 

            const result = await generateCandidateProfile(selectedCandidate, context, history);
            setProfileResult(result);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateTrace = () => {
        if (!selectedCandidate || !activeDataset) return;
        
        const candidateRows = activeDataset.processedData.filter(r => r.Candidato === selectedCandidate);
        
        // Build hierarchy: Municipio -> Zona -> Puesto
        const hierarchy: Record<string, Record<string, Record<string, number>>> = {};

        candidateRows.forEach(row => {
            const muni = row.Municipio || 'DESCONOCIDO';
            const zona = row.Zona || 'GENERAL';
            const puesto = row.Puesto || 'GENERAL';
            
            if (!hierarchy[muni]) hierarchy[muni] = {};
            if (!hierarchy[muni][zona]) hierarchy[muni][zona] = {};
            if (!hierarchy[muni][zona][puesto]) hierarchy[muni][zona][puesto] = 0;
            
            hierarchy[muni][zona][puesto] += row.Votos;
        });

        const nodes: LocationNode[] = Object.entries(hierarchy).map(([muniName, zones]) => {
            const muniVotes = Object.values(zones).reduce((mSum, z) => 
                mSum + Object.values(z).reduce((zSum, p) => zSum + p, 0), 0);
            
            const zoneNodes: LocationNode[] = Object.entries(zones).map(([zonaName, puestos]) => {
                const zonaVotes = Object.values(puestos).reduce((sum, v) => sum + v, 0);
                
                const puestoNodes: LocationNode[] = Object.entries(puestos).map(([puestoName, votos]) => ({
                    name: puestoName,
                    type: 'puesto' as const,
                    votes: votos
                })).sort((a,b) => b.votes - a.votes);

                return {
                    name: zonaName,
                    type: 'zona' as const,
                    votes: zonaVotes,
                    children: puestoNodes
                };
            }).sort((a,b) => b.votes - a.votes);

            return {
                name: muniName,
                type: 'municipio' as const,
                votes: muniVotes,
                children: zoneNodes
            };
        }).sort((a,b) => b.votes - a.votes);

        setTraceData(nodes);
    };

    const handleCompare = async () => {
        if (!selectedCandidate || !opponentName) return;
        setIsLoading(true);
        setError(null);
        try {
            const context = activeDataset ? `Contexto Electoral: ${activeDataset.name}` : 'Contexto General Colombia';
            const result = await generateCandidateComparison([selectedCandidate, opponentName], context);
            setComparisonResult(result);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSimulateInDHondt = () => {
        if (profileResult && selectedCandidate && activeDataset) {
            // Logic to create a new PartyData object for the candidate as an independent list
            // Or add to existing party. For now, let's treat as independent list simulation.
            const projectedVotes = profileResult.simulationParameters.suggestedVoteBase;
            const newParty: PartyData = {
                id: Date.now(),
                name: selectedCandidate,
                votes: projectedVotes,
                color: '#10b981' // Green for new/projected
            };
            
            // We pass this to the parent to handle the redirection/state update in DHondt tab
            // For this to work, we need to mix it with current dataset parties
            const currentParties = activeDataset.partyData;
            onProjectAndSimulate([...currentParties, newParty]);
        }
    };

    const handleExportPdf = () => {
        if (reportRef.current) {
            generateStrategicReportPDF(reportRef.current, `Perfil_${selectedCandidate}.pdf`);
        }
    };

    const handleLoadMemory = (data: any) => {
        if (data) {
            setSelectedCandidate(data.selectedCandidate);
            setProfileResult(data.profileResult);
            setTraceData(data.traceData);
            setComparisonResult(data.comparisonResult);
            setOpponentName(data.opponentName || '');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                    <FingerPrintIcon className="w-8 h-8 text-brand-primary" />
                    Inteligencia de Candidato (Perfil 360°)
                </h2>
                <MemorySystem 
                    type="candidate_profile" 
                    dataToSave={{ 
                        selectedCandidate, 
                        profileResult, 
                        traceData, 
                        comparisonResult, 
                        opponentName
                    }} 
                    onLoad={handleLoadMemory} 
                    canSave={!!selectedCandidate} 
                />
            </div>

            <AnalysisCard 
                title="Buscador de Candidatos" 
                explanation="Busca un candidato en el conjunto de datos activo para iniciar el análisis profundo."
                fullscreenable={false}
                collapsible={false}
            >
                <div className="p-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Escribe el nombre del candidato..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-4 pl-12 bg-gray-50 border border-gray-300 rounded-lg shadow-inner focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-lg"
                        />
                        <div className="absolute left-4 top-4 text-gray-400">
                            <FingerPrintIcon className="w-6 h-6" />
                        </div>
                        {filteredCandidates.length > 0 && (
                            <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-b-lg shadow-xl z-20 mt-1 max-h-60 overflow-y-auto">
                                {filteredCandidates.map((c, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSelectCandidate(c)}
                                        className="w-full text-left p-3 hover:bg-brand-primary/5 border-b border-gray-100 last:border-0 transition-colors font-medium text-gray-700"
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </AnalysisCard>

            {selectedCandidate && (
                <div className="space-y-6" ref={reportRef}>
                    <div className="bg-white dark:bg-[#15100d] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-lg">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 dark:border-white/5 pb-4 mb-6">
                            <div>
                                <h3 className="text-3xl font-bold text-brand-primary dark:text-white">{selectedCandidate}</h3>
                                <p className="text-sm text-gray-500 uppercase tracking-widest mt-1">Candidato Objetivo</p>
                            </div>
                            <div className="flex gap-2 mt-4 md:mt-0">
                                <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'profile' ? 'bg-brand-primary text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Perfil Estratégico</button>
                                <button onClick={() => { setActiveTab('trace'); handleGenerateTrace(); }} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'trace' ? 'bg-brand-primary text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Rastro Electoral</button>
                                <button onClick={() => setActiveTab('comparison')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'comparison' ? 'bg-brand-primary text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Comparar (Versus)</button>
                            </div>
                        </div>

                        {activeTab === 'profile' && (
                            <div className="animate-fade-in">
                                {!profileResult ? (
                                    <div className="text-center py-10">
                                        <p className="text-gray-500 mb-4">Genera un perfil detallado usando IA y datos de la web.</p>
                                        <button onClick={handleGenerateProfile} disabled={isLoading} className="bg-brand-secondary text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 mx-auto disabled:opacity-50">
                                            {isLoading ? <LoadingSpinner className="w-5 h-5"/> : <SparklesIcon className="w-5 h-5"/>}
                                            Generar Perfil con IA
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex justify-end">
                                            <button onClick={handleExportPdf} className="text-xs flex items-center gap-1 text-red-600 font-bold border border-red-200 px-3 py-1 rounded hover:bg-red-50">
                                                <FilePdfIcon className="w-4 h-4" /> PDF
                                            </button>
                                        </div>
                                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                            <h4 className="font-bold text-brand-primary mb-2 flex items-center gap-2"><CpuChipIcon className="w-4 h-4"/> Resumen Ejecutivo</h4>
                                            <p className="text-sm text-gray-700 leading-relaxed">{profileResult.overview}</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                                <h4 className="font-bold text-gray-800 mb-2">Análisis de Opinión</h4>
                                                <p className="text-sm text-gray-600 leading-relaxed">{profileResult.opinionAnalysis}</p>
                                            </div>
                                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                                <h4 className="font-bold text-gray-800 mb-2">Trayectoria y Gestión</h4>
                                                <p className="text-sm text-gray-600 leading-relaxed">{profileResult.managementAnalysis}</p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-lg shadow-md">
                                            <h4 className="font-bold text-yellow-400 mb-4 flex items-center gap-2"><BeakerIcon className="w-4 h-4"/> Parámetros de Simulación Sugeridos</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                                <div>
                                                    <p className="text-xs text-gray-400 uppercase">Base</p>
                                                    <p className="text-xl font-bold font-mono">{profileResult.simulationParameters.suggestedVoteBase}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 uppercase">Techo</p>
                                                    <p className="text-xl font-bold font-mono">{profileResult.simulationParameters.suggestedVoteCeiling}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 uppercase">Volatilidad</p>
                                                    <p className="text-xl font-bold">{profileResult.simulationParameters.volatility}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 uppercase">Tendencia</p>
                                                    <p className="text-xl font-bold">{profileResult.simulationParameters.growthTrend}</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-gray-700 text-center">
                                                <button 
                                                    onClick={handleSimulateInDHondt}
                                                    className="text-xs font-bold bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-400 transition-colors"
                                                >
                                                    Usar estos datos en Simulador D'Hondt
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'trace' && (
                            <div className="animate-fade-in">
                                {traceData.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">No hay datos de rastro disponibles o no se ha generado aún.</div>
                                ) : (
                                    <div>
                                        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                                            <MapIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
                                            <div>
                                                <h4 className="font-bold text-yellow-800 text-sm">Auditoría Territorial</h4>
                                                <p className="text-xs text-yellow-700">Desglose jerárquico de votos: Municipio &gt; Zona &gt; Puesto. Identifica bastiones y debilidades.</p>
                                            </div>
                                        </div>
                                        <div className="border border-gray-200 rounded-lg bg-gray-50 p-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                                            {traceData.map((node, i) => (
                                                <CollapsibleNode key={i} node={node} level={0} totalVotes={traceData.reduce((acc, n) => acc + n.votes, 0)} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'comparison' && (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Oponente</label>
                                        <input 
                                            type="text" 
                                            value={opponentName} 
                                            onChange={(e) => setOpponentName(e.target.value)}
                                            placeholder="Ej: Candidato Rival"
                                            className="w-full p-2 border border-gray-300 rounded focus:ring-brand-primary"
                                        />
                                    </div>
                                    <button 
                                        onClick={handleCompare} 
                                        disabled={isLoading || !opponentName}
                                        className="bg-brand-primary text-white font-bold py-2 px-6 rounded hover:bg-brand-secondary transition-colors disabled:opacity-50"
                                    >
                                        {isLoading ? <LoadingSpinner className="w-5 h-5"/> : 'Ejecutar Versus'}
                                    </button>
                                </div>

                                {comparisonResult && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {comparisonResult.candidates.map((cand, idx) => (
                                            <div key={idx} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md">
                                                <div className="bg-gray-100 p-4 border-b border-gray-200 flex justify-between items-center">
                                                    <h4 className="font-bold text-gray-800">{cand.name}</h4>
                                                    <span className={`text-xl font-black font-mono ${cand.probabilityScore > 50 ? 'text-green-600' : 'text-red-500'}`}>
                                                        {cand.probabilityScore}%
                                                    </span>
                                                </div>
                                                <div className="p-4 space-y-4">
                                                    <div className="text-xs space-y-2">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-500">Estructura</span>
                                                            <div className="w-24 bg-gray-200 rounded-full h-2 mt-1"><div className="bg-blue-500 h-2 rounded-full" style={{width: `${cand.scoring.structureScore}%`}}></div></div>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-500">Opinión</span>
                                                            <div className="w-24 bg-gray-200 rounded-full h-2 mt-1"><div className="bg-green-500 h-2 rounded-full" style={{width: `${cand.scoring.trajectoryScore}%`}}></div></div>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-500">Riesgo</span>
                                                            <div className="w-24 bg-gray-200 rounded-full h-2 mt-1"><div className="bg-red-500 h-2 rounded-full" style={{width: `${cand.scoring.scandalPenalty}%`}}></div></div>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-gray-600 italic bg-gray-50 p-2 rounded border border-gray-100">
                                                        "{cand.trajectory.substring(0, 150)}..."
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="md:col-span-2 bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4 rounded-xl shadow-lg text-center">
                                            <h4 className="font-bold text-yellow-400 uppercase tracking-widest text-sm mb-2">Veredicto de la Simulación</h4>
                                            <p className="text-sm leading-relaxed">{comparisonResult.listVerdict}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CandidateIntelligence;
