
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { SUBREGIONS, Subregion, aggregateVotesBySubregion } from '../services/geoUtils';
import { ProcessedElectionData } from '../types';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
    OrbitControls, 
    Center, 
    Html, 
    Environment, 
    ContactShadows, 
    Stars, 
    Sparkles, 
    Grid,
    PerspectiveCamera
} from '@react-three/drei';
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

// Note: THREE.ColorManagement.enabled is true by default in modern Three.js versions.
// We strictly use THREE.SRGBColorSpace in the Canvas configuration.

interface AntioquiaHeatmapProps {
    data?: ProcessedElectionData[];
    partyFilter?: string;
    mode: 'historical' | 'tactical';
    tacticalFocus?: string[];
}

// SVG Paths representing the topography of Antioquia's subregions
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
        // Wrap the raw path data in a valid SVG structure so the loader can parse it
        const svgString = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${pathStr}" /></svg>`;
        const data = loader.parse(svgString);
        
        // Flatten all shapes from all paths found
        const shapes: THREE.Shape[] = [];
        data.paths.forEach((path) => {
            const pathShapes = path.toShapes(true);
            shapes.push(...pathShapes);
        });
        return shapes;
    } catch (e) {
        console.error("Error creating 3D shapes from SVG path:", e);
        return [];
    }
};

// --- 3D COMPONENTS ---

