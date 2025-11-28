import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { GameScene } from './scenes/GameScene'
import { HUD, MainMenu, LoadingScreen } from './components/ui'
import { ErrorBoundary, AssetLoader } from './components/system'
import { useGameStore } from './stores'
import { useKeyboardControls } from './hooks'
import { useControls } from 'leva'
import { Perf } from 'r3f-perf'

function App() {
  useKeyboardControls();
  const isPlaying = useGameStore((state) => state.isPlaying)
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  const { debug, perf } = useControls('Developer', {
    debug: { value: false, label: 'Physics Debug' },
    perf: { value: false, label: 'Show FPS' }
  })

  return (
    <ErrorBoundary>
      {!assetsLoaded && (
        <Canvas>
          <AssetLoader onLoaded={() => setAssetsLoaded(true)} />
        </Canvas>
      )}

      {assetsLoaded && (
        <>
          {!isPlaying && <MainMenu />}
          {isPlaying && <HUD />}

          <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
            {perf && <Perf position="top-left" />}
            <Suspense fallback={null}>
              <Physics debug={debug}>
                <GameScene />
              </Physics>
            </Suspense>
          </Canvas>
        </>
      )}

      <Suspense fallback={<LoadingScreen />}>
        {/* Preload assets here if needed */}
      </Suspense>
    </ErrorBoundary>
  )
}

export default App;
