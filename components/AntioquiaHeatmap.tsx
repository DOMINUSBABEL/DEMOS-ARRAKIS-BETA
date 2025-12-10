
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { SUBREGIONS, Subregion, aggregateVotesBySubregion } from '../services/geoUtils';
import { ProcessedElectionData } from '../types';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { 
    OrbitControls, 
    Center, 
    Html, 
    Environment, 
    ContactShadows, 
    Stars, 
    Sparkles
} from '@react-three/drei';
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

// Register the loader with R3F to ensure context awareness
extend({ SVGLoader });

// --- CONSTANTS & HELPERS ---

const REGION_PATHS: Record<Subregion, string> = {
    'Urabá': "M10,100 L120,80 L140,200 L80,250 L10,180 Z",
    'Bajo Cauca': "M180,20 L300,10 L350,80 L280,120 L180,20 Z",
    'Norte': "M140,100 L250,80 L280,180 L160,200 Z",
    'Nordeste': "M280,80 L420,60 L450,180 L300,200 Z",
    'Magdalena Medio': "M380,200 L490,180 L480,350 L350,300 Z",
    'Occidente': "M80,200 L160,180 L180,300 L100,320 Z",
    'Valle de Aburrá': "M180,220 L240,210 L250,260 L190,270 Z", 
    'Oriente': "M250,220 L350,200 L380,350 L260,380 Z",
    'Suroeste': "M100,320 L200,300 L220,450 L120,480 Z"
};

const createShapes = (pathStr: string) => {
    try {
        const loader = new SVGLoader();
        const svgString = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${pathStr}" /></svg>`;
        const data = loader.parse(svgString);
        
        const shapes: THREE.Shape[] = [];
        data.paths.forEach((path) => {
            const pathShapes = path.toShapes(true);
            shapes.push(...pathShapes);
        });
        return shapes;
    } catch (e) {
        console.error("Error creating 3D shapes:", e);
        return [];
    }
};

// --- 3D SUB-COMPONENTS ---

interface MapRegionProps {
    name: Subregion;
    path: string;
    votes: number;
    maxVotes: number;
    isTargeted: boolean;
    mode: 'historical' | 'tactical';
    totalVotes: number;
    isMock: boolean;
}

const MapRegion = ({ 
    name, 
    path, 
    votes, 
    maxVotes, 
    isTargeted, 
    mode,
    totalVotes,
    isMock
}: MapRegionProps) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);
    const shapes = useMemo(() => createShapes(path), [path]);
    
    // Safety check for division by zero
    const intensity = maxVotes > 0 ? (votes / maxVotes) : 0;
    const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
    
    // Base height + dynamic height based on votes
    const depth = 5 + (intensity * 40);

    const color = useMemo(() => {
        if (hovered) return new THREE.Color('#fbbf24'); // Gold on hover
        if (mode === 'tactical') return new THREE.Color(isTargeted ? '#ef4444' : '#1f2937');
        
        const lowColor = new THREE.Color('#064e3b'); // Green
        const midColor = new THREE.Color('#3b82f6'); // Blue
        const highColor = new THREE.Color('#ef4444'); // Red
        
        // Linear interpolation for heatmap gradient
        if (intensity < 0.5) {
            return lowColor.lerp(midColor, intensity * 2);
        } else {
            return midColor.lerp(highColor, (intensity - 0.5) * 2);
        }
    }, [hovered, mode, isTargeted, intensity]);

    useFrame(() => {
        if (!meshRef.current) return;
        // Subtle hover animation
        const targetZ = hovered ? 5 : 0;
        meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, 0.1);
    });

    if (shapes.length === 0) return null;

    return (
        <group>
            <mesh
                ref={meshRef}
                rotation={[Math.PI, 0, 0]}
                onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
                onPointerOut={() => setHovered(false)}
                castShadow
                receiveShadow
            >
                <extrudeGeometry args={[shapes, { depth, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5, bevelSegments: 2 }]} />
                <meshStandardMaterial 
                    color={color} 
                    roughness={0.3} 
                    metalness={0.8} 
                    emissive={color}
                    emissiveIntensity={hovered ? 0.5 : 0.1}
                />
            </mesh>

            {(votes > 0 || isTargeted) && (
                <group position={[0, 0, -depth - 10]}>
                    {(hovered || intensity > 0.5 || isTargeted) && (
                        <Html center distanceFactor={300} style={{ pointerEvents: 'none' }} zIndexRange={[100, 0]}>
                            <div className={`
                                flex flex-col items-center
                                ${hovered ? 'scale-110 z-50' : 'scale-100'} 
                                transition-transform duration-200
                            `}>
                                <div className="bg-black/90 backdrop-blur-md border border-white/20 p-2 rounded-lg shadow-2xl text-center min-w-[120px]">
                                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">{name}</p>
                                    <p className="text-sm font-mono font-bold text-white tabular-nums">
                                        {isMock ? '~' : ''}{votes.toLocaleString()}
                                    </p>
                                    <div className="w-full bg-gray-800 h-1 mt-1 rounded-full overflow-hidden">
                                        <div className="h-full bg-brand-secondary" style={{ width: `${percentage}%` }}></div>
                                    </div>
                                    <p className="text-[9px] text-gray-500 mt-0.5">{percentage.toFixed(1)}%</p>
                                </div>
                                <div className="w-0.5 h-8 bg-gradient-to-b from-white/50 to-transparent"></div>
                                <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white]"></div>
                            </div>
                        </Html>
                    )}
                </group>
            )}
        </group>
    );
};

