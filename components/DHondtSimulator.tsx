import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { PartyData, DHondtAnalysis, PartyAnalysisData, HistoricalDataset } from '../types';
import { calculateDHondt } from '../services/dHondtCalculations';
import AnalysisCard from './AnalysisCard';
import PartySettings from './PartySettings';
import DHondtResults from './DHondtResults';
import { PlusIcon, FilePdfIcon, FileExcelIcon, WarningIcon } from './Icons';
import { generateDHondtPDF } from '../services/reportGenerator';
import { exportDHondtToXLSX } from '../services/spreadsheetGenerator';

interface DHondtSimulatorProps {
  initialParties: PartyData[];
  title: string;
  readOnly?: boolean;
  partyAnalysis?: Map<string, PartyAnalysisData>;
  electionType?: string;
  onReset?: () => void;
  isOverride?: boolean;
}

const ExportMenu: React.FC<{ onPdf: () => void; onXlsx: () => void }> = ({ onPdf, onXlsx }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
                Exportar
                <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-light-card dark:bg-gray-700 rounded-md shadow-lg z-20 border border-light-border dark:border-dark-border">
                    <button onClick={() => { onPdf(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-light-text-primary dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2">
                        <FilePdfIcon className="w-5 h-5 text-red-500" />
                        Exportar a PDF
                    </button>
                    <button onClick={() => { onXlsx(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-light-text-primary dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2">
                        <FileExcelIcon className="w-5 h-5 text-green-500" />
                        Exportar a Excel
                    </button>
                </div>
            )}
        </div>
    );
};

const DHondtSimulator: React.FC<DHondtSimulatorProps> = ({ initialParties, title, readOnly = false, partyAnalysis, electionType, onReset, isOverride = false }) => {
  const [parties, setParties] = useState<PartyData[]>(initialParties);

  const getDefaultSeats = useCallback((type?: string) => {
    if (!type) return 17;
    const lowerType = type.toLowerCase();
    if (lowerType === 'asamblea' || lowerType === 'concejo') {
      return 26;
    }
    return 17;
  }, []);

  const [totalSeats, setTotalSeats] = useState<number>(getDefaultSeats(electionType));
  const [analysis, setAnalysis] = useState<DHondtAnalysis | null>(null);
  const [nextId, setNextId] = useState(initialParties.length + 1);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  const maxVotes = useMemo(() => {
    if (!initialParties || initialParties.length === 0) {
      return 3000000; // Default fallback
    }
    const totalInitialVotes = initialParties.reduce((sum, party) => sum + party.votes, 0);
    // Set max votes to 70% of the total initial votes for a more constrained simulation range.
    return totalInitialVotes > 0 ? totalInitialVotes * 0.7 : 3000000;
  }, [initialParties]);

  useEffect(() => {
    setParties(initialParties);
    setNextId((initialParties.length || 0) + 1)
  }, [initialParties]);

  useEffect(() => {
    setTotalSeats(getDefaultSeats(electionType));
  }, [electionType, getDefaultSeats]);
  
  const runCalculation = useCallback(() => {
    if (parties.length > 0) {
        const result = calculateDHondt(parties, totalSeats);
        setAnalysis(result);
    } else {
        setAnalysis(null);
    }
  }, [parties, totalSeats]);
  
  useEffect(() => {
    runCalculation();
  }, [runCalculation]);

  const handleVoteChange = (id: number, newVotes: number) => {
    if (readOnly) return;
    const cappedVotes = Math.min(newVotes, maxVotes);
    setParties(parties.map(p => (p.id === id ? { ...p, votes: cappedVotes } : p)));
  };

  const addParty = () => {
    if (readOnly) return;
    const newParty: PartyData = {
      id: nextId,
      name: `Nuevo Partido ${nextId}`,
      votes: 1000,
      color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
    };
    setParties([...parties, newParty]);
    setNextId(nextId + 1);
  };
  
  const removeParty = (id: number) => {
    if (readOnly) return;
    setParties(parties.filter(p => p.id !== id));
  };

  const handlePartyNameChange = (id: number, newName: string) => {
    if (readOnly) return;
    setParties(parties.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const handleExportPdf = () => {
    if(resultsRef.current && analysis) {
        generateDHondtPDF(resultsRef.current, `Informe_DHondt_${title}.pdf`);
    }
  };

  const handleExportXlsx = () => {
    if(analysis) {
        exportDHondtToXLSX(analysis, parties);
    }
  };

  return (
    <div className="space-y-6">
        <h2 className="text-xl font-bold text-center">{title}</h2>
        {isOverride && onReset && (
            <div className="bg-yellow-900/50 border border-yellow-500 text-yellow-300 rounded-lg p-3 text-center mb-4 flex items-center justify-center gap-4">
                <WarningIcon className="w-6 h-6"/>
                <div>
                    <p className="font-semibold">Mostrando datos de una proyección del Análisis de Listas.</p>
                    <button onClick={onReset} className="mt-1 font-semibold underline hover:text-white text-sm">
                        Volver a los datos originales
                    </button>
                </div>
            </div>
        )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
            <AnalysisCard title="Configuración de la Simulación" explanation="Ajusta el número de escaños a repartir. Este valor es fundamental para determinar el umbral efectivo y la distribución de poder." fullscreenable={false}>
                 <div>
                    <label htmlFor={`totalSeats-${title}`} className="block text-sm font-medium text-light-text-secondary dark:text-gray-300 mb-1">Total de Escaños (Curules)</label>
                    <input
                        type="number"
                        id={`totalSeats-${title}`}
                        value={totalSeats}
                        min="1"
                        onChange={(e) => !readOnly && setTotalSeats(parseInt(e.target.value, 10) || 1)}
                        readOnly={readOnly}
                        className={`w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-gray-600 rounded-md p-2 ${readOnly ? 'opacity-70' : ''}`}
                    />
                </div>
            </AnalysisCard>
            <AnalysisCard title="Ajuste de Votos por Partido" explanation="Modifica los votos de cada partido para crear escenarios. Usa el slider para ajustes rápidos o el campo numérico para valores precisos. Añade o elimina partidos para simular coaliciones o fragmentaciones." fullscreenable={false}>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {parties.map(party => (
                  <PartySettings 
                    key={party.id}
                    party={party}
                    onVoteChange={handleVoteChange}
                    onNameChange={handlePartyNameChange}
                    onRemove={removeParty}
                    readOnly={readOnly}
                    maxVotes={maxVotes}
                  />
                ))}
              </div>
              {!readOnly && (
               <button onClick={addParty} className="w-full mt-4 flex items-center justify-center gap-2 text-sm text-brand-secondary font-semibold hover:text-blue-400">
                  <PlusIcon className="w-5 h-5"/>
                  Añadir Partido
               </button>
              )}
            </AnalysisCard>
        </div>
        <div className="lg:col-span-2">
            <AnalysisCard 
              title="Resultados de la Simulación D'Hondt" 
              explanation="Visualiza la asignación de escaños. La vista por defecto agrupa partidos minoritarios (<1.5% de votos y sin escaños) en 'Otros' para mayor claridad. Expande la vista para ver el desglose completo."
              modalChildren={analysis ? (
                <div className="p-4 bg-light-card dark:bg-dark-card">
                  <DHondtResults analysis={analysis} parties={parties} partyAnalysis={partyAnalysis} isDetailed />
                </div>
               ) : <div className="text-center py-10 text-light-text-secondary dark:text-gray-400">No hay datos para calcular.</div>}
            >
              <div className="flex justify-end mb-4">
                {analysis && <ExportMenu onPdf={handleExportPdf} onXlsx={handleExportXlsx} />}
              </div>
              <div ref={resultsRef}>
                {analysis ? <DHondtResults analysis={analysis} parties={parties} partyAnalysis={partyAnalysis} /> : <div className="text-center py-10 text-light-text-secondary dark:text-gray-400">No hay datos para calcular.</div>}
              </div>
            </AnalysisCard>
        </div>
      </div>
    </div>
  );
};

export default DHondtSimulator;