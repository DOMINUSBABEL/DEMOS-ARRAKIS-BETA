

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import { ManualRow } from './components/ManualEntryForm';
import { ToonDataset, PartyAnalysisData, PartyHistoryPoint, ProcessedDataPayload } from './types';
import { processData, calculateBaseRanking, aggregateVotesByParty } from './services/electoralProcessor';
import { classifyPartiesIdeology } from './services/geminiService';
import { parseFiles } from './services/localFileParser';
import { serializeToToon, parseToon } from './services/toonParser';
import { LoadingSpinner, WarningIcon, CheckCircleIcon } from './components/Icons';
import Papa from 'papaparse';
import { defaultDatasets } from './services/defaultDatasets';

type Tab = 'data_manager' | 'general' | 'd_hondt' | 'projections' | 'historical' | 'coalitions' | 'list_analysis' | 'strategist' | 'methodology';

function App() {
  const [datasets, setDatasets] = useState<ToonDataset[]>([]);
  const [partyAnalysis, setPartyAnalysis] = useState<Map<string, PartyAnalysisData>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });
  const [activeTab, setActiveTab] = useState<Tab>('data_manager');
  const defaultsLoaded = useRef(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };
  
  const processAndSetData = useCallback(async (csvTexts: string[], datasetName: string, isMerge = false, idsToMerge: string[] = [], silent = false) => {
    setIsLoading(true);
    if (!silent) setSuccessMessage(null);
    setError(null);
    setLoadingMessage('Consolidando y procesando datos...');
    
    try {
      if (csvTexts.length === 0 || csvTexts.every(t => t.trim() === '')) {
        throw new Error("No se encontraron datos válidos en los archivos para procesar.");
      }
      
      setLoadingMessage('Analizando datos y serializando a TOON...');
      
      const payloads: ProcessedDataPayload[] = (
        await Promise.all(
          csvTexts.map(csvText => csvText.trim() ? processData(csvText) : Promise.resolve(null))
        )
      ).filter((p): p is ProcessedDataPayload => p !== null);

      if (payloads.length === 0 || payloads.every(p => p.processedData.length === 0)) {
         throw new Error("El procesamiento no arrojó datos válidos. Revisa el formato de los archivos.");
      }

      const allProcessedData = payloads.map(p => p.processedData).flat();
      const totalInvalidVotes = payloads.reduce((acc, p) => {
        acc.blankVotes += p.invalidVoteCounts.blankVotes;
        acc.nullVotes += p.invalidVoteCounts.nullVotes;
        return acc;
      }, { blankVotes: 0, nullVotes: 0 });
      
      const finalAnalysisType = payloads.some(p => p.analysisType === 'candidate') ? 'candidate' : 'party';
      
      if (allProcessedData.length === 0 && totalInvalidVotes.blankVotes === 0 && totalInvalidVotes.nullVotes === 0) {
        throw new Error("El procesamiento no arrojó ningún dato válido. Revisa el formato de los archivos.");
      }
      
      const toonData = serializeToToon(allProcessedData, datasetName);
      const datasetId = new Date().toISOString() + datasetName;

      const newDataset: ToonDataset = {
        id: datasetId,
        name: datasetName,
        toonData: toonData,
        invalidVoteCounts: totalInvalidVotes,
        analysisType: finalAnalysisType
      };

      setDatasets(prev => {
          let updatedDatasets = isMerge ? prev.filter(d => !idsToMerge.includes(d.id)) : prev;
          return [...updatedDatasets, newDataset];
      });

      // Update party analysis without re-parsing
      const partyDataForDataset = aggregateVotesByParty(allProcessedData);
      setPartyAnalysis(prev => {
        let newAnalysis: Map<string, PartyAnalysisData> = new Map(prev);

        if (isMerge) {
            newAnalysis.forEach(partyData => {
                partyData.history = partyData.history.filter(h => !idsToMerge.includes(h.datasetId));
            });
        }
        
        partyDataForDataset.forEach(party => {
          const normalizedName = party.name;
          const historyPoint: PartyHistoryPoint = {
            datasetId: newDataset.id,
            datasetName: newDataset.name,
            votes: party.votes
          };

          if (newAnalysis.has(normalizedName)) {
            const existing = newAnalysis.get(normalizedName)!;
            if (!existing.history.some(h => h.datasetId === newDataset.id)) {
              existing.history.push(historyPoint);
              existing.history.sort((a, b) => {
                const yearA = a.datasetName.match(/\d{4}/);
                const yearB = b.datasetName.match(/\d{4}/);
                if (yearA && yearB) return parseInt(yearA[0]) - parseInt(yearB[0]);
                return a.datasetName.localeCompare(b.datasetName);
              });
            }
          } else {
            newAnalysis.set(normalizedName, {
              name: normalizedName,
              history: [historyPoint],
              color: party.color
            });
          }
        });

        if (isMerge) {
            newAnalysis.forEach((partyData, partyName) => {
                if(partyData.history.length === 0) {
                    newAnalysis.delete(partyName);
                }
            });
        }
        return newAnalysis;
      });
      if (!silent) {
        setSuccessMessage(`¡Éxito! El conjunto de datos "${datasetName}" se procesó y añadió correctamente.`);
        setActiveTab('general');
      }

    } catch(e: any) {
        setError(`Error al procesar "${datasetName}": ${e.message}`);
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, []);

  useEffect(() => {
    const loadDefaultData = () => {
        setIsLoading(true);
        setLoadingMessage('Cargando conjuntos de datos de ejemplo...');

        const newDatasets: ToonDataset[] = defaultDatasets.map((ds, i) => ({
            ...ds,
            id: `${Date.now()}-${i}-${ds.name}`,
        }));
        
        setDatasets(newDatasets);

        const newPartyAnalysis = new Map<string, PartyAnalysisData>();

        newDatasets.forEach(dataset => {
            const processedData = parseToon(dataset.toonData);
            const partyDataForDataset = aggregateVotesByParty(processedData);
            
            partyDataForDataset.forEach(party => {
                const normalizedName = party.name;
                const historyPoint: PartyHistoryPoint = {
                    datasetId: dataset.id,
                    datasetName: dataset.name,
                    votes: party.votes
                };

                if (newPartyAnalysis.has(normalizedName)) {
                    newPartyAnalysis.get(normalizedName)!.history.push(historyPoint);
                } else {
                    newPartyAnalysis.set(normalizedName, {
                        name: party.name,
                        history: [historyPoint],
                        color: party.color
                    });
                }
            });
        });
        
        newPartyAnalysis.forEach(partyData => {
            partyData.history.sort((a, b) => {
              const yearA = a.datasetName.match(/\d{4}/);
              const yearB = b.datasetName.match(/\d{4}/);
              if (yearA && yearB) return parseInt(yearA[0]) - parseInt(yearB[0]);
              return a.datasetName.localeCompare(b.datasetName);
            });
        });

        setPartyAnalysis(newPartyAnalysis);
        
        setIsLoading(false);
        setLoadingMessage('');
        setSuccessMessage('Conjuntos de datos de ejemplo cargados. ¡Ya puedes comenzar a explorar!');
        setActiveTab('general');
        setTimeout(() => setSuccessMessage(null), 5000);
    };

    if (!defaultsLoaded.current && datasets.length === 0) {
        defaultsLoaded.current = true;
        loadDefaultData();
    }
  }, [datasets.length]);


  const handleFileUpload = useCallback(async (files: File[], datasetName: string) => {
    const csvResults = await parseFiles(files, (message) => {
        setIsLoading(true);
        setLoadingMessage(message);
    });
    await processAndSetData([csvResults.join('\n')], datasetName);
  }, [processAndSetData]);

  const handleManualDataSubmit = useCallback(async (rows: ManualRow[], datasetName: string) => {
    const csvText = Papa.unparse(rows.map(row => ({
        Eleccion: 'Manual',
        Año: new Date().getFullYear().toString(),
        UnidadPolitica: row.unidadPolitica,
        Candidato: row.candidato,
        Votos: row.votos,
        EsCabezaDeLista: 'FALSE',
        AlianzaHistoricaID: '',
    })));
    await processAndSetData([csvText], datasetName);
  }, [processAndSetData]);

  const handleClassifyIdeologies = useCallback(async (partyNames: string[]): Promise<void> => {
    setIsLoading(true);
    setLoadingMessage('Clasificando ideologías con IA...');
    try {
        const partiesToClassify = partyNames.filter(name => !partyAnalysis.get(name)?.ideology);
        
        if (partiesToClassify.length === 0) {
          setIsLoading(false);
          setLoadingMessage('');
          return;
        }

        const classified = await classifyPartiesIdeology(partiesToClassify);
        
        setPartyAnalysis(prev => {
            const newAnalysis = new Map(prev);
            Object.entries(classified).forEach(([partyName, ideology]) => {
                const data = newAnalysis.get(partyName);
                if (data) {
                    // Create a new object to ensure immutability
                    const newData: PartyAnalysisData = {
                        name: data.name,
                        history: data.history, // history is already an array of new objects
                        color: data.color,
                        ideology: ideology,
                    };
                    newAnalysis.set(partyName, newData);
                }
            });
            return newAnalysis;
        });

    } catch (e: any) {
        setError(`Error al clasificar ideologías: ${e.message}`);
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, [partyAnalysis]);

  const handleDeleteDataset = useCallback((datasetId: string) => {
    setDatasets(prev => prev.filter(d => d.id !== datasetId));
    setPartyAnalysis(prev => {
      const newAnalysis = new Map<string, PartyAnalysisData>();
      // FIX: Explicitly type `partyData` to resolve type inference issue where it becomes `unknown`.
      prev.forEach((partyData: PartyAnalysisData, partyName) => {
        const newHistory = partyData.history.filter(h => h.datasetId !== datasetId);
        if (newHistory.length > 0) {
           const newData: PartyAnalysisData = {
              name: partyData.name,
              history: newHistory,
              color: partyData.color,
              ideology: partyData.ideology
           };
           newAnalysis.set(partyName, newData);
        }
      });
      return newAnalysis;
    });
    setSuccessMessage('Conjunto de datos eliminado.');
    setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  const handleEditDatasetName = useCallback((datasetId: string, newName: string) => {
    setDatasets(prev => prev.map(d => d.id === datasetId ? { ...d, name: newName } : d));
    setPartyAnalysis(prev => {
        const newAnalysis = new Map<string, PartyAnalysisData>();
        // FIX: Explicitly type `partyData` for consistency and to prevent potential inference issues.
        prev.forEach((partyData: PartyAnalysisData, partyName) => {
            const newHistory = partyData.history.map(h => {
                if (h.datasetId === datasetId) {
                    return { ...h, datasetName: newName };
                }
                return h;
            });
             const newData: PartyAnalysisData = {
                name: partyData.name,
                history: newHistory,
                color: partyData.color,
                ideology: partyData.ideology
            };
            newAnalysis.set(partyName, newData);
        });
        return newAnalysis;
    });
  }, []);

  const handleMergeDatasets = useCallback(async (idsToMerge: string[], newName: string) => {
    const datasetsToMerge = datasets.filter(d => idsToMerge.includes(d.id));
    if (datasetsToMerge.length < 2) {
      setError("Necesitas seleccionar al menos dos conjuntos de datos para fusionar.");
      return;
    }
    const allProcessedData = datasetsToMerge.flatMap(d => parseToon(d.toonData));
    const combinedCsv = Papa.unparse(allProcessedData);

    await processAndSetData([combinedCsv], newName, true, idsToMerge);
  }, [datasets, processAndSetData]);
  

  return (
    <div className={`flex h-screen bg-light-bg dark:bg-dark-bg text-light-text-primary dark:text-dark-text-primary font-sans transition-colors duration-300 ${theme}`}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header theme={theme} onThemeToggle={toggleTheme} />
        <main className="flex-1 overflow-y-auto p-8">
          {successMessage && (
            <div className="mb-4 flex items-center p-4 bg-green-900/50 border border-green-500 text-green-300 rounded-lg">
              <CheckCircleIcon className="w-5 h-5 mr-2"/>
              <span>{successMessage}</span>
            </div>
          )}
          {error && (
            <div className="mb-4 flex items-center p-4 bg-red-900/50 border border-red-500 text-red-300 rounded-lg">
              <WarningIcon className="w-5 h-5 mr-2"/>
              <span>{error}</span>
            </div>
          )}
          <Dashboard 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            datasets={datasets} 
            partyAnalysis={partyAnalysis}
            onFileUpload={handleFileUpload} 
            onManualSubmit={handleManualDataSubmit}
            onClassifyIdeologies={handleClassifyIdeologies}
            onDeleteDataset={handleDeleteDataset}
            onEditDatasetName={handleEditDatasetName}
            onMergeDatasets={handleMergeDatasets}
            isLoading={isLoading}
            loadingMessage={loadingMessage}
          />
        </main>
      </div>
    </div>
  );
}

export default App;