const CameraController = ({ mode }: { mode: 'historical' | 'tactical' }) => {
    const { camera } = useThree();
    // Simple effect to switch view angle based on mode
    useEffect(() => {
        if (mode === 'tactical') {
            camera.position.set(0, -200, 600); // Top-down-ish
        } else {
            camera.position.set(0, -400, 400); // Isometric-ish
        }
        camera.lookAt(0, 0, 0);
    }, [mode, camera]);
    return null;
}

// --- MAIN COMPONENT ---

interface AntioquiaHeatmapProps {
    data?: ProcessedElectionData[];
    partyFilter?: string;
    mode: 'historical' | 'tactical';
    tacticalFocus?: string[];
}

const AntioquiaHeatmap: React.FC<AntioquiaHeatmapProps> = ({ data = [], partyFilter, mode, tacticalFocus = [] }) => {
    
    // Generate data or use Mock data if empty
    const { aggregatedData, isMock } = useMemo(() => {
        if (mode === 'tactical') {
            return { aggregatedData: {} as Record<Subregion, number>, isMock: false };
        }

        const realAggregation = aggregateVotesBySubregion(data, partyFilter);
        const totalRealVotes = Object.values(realAggregation).reduce((a, b) => a + b, 0);

        if (totalRealVotes === 0) {
            // MOCK DATA GENERATION
            const mock: Record<string, number> = {};
            SUBREGIONS.forEach(region => {
                // Generate semi-coherent random data
                let base = 5000;
                if (region === 'Valle de Aburrá') base = 50000;
                if (region === 'Oriente') base = 20000;
                mock[region] = Math.floor(Math.random() * base) + 2000;
            });
            return { aggregatedData: mock, isMock: true };
        }

        return { aggregatedData: realAggregation, isMock: false };
    }, [data, partyFilter, mode]);

    const maxVotes = useMemo(() => {
        const values = Object.values(aggregatedData) as number[];
        if (values.length === 0) return 1;
        return Math.max(...values, 1);
    }, [aggregatedData]);

    const totalVotes = useMemo(() => {
        const values = Object.values(aggregatedData) as number[];
        return values.reduce((acc, curr) => acc + curr, 0);
    }, [aggregatedData]);

    const isRegionTargeted = (region: Subregion) => {
        if (!tacticalFocus) return false;
        return tacticalFocus.some(focus => 
            focus.toLowerCase().includes(region.toLowerCase())
        );
    };

    return (
        <div className="w-full h-full min-h-[500px] relative bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800">
            {/* UI Overlay */}
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md px-4 py-3 rounded-lg border border-brand-primary/30 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                    <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${isMock ? 'bg-yellow-500 animate-pulse' : 'bg-green-500 animate-pulse'}`}></div>
                        <p className="text-[10px] text-brand-primary uppercase font-bold tracking-widest font-mono">
                            {isMock ? 'MODO SIMULACIÓN (DATA SINTÉTICA)' : 'SATÉLITE: EN LÍNEA'}
                        </p>
                    </div>
                    <h2 className="text-white font-bold text-sm">Antioquia: Mapa de Calor</h2>
                    <p className="text-[9px] text-gray-400 mt-1 max-w-[200px]">
                        {isMock 
                            ? "Visualizando proyección estimada. Cargue datos reales para mayor precisión." 
                            : "Visualización volumétrica basada en datos electorales cargados."}
                    </p>
                </div>
            </div>

            <div className="absolute bottom-4 right-4 z-10 pointer-events-none">
                <div className="bg-black/60 backdrop-blur px-3 py-2 rounded text-right border border-white/10">
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider">Controles</p>
                    <p className="text-[10px] text-white font-mono">
                        Rotar: Click Izquierdo<br/>
                        Mover: Click Derecho<br/>
                        Zoom: Rueda
                    </p>
                </div>
            </div>

            <Canvas 
                shadows 
                dpr={[1, 2]}
                gl={{ 
                    antialias: true,
                    outputColorSpace: THREE.SRGBColorSpace 
                }}
            >
                <CameraController mode={mode} />
                
                {/* Environment & Lighting */}
                <color attach="background" args={['#050505']} />
                <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                <Sparkles count={200} scale={400} size={2} speed={0.4} opacity={0.5} color="#ffffff" />
                <Environment preset="city" />
                
                <ambientLight intensity={0.4} />
                <spotLight position={[100, -400, 400]} angle={0.3} penumbra={1} intensity={1} castShadow />
                
                <Center>
                    <group rotation={[0, 0, 0]}>
                        {SUBREGIONS.map((region) => (
                            <group key={region}> 
                                <MapRegion 
                                    name={region}
                                    path={REGION_PATHS[region]}
                                    votes={aggregatedData[region] || 0}
                                    maxVotes={maxVotes}
                                    totalVotes={totalVotes}
                                    isTargeted={isRegionTargeted(region)}
                                    mode={mode}
                                    isMock={isMock}
                                />
                            </group>
                        ))}
                    </group>
                </Center>
                
                {/* Floor Plane to catch shadows */}
                <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -50]} receiveShadow>
                    <planeGeometry args={[2000, 2000]} /> 
                    <meshStandardMaterial color="#111827" roughness={0.8} metalness={0.2} />
                </mesh>

                <OrbitControls 
                    enablePan={true} 
                    enableZoom={true} 
                    minDistance={100} 
                    maxDistance={1200}
                    enableDamping
                    dampingFactor={0.05}
                />
            </Canvas>
        </div>
    );
};

export default AntioquiaHeatmap;
