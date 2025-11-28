import { Physics, RigidBody } from '@react-three/rapier';
import { Environment, CameraShake } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { Player } from '../components/game/Player';
import { NetworkPlayers } from '../components/game/NetworkPlayers';
import { Coin } from '../components/game/Coin';
import { GameConfig } from '../config';

export const GameScene = () => {
    return (
        <>
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

                {/* Coins */}
                <Coin position={[0, 1, -5]} />
                <Coin position={[3, 1, -3]} />
                <Coin position={[-3, 1, -3]} />
                <Coin position={[0, 1, 5]} />

                <Player />
                <NetworkPlayers />
            </Physics>

            {/* Post Processing */}
            <EffectComposer>
                <Bloom luminanceThreshold={1} intensity={1.5} />
                <Vignette eskil={false} offset={0.1} darkness={1.1} />
            </EffectComposer>

            <CameraShake
                maxYaw={0.05}
                maxPitch={0.05}
                maxRoll={0.05}
                yawFrequency={0.1}
                pitchFrequency={0.1}
                rollFrequency={0.1}
                intensity={0.5}
                decay={true}
                decayRate={0.65}
            />
        </>
    );
};
