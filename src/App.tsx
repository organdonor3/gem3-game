import { useGameStore } from './stores/useGameStore';
import { GameScene } from './scenes/GameScene';
import { MainMenu } from './components/ui/MainMenu';
import { HUD } from './components/ui/HUD';
import { useKeyboardControls } from './hooks/useKeyboardControls';

function App() {
  const isPlaying = useGameStore((state) => state.isPlaying);

  // Initialize keyboard listeners
  useKeyboardControls();

  return (
    <>
      {isPlaying ? <HUD /> : <MainMenu />}
      <GameScene />
    </>
  )
}

export default App;
