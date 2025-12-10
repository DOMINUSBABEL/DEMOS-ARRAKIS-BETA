
import React, { useState, useCallback, useEffect, useRef } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import { ManualRow } from './components/ManualEntryForm';
import { ElectoralDataset, PartyAnalysisData, PartyHistoryPoint, ProcessedDataPayload, HistoricalDataset, User } from './types';
import { processData, aggregateVotesByParty, buildHistoricalDataset } from './services/electoralProcessor';
import { classifyPartiesIdeology } from './services/geminiService';
import { parseFiles } from './services/localFileParser';
import { LoadingSpinner, WarningIcon, CheckCircleIcon } from './components/Icons';
import Papa from 'papaparse';
import { defaultDatasets } from './services/defaultDatasets';

type Tab = 'data_manager' | 'general' | 'd_hondt' | 'projections' | 'historical' | 'coalitions' | 'list_analysis' | 'strategist' | 'methodology' | 'heatmap' | 'marketing' | 'candidate_intelligence' | 'comparative_analysis';
type DataSource = 'local' | 'remote';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [datasets, setDatasets] = useState<ElectoralDataset[]>([]);
  const [partyAnalysis, setPartyAnalysis] = useState<Map<string, PartyAnalysisData>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // Forced Light Theme
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeTab, setActiveTab] = useState<Tab>('data_manager');
  const defaultsLoaded = useRef(false);

  const [dataSource, setDataSource] = useState<DataSource>('local');
  const [remoteDataset, setRemoteDataset] = useState<HistoricalDataset | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Check for auth on mount
  useEffect(() => {
    // Enforce light mode on mount
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');

    const storedUser = localStorage.getItem('demos_current_user');
    if (storedUser) {
        try {
            setUser(JSON.parse(storedUser));
        } catch (e) {
            localStorage.removeItem('demos_current_user');
        }
    }
  }, []);

  const handleLogin = (user: User) => {
      setUser(user);
  };

  const handleLogout = () => {
      localStorage.removeItem('demos_current_user');
      setUser(null);
      // Reset sensitive state if needed
      setActiveTab('data_manager');
  };

  const toggleTheme = () => {
    // Disable toggling, enforce corporate identity
    setTheme('light'); 
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
      
      const datasetId = new Date().toISOString() + datasetName;

      const newDataset: ElectoralDataset = {
        id: datasetId,
        name: datasetName,
        processedData: allProcessedData,
        invalidVoteCounts: totalInvalidVotes,
        analysisType: finalAnalysisType
      };
      
      setDataSource('local');
      setRemoteDataset(null);

      setDatasets(prev => {
          let updatedDatasets = isMerge ? prev.filter(d => !idsToMerge.includes(d.id)) : prev;
          return [...updatedDatasets, newDataset];
      });

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

    } catch(e: unknown) {
        if (e instanceof Error) {
            setError(`Error al procesar "${datasetName}": ${e.message}`);
        } else {
            setError(`Error desconocido al procesar "${datasetName}"`);
        }
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, []);

  useEffect(() => {
    // Only load defaults if user is logged in
    if (!user) return;

    const loadDefaultData = () => {
        setIsLoading(true);
        setLoadingMessage('Cargando conjuntos de datos de ejemplo...');

        const newDatasets: ElectoralDataset[] = defaultDatasets.map((ds, i) => ({
            id: `${Date.now()}-${i}-${ds.name}`,
            name: ds.name,
            processedData: ds.processedData,
            invalidVoteCounts: ds.invalidVoteCounts,
            analysisType: ds.analysisType,
        }));
        
        setDatasets(newDatasets);

        const newPartyAnalysis = new Map<string, PartyAnalysisData>();

        newDatasets.forEach(dataset => {
            const partyDataForDataset = aggregateVotesByParty(dataset.processedData);
            
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
        setDataSource('local');
        
        setIsLoading(false);
        setLoadingMessage('');
        setSuccessMessage('Conjuntos de datos de ejemplo cargados.');
        setActiveTab('general');
        setTimeout(() => setSuccessMessage(null), 5000);
    };

    if (!defaultsLoaded.current && datasets.length === 0) {
        defaultsLoaded.current = true;
        loadDefaultData();
    }
  }, [datasets.length, user]);


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
            const newAnalysis = new Map<string, PartyAnalysisData>(prev);
            Object.entries(classified).forEach(([partyName, ideology]) => {
                const data = newAnalysis.get(partyName);
                if (data) {
                    const newData: PartyAnalysisData = {
                        name: data.name,
                        history: data.history,
                        color: data.color,
                        ideology: ideology,
                    };
                    newAnalysis.set(partyName, newData);
                }
            });
            return newAnalysis;
        });

    } catch (e: unknown) {
        if (e instanceof Error) {
            setError(`Error al clasificar ideologías: ${e.message}`);
        } else {
            setError('Error desconocido al clasificar ideologías');
        }
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, [partyAnalysis]);

  const handleDeleteDataset = useCallback((datasetId: string) => {
    setDataSource('local');
    setRemoteDataset(null);
    setDatasets(prev => prev.filter(d => d.id !== datasetId));
    setPartyAnalysis((prev) => {
      const newAnalysis = new Map<string, PartyAnalysisData>();
      prev.forEach((partyData, partyName) => {
        const newHistory = partyData.history.filter(h => h.datasetId !== datasetId);
        if (newHistory.length > 0) {
          const newData: PartyAnalysisData = {
            name: partyData.name,
            history: newHistory,
            color: partyData.color,
            ideology: partyData.ideology,
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
    setPartyAnalysis((prev) => {
        const newAnalysis = new Map<string, PartyAnalysisData>();
        prev.forEach((partyData, partyName) => {
            const newHistory = partyData.history.map((h: PartyHistoryPoint) => {
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
    const allProcessedData = datasetsToMerge.flatMap(d => d.processedData);
    const combinedCsv = Papa.unparse(allProcessedData);

    await processAndSetData([combinedCsv], newName, true, idsToMerge);
  }, [datasets, processAndSetData]);

  const loadRemoteData = useCallback(async (type: 'prediction' | 'historical', year: number, scenario?: 'A' | 'B') => {
    setIsLoading(true);
    setLoadingMessage(`Cargando ${type === 'prediction' ? 'predicción' : 'datos históricos'} de ${year}...`);
    setError(null);
    setSuccessMessage(null);

    await new Promise(resolve => setTimeout(resolve, 1500)); 
    
    try {
        let mockDataset;
        if (type === 'prediction' && year === 2026 && scenario) {
            mockDataset = defaultDatasets.find(d => d.name.includes(String(year)) && d.name.includes(`Escenario ${scenario}`));
        } else {
            mockDataset = defaultDatasets.find(d => d.name.includes(String(year)) && !d.name.includes('Escenario'));
        }

        if (!mockDataset) throw new Error(`Mock data for year ${year}${scenario ? ` (Scenario ${scenario})` : ''} not found`);

        const electoralDatasetFromMock: ElectoralDataset = {
            id: `remote-${type}-${year}${scenario ? `-${scenario}` : ''}`,
            name: mockDataset.name,
            processedData: mockDataset.processedData,
            invalidVoteCounts: mockDataset.invalidVoteCounts,
            analysisType: mockDataset.analysisType,
        };
        
        const newRemoteDataset = buildHistoricalDataset(electoralDatasetFromMock);
        
        setRemoteDataset(newRemoteDataset);
        setDataSource('remote');
        setSuccessMessage(`Datos remotos "${newRemoteDataset.name}" cargados correctamente.`);
        setActiveTab('general');

    } catch (e: unknown) {
        if (e instanceof Error) {
            setError(`Error al cargar datos remotos: ${e.message}`);
        } else {
             setError('Error desconocido al cargar datos remotos');
        }
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, []);
  
  // Conditionally render Auth screen or App
  if (!user) {
      return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className={`flex h-screen bg-light-bg text-light-text-primary font-sans transition-colors duration-300 ${theme}`}>
      {isMobileSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm transition-opacity duration-300" 
            onClick={() => setIsMobileSidebarOpen(false)}
        ></div>
      )}

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
            setActiveTab(tab);
            setIsMobileSidebarOpen(false); 
        }} 
        loadRemoteData={loadRemoteData} 
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header 
            theme={theme} 
            onThemeToggle={toggleTheme} 
            onMenuClick={() => setIsMobileSidebarOpen(true)}
            user={user}
            onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-light-bg">
          {successMessage && (
            <div className="mb-4 flex items-center p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg shadow-sm">
              <CheckCircleIcon className="w-5 h-5 mr-2 text-green-600"/>
              <span>{successMessage}</span>
            </div>
          )}
          {error && (
            <div className="mb-4 flex items-center p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg shadow-sm">
              <WarningIcon className="w-5 h-5 mr-2 text-red-600"/>
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
            dataSource={dataSource}
            setDataSource={setDataSource}
            remoteDataset={remoteDataset}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
