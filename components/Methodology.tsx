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
