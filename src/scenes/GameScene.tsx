import { Canvas } from '@react-three/fiber';
import { Physics, RigidBody } from '@react-three/rapier';
import { Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { Player } from '../components/game/Player';
import { GameConfig } from '../config';

export const GameScene = () => {
    return (
        <Canvas shadows camera={{ position: GameConfig.cameraPosition, fov: GameConfig.cameraFov }}>
            <color attach="background" args={['#111']} />

            {/* Lighting & Environment */}
            <ambientLight intensity={0.5} />
            <directionalLight
                position={[10, 10, 5]}
                intensity={1}
                castShadow
                shadow-mapSize={[1024, 1024]}
            />
            <Environment preset="city" />

            {/* Physics World */}
            <Physics gravity={GameConfig.gravity}>
                {/* Floor */}
                <RigidBody type="fixed" friction={1}>
                    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                        <planeGeometry args={[100, 100]} />
                        <meshStandardMaterial color="#333" />
                    </mesh>
                </RigidBody>

                {/* Random Obstacles */}
                <RigidBody position={[5, 1, -5]}>
                    <mesh castShadow receiveShadow>
                        <boxGeometry args={[2, 2, 2]} />
                        <meshStandardMaterial color="orange" />
                    </mesh>
                </RigidBody>

                <RigidBody position={[-5, 1, -5]}>
                    <mesh castShadow receiveShadow>
                        <sphereGeometry args={[1]} />
                        <meshStandardMaterial color="purple" />
                    </mesh>
                </RigidBody>

                <Player />
            </Physics>

            {/* Post Processing */}
            <EffectComposer>
                <Bloom luminanceThreshold={1} intensity={1.5} />
                <Vignette eskil={false} offset={0.1} darkness={1.1} />
            </EffectComposer>
        </Canvas>
    );
};
