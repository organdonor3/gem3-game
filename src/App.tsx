import { Suspense, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { GameScene } from './scenes/GameScene'
import { HUD, LoadingScreen } from './components/ui'
import { ErrorBoundary, AssetLoader } from './components/system'
import { useKeyboardControls } from './hooks'
import { Leva, useControls } from 'leva'
import { Perf } from 'r3f-perf'

function App() {
  useKeyboardControls();
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);

  // Toggle Dev Tools with Tilde (~)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === '~') {
        setShowDevTools(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { debug, perf } = useControls('Developer', {
    debug: { value: false, label: 'Physics Debug' },
    perf: { value: false, label: 'Show FPS' }
  })

  return (
    <ErrorBoundary>
      <Leva hidden={!showDevTools} />
      {!assetsLoaded && (
        <Canvas>
          <AssetLoader onLoaded={() => setAssetsLoaded(true)} />
        </Canvas>
      )}

      {assetsLoaded && (
        <>
          <HUD />

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
