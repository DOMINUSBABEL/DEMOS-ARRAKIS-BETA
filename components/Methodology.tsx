import React from 'react';
import AnalysisCard from './AnalysisCard';
import { BookOpenIcon, CodeBracketIcon } from './Icons';

const Methodology: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold flex items-center gap-3 text-light-text-primary dark:text-dark-text-primary">
        <BookOpenIcon className="w-8 h-8 text-brand-primary" />
        Metodología del Modelo Predictivo
      </h2>

      <AnalysisCard
        title="Fase 1: Recopilación y Estructuración de Datos (Data Gathering)"
        explanation="Esta fase es el cimiento de todo el modelo. La precisión de cualquier predicción depende directamente de la calidad y la granularidad de los datos históricos utilizados."
        collapsible={false}
        fullscreenable={false}
      >
        <div className="prose prose-invert max-w-none">
          <p>
            El pilar de cualquier modelo predictivo es la calidad y profundidad de sus datos. Esta fase se centra en construir una base de datos integral.
          </p>

          <h4 className="font-semibold text-lg mt-6">1. Datos Electorales Históricos:</h4>
          <ul className="mt-2 space-y-4">
            <li>
              <strong>Objetivo:</strong> Recopilar los resultados detallados de elecciones anteriores para la Cámara de Representantes y Asambleas Departamentales (enfocado en Antioquia).
            </li>
            <li>
              <strong>Acciones:</strong>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>
                  Obtener los datos de las elecciones de 2014, 2018, 2019, 2022 y 2023 de la Registraduría Nacional.
                </li>
                <li>
                  Diferenciar entre votación por partido (listas cerradas) y votación por candidato (listas abiertas).
                </li>
                <li>
                  Registrar el número de votos por logo, votos nulos y votos en blanco para cada elección.
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </AnalysisCard>

       <AnalysisCard
        title="Fase 1.B: Formato de Datos TOON (Tabular Object-Oriented Notation)"
        explanation="TOON es un formato de serialización de texto plano, inspirado en CSV, pero optimizado para la eficiencia y la auto-descripción. Fue diseñado para minimizar el uso de memoria y acelerar los tiempos de carga y procesamiento en la aplicación."
        collapsible={true}
        fullscreenable={false}
        icon={<CodeBracketIcon />}
      >
        <div className="prose prose-invert max-w-none">
            <h4 className="font-semibold text-lg">Estructura General</h4>
            <p>Un archivo TOON se compone de dos partes principales: una cabecera de una sola línea y un cuerpo de datos.</p>
            <pre className="bg-dark-bg p-4 rounded-md text-sm"><code>{`NombreDelConjunto[NumeroDeRegistros]{clave1,clave2,clave3,...}:
valor1A,valor2A,valor3A,...
valor1B,valor2B,valor3B,...`}</code></pre>
            
            <h4 className="font-semibold text-lg mt-6">Desglose de la Estructura</h4>
            <dl className="mt-2 space-y-4">
                <div>
                    <dt className="font-semibold">1. Cabecera (Header):</dt>
                    <dd className="pl-4 mt-1">La primera línea del archivo. Es auto-descriptiva y contiene tres componentes críticos:</dd>
                    <dd className="pl-8 mt-2">
                        <ul className="list-disc space-y-1">
                            <li><strong>Nombre del Conjunto:</strong> Un identificador legible para el set de datos.</li>
                            <li><strong>[NumeroDeRegistros]:</strong> Un entero entre corchetes que indica cuántas filas de datos siguen. Esto permite al parser asignar memoria de forma eficiente y validar la integridad del archivo.</li>
                            <li><strong>{`{clave1,clave2,...}`}:</strong> El esquema de datos. Una lista de nombres de columna separados por comas, encerrados en llaves. El orden de estas claves define el orden de los valores en cada fila de datos.</li>
                        </ul>
                    </dd>
                </div>
                 <div>
                    <dt className="font-semibold">2. Cuerpo de Datos (Body):</dt>
                    <dd className="pl-4 mt-1">
                        Cada línea después de la cabecera representa un registro. Los valores están separados por comas y siguen estrictamente el orden definido en el esquema de la cabecera. Si un valor contiene una coma, debe ser encerrado entre comillas dobles (`"`), similar al estándar CSV.
                    </dd>
                </div>
            </dl>

            <h4 className="font-semibold text-lg mt-6">Ejemplo Práctico</h4>
            <p>A continuación, se muestra un ejemplo real de un conjunto de datos en formato TOON:</p>
            <pre className="bg-dark-bg p-4 rounded-md text-xs"><code>
                <span className="text-yellow-400">Asamblea 2019</span><span className="text-green-400">[2]</span><span className="text-purple-400">{`{Eleccion,Año,UnidadPolitica,Candidato,Votos,EsCabezaDeLista,votos_calculados}`}</span>:
                <br />
                Asamblea,2019,PARTIDO LIBERAL,SOLO POR LA LISTA,304209,true,304209
                <br />
                Asamblea,2019,PARTIDO CONSERVADOR,SOLO POR LA LISTA,267515,true,267515
            </code></pre>
             <ul className="list-disc pl-6 mt-2 space-y-2 text-sm">
                <li><span className="text-yellow-400 font-semibold">Nombre:</span> "Asamblea 2019"</li>
                <li><span className="text-green-400 font-semibold">[Registros]:</span> El archivo contiene 2 filas de datos.</li>
                <li><span className="text-purple-400 font-semibold">{`{Schema}`}:</span> Define 7 columnas, empezando con 'Eleccion' y terminando con 'votos_calculados'.</li>
            </ul>

        </div>
      </AnalysisCard>


       <AnalysisCard
        title="Fases Futuras (En Desarrollo)"
        explanation="Las siguientes fases del modelo se implementarán progresivamente para enriquecer el análisis."
        collapsible={true}
        defaultCollapsed={true}
      >
         <div className="prose prose-invert max-w-none">
            <p>Las futuras fases incluirán:</p>
            <ul>
                <li><strong>Fase 2:</strong> Ingeniería de Características y Variables.</li>
                <li><strong>Fase 3:</strong> Modelado Estadístico y de Machine Learning.</li>
                <li><strong>Fase 4:</strong> Calibración y Validación del Modelo.</li>
                <li><strong>Fase 5:</strong> Interfaz de Simulación y Visualización (DEMOS PALANTIR).</li>
            </ul>
        </div>
      </AnalysisCard>
    </div>
  );
};

export default Methodology;