import { useGameStore } from './stores/useGameStore';
import { GameScene } from './scenes/GameScene';
import { MainMenu } from './components/ui/MainMenu';
import { HUD } from './components/ui/HUD';

function App() {
  const { isPlaying } = useGameStore();

  return (
    <div className="w-full h-screen bg-black overflow-hidden select-none">
      {!isPlaying && <MainMenu />}
      {isPlaying && <HUD />}
      <GameScene />
    </div>
  );
}

export default App;
