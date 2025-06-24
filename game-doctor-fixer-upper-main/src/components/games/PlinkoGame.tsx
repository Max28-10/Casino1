
import { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Button } from '../ui/button';
import { ArrowLeft, Minus, Plus, RotateCcw } from 'lucide-react';
import { Card } from '../ui/card';
import { toast } from 'sonner';
import * as THREE from 'three';

interface PlinkoGameProps {
  playerStats: any;
  onUpdateStats: (update: any) => void;
  onBack: () => void;
}

// Plinko 3D Scene Component
const PlinkoScene = ({ onBallLand }: { onBallLand: (multiplier: number) => void }) => {
  const ballRef = useRef<THREE.Mesh>(null);
  const [isDropping, setIsDropping] = useState(false);

  const dropBall = () => {
    if (isDropping) return;
    setIsDropping(true);
    
    // Simulate ball physics with random bounces
    setTimeout(() => {
      const multipliers = [0.2, 0.5, 1, 1.5, 2, 3, 5, 3, 2, 1.5, 1, 0.5, 0.2];
      const randomIndex = Math.floor(Math.random() * multipliers.length);
      onBallLand(multipliers[randomIndex]);
      setIsDropping(false);
    }, 3000);
  };

  return (
    <>
      {/* Plinko Board */}
      <group position={[0, 0, 0]}>
        {/* Board Background */}
        <mesh position={[0, 0, -0.1]}>
          <planeGeometry args={[8, 12]} />
          <meshStandardMaterial color="#1a365d" />
        </mesh>
        
        {/* Pegs */}
        {Array.from({ length: 12 }, (_, row) =>
          Array.from({ length: row + 3 }, (_, col) => (
            <mesh
              key={`peg-${row}-${col}`}
              position={[
                (col - row / 2 - 1) * 0.6,
                5 - row * 0.8,
                0
              ]}
            >
              <sphereGeometry args={[0.05]} />
              <meshStandardMaterial color="#ffd700" />
            </mesh>
          ))
        )}
        
        {/* Bottom Buckets */}
        {Array.from({ length: 13 }, (_, i) => (
          <group key={`bucket-${i}`} position={[(i - 6) * 0.6, -6, 0]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.5, 0.8, 0.2]} />
              <meshStandardMaterial 
                color={i === 6 ? "#dc2626" : i === 5 || i === 7 ? "#ea580c" : "#059669"} 
              />
            </mesh>
          </group>
        ))}
        
        {/* Ball */}
        <mesh
          ref={ballRef}
          position={[0, 6, 0.1]}
          onClick={dropBall}
        >
          <sphereGeometry args={[0.1]} />
          <meshStandardMaterial color="#ff6b6b" />
        </mesh>
      </group>
      
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <spotLight position={[0, 10, 5]} intensity={1} />
      <pointLight position={[5, 5, 5]} intensity={0.5} />
    </>
  );
};