const MapRegion = ({ 
    name, 
    path, 
    votes, 
    maxVotes, 
    isTargeted, 
    mode,
    totalVotes
}: { 
    name: Subregion; 
    path: string; 
    votes: number; 
    maxVotes: number; 
    isTargeted: boolean; 
    mode: 'historical' | 'tactical';
    totalVotes: number;
}) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);
    const shapes = useMemo(() => createShapes(path), [path]);
    
    // Intensity: 0 to 1 based on vote share relative to the winner region
    const intensity = maxVotes > 0 ? (votes / maxVotes) : 0;
    const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
    
    // Height Calculation: Minimum height of 5, max adds 40 units
    const depth = 5 + (intensity * 40);

    // Dynamic Color Calculation
    const color = useMemo(() => {
        if (hovered) return '#fbbf24'; // Gold hover
        if (mode === 'tactical') return isTargeted ? '#ef4444' : '#1f2937'; // Red target / Dark gray
        
        // Heatmap Gradient: From Earth/Land (Green) to Urban/Heat (Blue/Purple) to Hot (Red)
        const lowColor = new THREE.Color('#064e3b'); // Deep Forest Green
        const midColor = new THREE.Color('#3b82f6'); // Blue
        const highColor = new THREE.Color('#ef4444'); // Red
        
        if (intensity < 0.5) {
            return lowColor.lerp(midColor, intensity * 2);
        } else {
            return midColor.lerp(highColor, (intensity - 0.5) * 2);
        }
    }, [hovered, mode, isTargeted, intensity]);

    // Animation loop
    useFrame((state) => {
        if (!meshRef.current) return;
        // Hover float effect
        const targetZ = hovered ? 5 : 0;
        meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, 0.1);
    });

    if (shapes.length === 0) return null;

    return (
        <group>
            <mesh
                ref={meshRef}
                rotation={[Math.PI, 0, 0]} // Flip coordinate system
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

            {/* Data Beacon / Pin */}
            {(votes > 0 || isTargeted) && (
                <group position={[0, 0, -depth - 10]}> {/* Position slightly above surface */}
                     {/* Only show text on hover or if high intensity to reduce clutter */}
                    {(hovered || intensity > 0.5 || isTargeted) && (
                        <Html center distanceFactor={300} zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
                            <div className={`
                                flex flex-col items-center
                                ${hovered ? 'scale-110 z-50' : 'scale-100'} 
                                transition-transform duration-200
                            `}>
                                <div className="bg-black/80 backdrop-blur-md border border-white/20 p-2 rounded-lg shadow-2xl text-center min-w-[120px]">
                                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">{name}</p>
                                    <p className="text-sm font-mono font-bold text-white tabular-nums">
                                        {votes.toLocaleString()}
                                    </p>
                                    <div className="w-full bg-gray-800 h-1 mt-1 rounded-full overflow-hidden">
                                        <div className="h-full bg-brand-secondary" style={{ width: `${percentage}%` }}></div>
                                    </div>
                                    <p className="text-[9px] text-gray-500 mt-0.5">{percentage.toFixed(1)}% Dept.</p>
                                </div>
                                {/* Pin Line */}
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

const AtmosphericBackground = () => {
    return (
        <>
            <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <Sparkles count={200} scale={400} size={2} speed={0.4} opacity={0.5} color="#ffffff" />
            <Environment preset="city" />
        </>
    );
}

const CameraController = ({ mode }: { mode: 'historical' | 'tactical' }) => {
    const { camera } = useThree();
    
    useEffect(() => {
        // Reset camera position smoothly when mode changes
        // In a real app, use a library like 'maath' or 'gsap' for smooth camera transitions
        if (mode === 'tactical') {
            camera.position.set(0, -200, 600); // Higher, top-down view
        } else {
            camera.position.set(0, -400, 400); // Angled view
        }
        camera.lookAt(0, 0, 0);
    }, [mode, camera]);

    return null;
}

const AntioquiaHeatmap: React.FC<AntioquiaHeatmapProps> = ({ data = [], partyFilter, mode, tacticalFocus = [] }) => {
    
    const aggregatedData = useMemo(() => {
        if (mode === 'tactical') return {} as Record<Subregion, number>;
        return aggregateVotesBySubregion(data, partyFilter);
    }, [data, partyFilter, mode]);

    const maxVotes = useMemo(() => {
        const values = Object.values(aggregatedData) as number[];
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
                        <div className={`w-2 h-2 rounded-full ${mode === 'historical' ? 'bg-green-500 animate-pulse' : 'bg-red-500 animate-pulse'}`}></div>
                        <p className="text-[10px] text-brand-primary uppercase font-bold tracking-widest font-mono">
                            {mode === 'historical' ? 'SATÉLITE: INTELIGENCIA ELECTORAL' : 'SATÉLITE: OBJETIVOS TÁCTICOS'}
                        </p>
                    </div>
                    <h2 className="text-white font-bold text-sm">Departamento de Antioquia</h2>
                    <p className="text-[9px] text-gray-400 mt-1 max-w-[200px]">
                        Visualización volumétrica de datos. La altura representa densidad de votos.
                    </p>
                </div>
            </div>

            <div className="absolute bottom-4 right-4 z-10 pointer-events-none">
                <div className="bg-black/60 backdrop-blur px-3 py-2 rounded text-right border border-white/10">
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider">Controles de Vuelo</p>
                    <p className="text-[10px] text-white font-mono">
                        Orbita: Click Izquierdo<br/>
                        Pan: Click Derecho<br/>
                        Zoom: Rueda
                    </p>
                </div>
            </div>

            <Canvas 
                shadows 
                dpr={[1, 2]} 
                gl={{ outputColorSpace: THREE.SRGBColorSpace }}
                flat // Helps with tone mapping in r160+
            >
                <PerspectiveCamera makeDefault position={[0, -400, 400]} fov={45} />
                <CameraController mode={mode} />
                <color attach="background" args={['#050505']} />
                <fog attach="fog" args={['#050505', 400, 1500]} />
                
                <AtmosphericBackground />
                
                {/* Lights */}
                <ambientLight intensity={0.4} />
                <directionalLight 
                    position={[100, -100, 200]} 
                    intensity={2} 
                    castShadow 
                    shadow-mapSize={[1024, 1024]}
                    color="#ffffff"
                />
                <pointLight position={[-200, 200, 100]} intensity={1} color="#3b82f6" /> {/* Blue rim light */}

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
                                />
                            </group>
                        ))}
                    </group>
                </Center>

                {/* Tactical Grid Floor */}
                <Grid 
                    position={[0, 0, -20]} 
                    args={[2000, 2000]} 
                    cellSize={50} 
                    cellThickness={1} 
                    cellColor="#1f2937" 
                    sectionSize={200} 
                    sectionThickness={1.5} 
                    sectionColor="#374151" 
                    fadeDistance={800} 
                    infiniteGrid 
                />

                <ContactShadows 
                    position={[0, 0, -15]} 
                    opacity={0.6} 
                    scale={1000} 
                    blur={2.5} 
                    far={100} 
                    color="#000000" 
                />
                
                <OrbitControls 
                    enablePan={true} 
                    enableZoom={true} 
                    minDistance={100} 
                    maxDistance={1200}
                    maxPolarAngle={Math.PI / 2 - 0.1} // Prevent going below ground
                    autoRotate={mode === 'historical'}
                    autoRotateSpeed={0.3}
                    dampingFactor={0.05}
                />
            </Canvas>
        </div>
    );
};

export default AntioquiaHeatmap;
