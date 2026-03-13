'use client';

import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Float, Environment, Line } from '@react-three/drei';
import * as THREE from 'three';
import { SceneComposition, SceneObject, SceneRelationship } from '@/types/types';

interface SceneRendererProps {
    config: SceneComposition;
    wireframe: boolean;
    autoRotate: boolean;
    explodedView?: boolean;
    isolated: string | null;
    onIsolate: (name: string | null) => void;
}

const COLORS = ['#6366f1', '#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#f87171'];

function SceneNode({
    object,
    color,
    wireframe,
    explodedView,
    isolated,
    onIsolate,
}: {
    object: SceneObject;
    color: string;
    wireframe: boolean;
    explodedView: boolean;
    isolated: string | null;
    onIsolate: (name: string | null) => void;
}) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    // Apply exploded view multiplier
    const rawPos = new THREE.Vector3(...object.position);
    const renderPos = explodedView ? rawPos.multiplyScalar(2.0) : rawPos;

    return (
        <mesh
            ref={meshRef}
            position={renderPos}
            onPointerEnter={(e) => {
                e.stopPropagation();
                setHovered(true);
            }}
            onPointerLeave={() => setHovered(false)}
            onClick={(e) => {
                e.stopPropagation();
                onIsolate(isolated === object.name ? null : object.name);
            }}
        >
            <sphereGeometry args={[hovered || isolated === object.name ? 0.6 : 0.5, 32, 32]} />
            <meshStandardMaterial
                color={hovered || isolated === object.name ? '#ffffff' : color}
                wireframe={wireframe}
                emissive={isolated === object.name ? '#a78bfa' : color}
                emissiveIntensity={hovered || isolated === object.name ? 0.8 : 0.2}
                metalness={0.4}
                roughness={0.5}
                transparent={isolated !== null}
                opacity={isolated === null || isolated === object.name ? 1 : 0.1}
            />
            <Html center distanceFactor={8}>
                <div
                    style={{
                        background: hovered || isolated === object.name ? 'rgba(99,102,241,0.9)' : 'rgba(10,10,15,0.8)',
                        color: '#ffffff',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontFamily: 'Inter, sans-serif',
                        whiteSpace: 'nowrap',
                        border: `1px solid ${color}`,
                        pointerEvents: 'none',
                        transition: 'all 0.2s',
                        transform: hovered || isolated === object.name ? 'scale(1.1)' : 'scale(1)',
                        opacity: isolated === null || isolated === object.name ? 1 : 0.2
                    }}
                >
                    {object.name}
                </div>
            </Html>
        </mesh>
    );
}

export default function SceneRenderer({
    config,
    wireframe,
    autoRotate,
    explodedView = false,
    isolated,
    onIsolate,
}: SceneRendererProps) {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((_, delta) => {
        if (autoRotate && groupRef.current) {
            groupRef.current.rotation.y += delta * 0.2;
        }
    });

    const relationshipsWithPoints = useMemo(() => {
        return config.relationships.map((rel) => {
            const sourceObj = config.objects.find((o) => o.name === rel.source);
            const targetObj = config.objects.find((o) => o.name === rel.target);
            if (!sourceObj || !targetObj) return null;

            const scalar = explodedView ? 2.0 : 1.0;
            const start = new THREE.Vector3(...sourceObj.position).multiplyScalar(scalar);
            const end = new THREE.Vector3(...targetObj.position).multiplyScalar(scalar);
            
            // Midpoint for relationship label
            const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

            return { rel, points: [start, end], mid };
        }).filter(Boolean) as { rel: SceneRelationship; points: [THREE.Vector3, THREE.Vector3], mid: THREE.Vector3 }[];
    }, [config, explodedView]);

    return (
        <Canvas
            className="viewer-canvas"
            camera={{ position: [10, 8, 10], fov: 45 }}
            style={{ width: '100%', height: '100%', background: 'radial-gradient(circle at center, #1e1e2f 0%, #0a0a0f 100%)' }}
        >
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 20, 10]} intensity={1} />
            <pointLight position={[-10, 10, -10]} intensity={0.5} color="#818cf8" />
            
            <Environment preset="city" />

            <group ref={groupRef}>
                <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
                    {config.objects.map((obj, i) => (
                        <SceneNode
                            key={i}
                            object={obj}
                            color={COLORS[i % COLORS.length]}
                            wireframe={wireframe}
                            explodedView={explodedView}
                            isolated={isolated}
                            onIsolate={onIsolate}
                        />
                    ))}

                    {relationshipsWithPoints.map((item, i) => (
                        <group key={`rel-${i}`}>
                            <Line
                                points={[item.points[0], item.points[1]]}
                                color="rgba(255, 255, 255, 0.4)"
                                lineWidth={2}
                                dashed
                                dashScale={10}
                                dashSize={0.5}
                                dashOffset={0.5}
                            />
                            <Html position={item.mid} center style={{ pointerEvents: 'none' }}>
                                <div style={{
                                    fontSize: '10px',
                                    color: 'rgba(255,255,255,0.7)',
                                    background: 'rgba(0,0,0,0.5)',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    opacity: isolated === null || isolated === item.rel.source || isolated === item.rel.target ? 1 : 0.1
                                }}>{item.rel.type}</div>
                            </Html>
                        </group>
                    ))}
                </Float>
            </group>

            <OrbitControls enableDamping dampingFactor={0.05} />
            <gridHelper args={[30, 30, '#1a1a2e', '#1a1a2e']} position={[0, -5, 0]} />
        </Canvas>
    );
}
