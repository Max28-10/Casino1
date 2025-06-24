
import { useState } from 'react';
import Enhanced2DBlackjack from '../components/Enhanced2DBlackjack';

const Index = () => {
  const [playerStats, setPlayerStats] = useState({
    chips: 1000,
    gamesPlayed: 0,
    gamesWon: 0,
    experience: 0
  });

  const handleUpdateStats = (update: any) => {
    setPlayerStats(prev => ({ ...prev, ...update }));
  };

  const handleBack = () => {
    // For now, just reload the component
    window.location.reload();
  };

  return (
    <Enhanced2DBlackjack 
      playerStats={playerStats}
      onUpdateStats={handleUpdateStats}
      onBack={handleBack}
    />
  );
};

export default Index;