const PlinkoGame = ({ playerStats, onUpdateStats, onBack }: PlinkoGameProps) => {
  const [betAmount, setBetAmount] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastResult, setLastResult] = useState<{ multiplier: number; winAmount: number } | null>(null);
  const [gameHistory, setGameHistory] = useState<Array<{ multiplier: number; winAmount: number; betAmount: number }>>([]);

  const quickBets = [25, 50, 100, 250, 500, 1000];
  const maxBet = Math.min(5000, playerStats.chips);

  const adjustBet = (amount: number) => {
    const newBet = Math.max(1, Math.min(maxBet, betAmount + amount));
    setBetAmount(newBet);
  };

  const handleBallLand = (multiplier: number) => {
    const winAmount = Math.floor(betAmount * multiplier);
    const profit = winAmount - betAmount;
    
    setLastResult({ multiplier, winAmount });
    setGameHistory(prev => [{ multiplier, winAmount, betAmount }, ...prev.slice(0, 9)]);
    
    // Update player stats
    const newChips = playerStats.chips + profit;
    const newGamesPlayed = playerStats.gamesPlayed + 1;
    const newGamesWon = profit > 0 ? playerStats.gamesWon + 1 : playerStats.gamesWon;
    
    onUpdateStats({
      chips: newChips,
      gamesPlayed: newGamesPlayed,
      gamesWon: newGamesWon,
      experience: playerStats.experience + (profit > 0 ? 10 : 5)
    });

    if (profit > 0) {
      toast.success(`Won ${winAmount} chips! (${multiplier}x multiplier)`);
    } else {
      toast.error(`Lost ${betAmount} chips`);
    }
    
    setIsPlaying(false);
  };

  const dropBall = () => {
    if (betAmount > playerStats.chips) {
      toast.error("Insufficient chips!");
      return;
    }
    
    setIsPlaying(true);
    // Deduct bet amount immediately
    onUpdateStats({
      chips: playerStats.chips - betAmount
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-purple-900 relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-purple-500/20">
        <Button
          onClick={onBack}
          variant="ghost"
          className="text-white hover:bg-purple-500/20"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lobby
        </Button>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Plinko
        </h1>
        <div className="text-right">
          <p className="text-lg font-semibold text-white">{playerStats.chips.toLocaleString()} chips</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)]">
        {/* Game Board */}
        <div className="flex-1 relative">
          <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
            <PlinkoScene onBallLand={handleBallLand} />
            <OrbitControls enableZoom={false} enablePan={false} />
          </Canvas>
          
          {/* Drop Button Overlay */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
            <Button
              onClick={dropBall}
              disabled={isPlaying || betAmount > playerStats.chips}
              className="casino-button text-lg px-8 py-3"
            >
              {isPlaying ? 'Dropping...' : `Drop Ball (${betAmount} chips)`}
            </Button>
          </div>
        </div>

        {/* Control Panel */}
        <div className="lg:w-80 p-6 bg-slate-800/50 backdrop-blur-sm border-l border-purple-500/20">
          {/* Betting Controls */}
          <Card className="casino-card p-4 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Bet Amount</h3>
            
            <div className="flex items-center gap-2 mb-4">
              <Button
                onClick={() => adjustBet(-50)}
                variant="outline"
                size="sm"
                className="border-purple-500/50 text-purple-400"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <div className="flex-1 text-center">
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(1, Math.min(maxBet, parseInt(e.target.value) || 1)))}
                  className="w-full bg-slate-700 text-white text-center py-2 rounded border border-purple-500/30 focus:border-purple-400"
                />
              </div>
              <Button
                onClick={() => adjustBet(50)}
                variant="outline"
                size="sm"
                className="border-purple-500/50 text-purple-400"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {quickBets.map((amount) => (
                <Button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  variant={betAmount === amount ? "default" : "outline"}
                  size="sm"
                  className={betAmount === amount ? "casino-button" : "border-purple-500/50 text-purple-400"}
                >
                  {amount}
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setBetAmount(Math.floor(playerStats.chips / 2))}
                variant="outline"
                size="sm"
                className="flex-1 border-purple-500/50 text-purple-400"
              >
                1/2
              </Button>
              <Button
                onClick={() => setBetAmount(playerStats.chips)}
                variant="outline"
                size="sm"
                className="flex-1 border-purple-500/50 text-purple-400"
              >
                Max
              </Button>
            </div>
          </Card>

          {/* Last Result */}
          {lastResult && (
            <Card className="casino-card p-4 mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Last Drop</h3>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {lastResult.multiplier}x
                </div>
                <div className={`text-lg font-semibold ${lastResult.winAmount > betAmount ? 'text-green-400' : 'text-red-400'}`}>
                  {lastResult.winAmount > betAmount ? '+' : ''}{lastResult.winAmount - betAmount} chips
                </div>
              </div>
            </Card>
          )}

          {/* Game History */}
          <Card className="casino-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Recent Results</h3>
              <Button
                onClick={() => setGameHistory([])}
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {gameHistory.map((game, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-2 px-3 bg-slate-700/50 rounded"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400 font-semibold">
                      {game.multiplier}x
                    </span>
                    <span className="text-slate-400 text-sm">
                      (bet: {game.betAmount})
                    </span>
                  </div>
                  <span className={`font-semibold ${game.winAmount > game.betAmount ? 'text-green-400' : 'text-red-400'}`}>
                    {game.winAmount > game.betAmount ? '+' : ''}{game.winAmount - game.betAmount}
                  </span>
                </div>
              ))}
              {gameHistory.length === 0 && (
                <p className="text-slate-400 text-center py-4">No games played yet</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PlinkoGame;
