'use client';

import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Float, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { PrimitiveShape, PrimitiveComposition } from '@/types/types';

interface PrimitiveRendererProps {
    config: PrimitiveComposition;
    wireframe: boolean;
    simplified: boolean;
    autoRotate: boolean;
    isolated: string | null;
    onIsolate: (name: string | null) => void;
}

/** Individual primitive shape component */
function PrimitiveShapeComponent({
    shape,
    wireframe,
    simplified,
    isolated,
    onIsolate,
}: {
    shape: PrimitiveShape;
    wireframe: boolean;
    simplified: boolean;
    isolated: string | null;
    onIsolate: (name: string | null) => void;
}) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    const detail = simplified ? 8 : 32;

    const getGeometry = () => {
        switch (shape.type) {
            case 'sphere':
                return <sphereGeometry args={[0.5, detail, detail]} />;
            case 'cylinder':
                return <cylinderGeometry args={[0.5, 0.5, 1, detail]} />;
            case 'cone':
                return <coneGeometry args={[0.5, 1, detail]} />;
            case 'torus':
                return <torusGeometry args={[0.5, 0.1, detail, detail]} />;
            case 'box':
                return <boxGeometry args={[1, 1, 1]} />;
            case 'ring':
                return <ringGeometry args={[0.4, 0.5, detail]} />;
            default:
                return <sphereGeometry args={[0.5, detail, detail]} />;
        }
    };

    return (
        <mesh
            ref={meshRef}
            position={shape.position}
            rotation={shape.rotation ? new THREE.Euler(...shape.rotation) : undefined}
            scale={shape.scale ?? [1, 1, 1]}
            onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); }}
            onPointerLeave={() => setHovered(false)}
            onClick={(e) => {
                e.stopPropagation();
                if (shape.label) {
                    onIsolate(isolated === shape.label ? null : shape.label);
                }
            }}
        >
            {getGeometry()}
            <meshStandardMaterial
                color={hovered || isolated === shape.label ? '#ffffff' : shape.color}
                wireframe={wireframe}
                emissive={isolated === shape.label ? '#a78bfa' : (hovered ? '#6366f1' : '#000000')}
                emissiveIntensity={hovered || isolated === shape.label ? 0.4 : 0}
                metalness={0.2}
                roughness={0.7}
                transparent={isolated !== null}
                opacity={isolated === null || isolated === shape.label ? 1 : 0.1}
            />
            {(hovered || isolated === shape.label) && shape.label && (
                <Html center distanceFactor={6}>
                    <div
                        style={{
                            background: 'rgba(10,10,15,0.9)',
                            color: '#f0f0f5',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontFamily: 'Inter, sans-serif',
                            whiteSpace: 'nowrap',
                            border: '1px solid rgba(99,102,241,0.4)',
                            pointerEvents: 'none',
                        }}
                    >
                        {shape.label}
                    </div>
                </Html>
            )}
        </mesh>
    );
}

/** Auto-rotating group */
function RotatingGroup({
    autoRotate,
    children,
}: {
    autoRotate: boolean;
    children: React.ReactNode;
}) {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((_, delta) => {
        if (autoRotate && groupRef.current) {
            groupRef.current.rotation.y += delta * 0.3;
        }
    });

    return <group ref={groupRef}>{children}</group>;
}

export default function PrimitiveRenderer({
    config,
    wireframe,
    simplified,
    autoRotate,
    isolated,
    onIsolate,
}: PrimitiveRendererProps) {
    return (
        <Canvas
            className="viewer-canvas"
            camera={{ position: [5, 4, 5], fov: 50 }}
            style={{ width: '100%', height: '100%' }}
        >
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 10, 5]} intensity={0.8} />
            <pointLight position={[-5, 5, -5]} intensity={0.4} color="#818cf8" />
            <Environment preset="studio" />

            <RotatingGroup autoRotate={autoRotate}>
                <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
                    {config.shapes.map((shape, i) => (
                        <PrimitiveShapeComponent
                            key={i}
                            shape={shape}
                            wireframe={wireframe}
                            simplified={simplified}
                            isolated={isolated}
                            onIsolate={onIsolate}
                        />
                    ))}
                </Float>
            </RotatingGroup>

            <OrbitControls enableDamping dampingFactor={0.05} />
            <gridHelper args={[20, 20, '#1a1a2e', '#1a1a2e']} />
        </Canvas>
    );
}
