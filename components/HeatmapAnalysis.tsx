import React, { useState, useEffect } from 'react';
import { InformationCircleIcon, WarningIcon } from './Icons';
import AnalysisCard from './AnalysisCard';
import { colombiaPaths } from './ColombiaMapPaths';

// Mock data for demonstration
const mockPerformanceData: Record<string, number> = {
    'Antioquia': 0.85, 'Bogotá D.C.': 0.78, 'Valle del Cauca': 0.65,
    'Cundinamarca': 0.62, 'Atlántico': 0.55, 'Santander': 0.51,
    'Bolívar': 0.48, 'Boyacá': 0.45, 'Nariño': 0.33, 'Tolima': 0.41,
    'Córdoba': 0.39, 'Magdalena': 0.38, 'Cauca': 0.25, 'Norte de Santander': 0.49,
    'Huila': 0.36, 'Meta': 0.42, 'Cesar': 0.37, 'Caldas': 0.50, 'Risaralda': 0.52,
    'Quindío': 0.47, 'Sucre': 0.35, 'La Guajira': 0.30, 'Chocó': 0.20,
    'Arauca': 0.28, 'Casanare': 0.32, 'Putumayo': 0.22, 'Caquetá': 0.24,
    'Guaviare': 0.18, 'Vaupés': 0.15, 'Guainía': 0.16, 'Amazonas': 0.19,
    'San Andrés y Providencia': 0.40, 'Vichada': 0.12
};

const getColorFromPerformance = (performance: number) => {
    // Arrakis theme: from dark sand to spice orange
    const clampedPerformance = Math.max(0, Math.min(1, performance));
    const startColor = { r: 42, g: 34, b: 27 }; // Corresponds to dark-card #2a221b
    const endColor = { r: 217, g: 119, b: 6 }; // Corresponds to brand-primary #d97706

    const r = startColor.r + (endColor.r - startColor.r) * clampedPerformance;
    const g = startColor.g + (endColor.g - startColor.g) * clampedPerformance;
    const b = startColor.b + (endColor.b - startColor.b) * clampedPerformance;
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
};


const HeatmapAnalysis: React.FC = () => {
    const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [hoveredDept, setHoveredDept] = useState<string | null>(null);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation(position.coords);
                setError(null);
            },
            (err: GeolocationPositionError) => {
                setError(err.message);
                setLocation(null);
            }
        );
    }, []);

    const Legend = () => (
        <div className="flex items-center gap-2">
            <span className="text-sm text-dark-text-secondary">Bajo</span>
            <div className="w-32 h-4 rounded-full" style={{ background: 'linear-gradient(to right, #2a221b, #d97706)' }}></div>
            <span className="text-sm text-dark-text-secondary">Alto</span>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* FIX: Renamed prop 'expandable' to 'fullscreenable' to match AnalysisCardProps definition. */}
            <AnalysisCard title="Mapa de Calor de Rendimiento Electoral" explanation="Visualiza el rendimiento electoral geográficamente. Un mayor rendimiento se muestra en cian más brillante, mientras que un menor rendimiento se muestra en un tono más oscuro." fullscreenable={false}>
                 <div className="p-4 bg-yellow-900/50 border border-yellow-500 text-yellow-300 rounded-lg shadow-lg flex items-start gap-3">
                    <InformationCircleIcon className="w-8 h-8 flex-shrink-0 mt-1"/>
                    <div>
                        <h3 className="font-bold">Funcionalidad en Desarrollo</h3>
                        <p className="text-sm">
                            Esta es una demostración conceptual. Para un mapa de calor preciso, es necesario cargar datos electorales que incluyan información regional (departamento o municipio). El mapa actual utiliza datos de ejemplo para ilustrar el potencial de la herramienta.
                        </p>
                    </div>
                </div>
            </AnalysisCard>
            
            <AnalysisCard title="Rendimiento por Departamento (Ejemplo)" explanation="Pasa el cursor sobre un departamento para ver su rendimiento electoral simulado.">
                 <div className="flex justify-end mb-4">
                    <Legend />
                </div>
                 <div className="relative aspect-[4/3] w-full max-w-2xl mx-auto">
                    <svg viewBox="0 0 1000 1000" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                        <g transform="scale(1.2) translate(-100, -50)">
                            {Object.entries(colombiaPaths).map(([name, path]) => (
                                <path
                                    key={name}
                                    d={path}
                                    fill={getColorFromPerformance(mockPerformanceData[name] || 0)}
                                    stroke="#1c1611"
                                    strokeWidth="2"
                                    className="transition-all duration-200 cursor-pointer"
                                    style={{
                                      opacity: hoveredDept && hoveredDept !== name ? 0.4 : 1,
                                      transform: hoveredDept === name ? 'scale(1.02)' : 'scale(1)',
                                      transformOrigin: 'center center'
                                    }}
                                    onMouseEnter={() => setHoveredDept(name)}
                                    onMouseLeave={() => setHoveredDept(null)}
                                />
                            ))}
                        </g>
                    </svg>
                     {hoveredDept && (
                        <div className="absolute top-2 left-2 bg-dark-bg/80 text-white p-2 rounded-lg text-sm pointer-events-none shadow-lg border border-dark-border backdrop-blur-sm">
                            <p className="font-bold">{hoveredDept}</p>
                            <p>Rendimiento: <span style={{ color: getColorFromPerformance(mockPerformanceData[hoveredDept] || 0), fontWeight: 600 }}>{((mockPerformanceData[hoveredDept] || 0) * 100).toFixed(1)}%</span></p>
                        </div>
                    )}
                </div>
            </AnalysisCard>

            {/* FIX: Renamed prop 'expandable' to 'fullscreenable' to match AnalysisCardProps definition. */}
            <AnalysisCard title="Geolocalización del Usuario" explanation="Para análisis geográficos más precisos, la aplicación puede utilizar tu ubicación actual. Has otorgado permiso para acceder a tu ubicación." fullscreenable={false}>
                {error && (
                     <div className="flex items-center p-3 bg-red-900/50 border border-red-500 text-red-300 rounded-lg">
                        <WarningIcon className="w-5 h-5 mr-2"/>
                        <span>Error de geolocalización: {error}</span>
                    </div>
                )}
                {location && (
                    <div className="text-sm">
                        <p><span className="font-semibold">Latitud:</span> {location.latitude.toFixed(4)}</p>
                        <p><span className="font-semibold">Longitud:</span> {location.longitude.toFixed(4)}</p>
                    </div>
                )}
                 {!location && !error && <p className="text-dark-text-secondary">Obteniendo ubicación...</p>}
            </AnalysisCard>
        </div>
    );
}

export default HeatmapAnalysis;