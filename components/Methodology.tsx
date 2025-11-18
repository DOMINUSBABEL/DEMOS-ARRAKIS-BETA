
import React from 'react';
import AnalysisCard from './AnalysisCard';
import { BookOpenIcon, DatabaseIcon, ChartBarIcon, BeakerIcon, ScaleIcon, CpuChipIcon } from './Icons';

const StepCard: React.FC<{ number: string; title: string; description: string; icon: React.ReactNode }> = ({ number, title, description, icon }) => (
    <div className="relative p-6 bg-white/5 border border-white/10 rounded-xl overflow-hidden group hover:bg-white/10 transition-all duration-300">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            {icon}
        </div>
        <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-primary/20 text-brand-primary font-mono font-bold text-sm border border-brand-primary/50 shadow-[0_0_10px_rgba(217,119,6,0.3)]">
                {number}
            </div>
            <h4 className="text-lg font-bold text-light-text-primary dark:text-white font-mono uppercase tracking-wider">{title}</h4>
        </div>
        <p className="text-sm text-light-text-secondary dark:text-gray-400 leading-relaxed">
            {description}
        </p>
    </div>
);

const Methodology: React.FC = () => {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold flex items-center gap-3 text-light-text-primary dark:text-dark-text-primary">
        <BookOpenIcon className="w-8 h-8 text-brand-primary" />
        Documentación y Guía
      </h2>

      <AnalysisCard
        title="Protocolo de Operaciones (Guía de Usuario)"
        explanation="Guía paso a paso para maximizar el uso de la plataforma DEMOS ARRAKIS, desde la ingesta de datos hasta la generación de inteligencia estratégica."
        collapsible={false}
        fullscreenable={false}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-2">
            <StepCard 
                number="01" 
                title="Ingesta de Datos" 
                description="Inicie en el 'Gestor de Datos'. Puede cargar archivos (CSV, Excel, PDF, Imagen) o utilizar 'Fuentes Externas' en la barra lateral para cargar proyecciones pre-configuradas (ej. Cámara 2026)." 
                icon={<DatabaseIcon className="w-24 h-24" />}
            />
            <StepCard 
                number="02" 
                title="Diagnóstico Base" 
                description="Vaya a 'Análisis General'. Aquí visualizará el Ranking de Poder Electoral Base (PEB) actual. Utilice el 'Estratega IA' para obtener una lectura rápida de las fuerzas políticas en juego." 
                icon={<ChartBarIcon className="w-24 h-24" />}
            />
            <StepCard 
                number="03" 
                title="Simulación de Escenarios" 
                description="En 'Proyecciones', configure variables: fragmentación de votos, desgaste de gobierno y apoyo local. Ejecute el motor Monte Carlo para calcular probabilidades de curul." 
                icon={<BeakerIcon className="w-24 h-24" />}
            />
            <StepCard 
                number="04" 
                title="Asignación de Curules" 
                description="El 'Simulador D'Hondt' traduce los votos en escaños. Puede ajustar manualmente los votos para probar escenarios de 'Qué pasaría si...' en tiempo real." 
                icon={<ScaleIcon className="w-24 h-24" />}
            />
            <StepCard 
                number="05" 
                title="Inteligencia Avanzada" 
                description="Use 'Estratega IA' para generar informes completos en PDF. Explore 'Coaliciones' para ingeniería inversa de votos y 'Listas' para decidir entre lista abierta o cerrada." 
                icon={<CpuChipIcon className="w-24 h-24" />}
            />
            <StepCard 
                number="06" 
                title="Análisis Histórico" 
                description="Utilice 'Simulación Histórica' para modelar flujos de votos entre elecciones pasadas y futuras (Sankey) y entender la transferencia de electores." 
                icon={<ChartBarIcon className="w-24 h-24" />} // Reusing ChartBarIcon as placeholder for a 'History' icon concept
            />
        </div>
      </AnalysisCard>

      <div className="border-t border-white/10 my-8"></div>

      <AnalysisCard
        title="Fase 1: Metodología de Datos (Data Gathering)"
        explanation="El cimiento del modelo predictivo. La precisión depende de la granularidad de los datos históricos utilizados."
        collapsible={true}
        defaultCollapsed={true}
      >
        <div className="prose prose-invert max-w-none text-sm">
          <p>
            El pilar de cualquier modelo predictivo es la calidad y profundidad de sus datos. Esta fase se centra en construir una base de datos integral.
          </p>

          <h4 className="font-semibold text-base mt-4 text-brand-primary">1. Datos Electorales Históricos:</h4>
          <ul className="mt-2 space-y-2 list-disc pl-5">
            <li>
              <strong>Objetivo:</strong> Recopilar los resultados detallados de elecciones anteriores para la Cámara de Representantes y Asambleas Departamentales.
            </li>
            <li>
              <strong>Acciones:</strong>
              <ul className="list-circle pl-5 mt-1 space-y-1 text-gray-400">
                <li>Obtención de datos E-26 y E-24 de la Registraduría Nacional.</li>
                <li>Diferenciación entre votación preferente y no preferente.</li>
                <li>Normalización de nombres de partidos y candidatos mediante algoritmos de limpieza.</li>
              </ul>
            </li>
          </ul>
        </div>
      </AnalysisCard>

       <AnalysisCard
        title="Fases Futuras de Desarrollo"
        explanation="Roadmap tecnológico para la evolución del modelo DEMOS."
        collapsible={true}
        defaultCollapsed={true}
      >
         <div className="prose prose-invert max-w-none text-sm">
            <ul className="list-none space-y-3">
                <li className="flex items-start gap-2">
                    <span className="text-brand-primary font-mono font-bold">FASE 2:</span>
                    <span>Ingeniería de Características y Variables Exógenas (Opinión Pública, Economía).</span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="text-brand-primary font-mono font-bold">FASE 3:</span>
                    <span>Modelado Estadístico Bayesiano y Machine Learning avanzado.</span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="text-brand-primary font-mono font-bold">FASE 4:</span>
                    <span>Calibración y Validación del Modelo con Backtesting.</span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="text-brand-primary font-mono font-bold">FASE 5:</span>
                    <span>Interfaz de Simulación Geoespacial en Tiempo Real (DEMOS PALANTIR).</span>
                </li>
            </ul>
        </div>
      </AnalysisCard>
    </div>
  );
};

export default Methodology;
