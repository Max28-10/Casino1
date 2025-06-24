import { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { ArrowLeft, RotateCcw, Plus, Minus, Lightbulb, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { toast } from 'sonner';
import * as THREE from 'three';

// Extend Three.js types for React Three Fiber
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      boxGeometry: any;
      planeGeometry: any;
      ringGeometry: any;
      meshStandardMaterial: any;
      ambientLight: any;
      spotLight: any;
      pointLight: any;
    }
  }
}

interface Enhanced3DBlackjackProps {
  playerStats: any;
  onUpdateStats: (update: any) => void;
  onBack: () => void;
}

interface PlayingCard {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: string;
  numValue: number;
  id: string;
}

// 3D Card Component
function Card3D({ card, position, rotation, isHidden = false }: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useEffect(() => {
    if (meshRef.current) {
      // Animate card dealing
      meshRef.current.position.set(position[0], position[1] + 2, position[2]);
      meshRef.current.rotation.set(Math.PI, 0, 0);
    }
  }, []);

  const isRed = card?.suit === 'hearts' || card?.suit === 'diamonds';

  return (
    <group position={position} rotation={rotation}>
      <mesh ref={meshRef}>
        <boxGeometry args={[1.6, 2.4, 0.02]} />
        <meshStandardMaterial 
          color={isHidden ? "#8B0000" : "white"} 
          roughness={0.1}
          metalness={0.1}
        />
      </mesh>
      {!isHidden && card && (
        <>
          {/* Card value text using basic geometry */}
          <mesh position={[-0.6, 0.8, 0.02]}>
            <planeGeometry args={[0.3, 0.3]} />
            <meshStandardMaterial color={isRed ? "#DC2626" : "#000000"} />
          </mesh>
          {/* Suit symbol using basic geometry */}
          <mesh position={[-0.2, 0, 0.02]}>
            <planeGeometry args={[0.5, 0.5]} />
            <meshStandardMaterial color={isRed ? "#DC2626" : "#000000"} />
          </mesh>
        </>
      )}
    </group>
  );
}

// Casino Table 3D Component
function CasinoTable() {
  return (
    <group>
      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#065f46" roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.95, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3, 5, 32]} />
        <meshStandardMaterial color="#047857" roughness={0.6} />
      </mesh>
    </group>
  );
}

const Enhanced3DBlackjack = ({ playerStats, onUpdateStats, onBack }: Enhanced3DBlackjackProps) => {
  const [playerHand, setPlayerHand] = useState<PlayingCard[]>([]);
  const [dealerHand, setDealerHand] = useState<PlayingCard[]>([]);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'finished'>('betting');
  const [currentBet, setCurrentBet] = useState(25);
  const [playerScore, setPlayerScore] = useState(0);
  const [dealerScore, setDealerScore] = useState(0);
  const [gameResult, setGameResult] = useState<string>('');
  const [showStrategy, setShowStrategy] = useState(false);
  const [gameHistory, setGameHistory] = useState<{won: number, lost: number}>({won: 0, lost: 0});

  const suits = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  const createDeck = (): PlayingCard[] => {
    const deck: PlayingCard[] = [];
    suits.forEach(suit => {
      values.forEach(value => {
        let numValue = parseInt(value);
        if (value === 'A') numValue = 11;
        else if (['J', 'Q', 'K'].includes(value)) numValue = 10;
        
        deck.push({ 
          suit, 
          value, 
          numValue,
          id: `${suit}-${value}-${Math.random()}`
        });
      });
    });
    return deck.sort(() => Math.random() - 0.5);
  };

  const calculateScore = (hand: PlayingCard[]) => {
    let score = 0;
    let aces = 0;
    
    hand.forEach(card => {
      if (card.value === 'A') {
        aces++;
        score += 11;
      } else {
        score += card.numValue;
      }
    });
    
    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }
    
    return score;
  };

  const startGame = () => {
    if (currentBet > playerStats.chips) {
      toast.error('Insufficient chips!');
      return;
    }

    const deck = createDeck();
    const newPlayerHand = [deck.pop()!, deck.pop()!];
    const newDealerHand = [deck.pop()!, deck.pop()!];
    
    setPlayerHand(newPlayerHand);
    setDealerHand(newDealerHand);
    setPlayerScore(calculateScore(newPlayerHand));
    setDealerScore(calculateScore([newDealerHand[0]]));
    setGameState('playing');
    setGameResult('');
    
    onUpdateStats({ chips: playerStats.chips - currentBet });
  };

  const hit = () => {
    const deck = createDeck();
    const newCard = deck.pop()!;
    const newHand = [...playerHand, newCard];
    const newScore = calculateScore(newHand);
    
    setPlayerHand(newHand);
    setPlayerScore(newScore);
    
    if (newScore > 21) {
      endGame(false, 'Bust! Dealer wins.');
    }
  };

  const stand = () => {
    let newDealerHand = [...dealerHand];
    let newDealerScore = calculateScore(newDealerHand);
    const deck = createDeck();
    
    while (newDealerScore < 17) {
      const newCard = deck.pop()!;
      newDealerHand.push(newCard);
      newDealerScore = calculateScore(newDealerHand);
    }
    
    setDealerHand(newDealerHand);
    setDealerScore(newDealerScore);
    
    let won = false;
    let result = '';
    
    if (newDealerScore > 21) {
      result = 'Dealer busts! You win!';
      won = true;
    } else if (playerScore > newDealerScore) {
      result = 'You win!';
      won = true;
    } else if (playerScore < newDealerScore) {
      result = 'Dealer wins.';
    } else {
      result = 'Push! It\'s a tie.';
    }
    
    endGame(won, result);
  };

  const endGame = (won: boolean, result: string) => {
    const chipsWon = won ? currentBet * 2 : (result.includes('Push') ? currentBet : 0);
    
    setGameResult(result);
    setGameState('finished');
    setGameHistory(prev => ({
      won: won ? prev.won + chipsWon : prev.won,
      lost: !won && !result.includes('Push') ? prev.lost + currentBet : prev.lost
    }));
    
    onUpdateStats({ 
      chips: playerStats.chips + chipsWon,
      gamesPlayed: playerStats.gamesPlayed + 1,
      gamesWon: won ? playerStats.gamesWon + 1 : playerStats.gamesWon,
      experience: playerStats.experience + (won ? 25 : 10)
    });
    
    toast.success(result);
  };

  const quickBet = (multiplier: number) => {
    setCurrentBet(prev => Math.min(prev * multiplier, playerStats.chips, 5000));
  };

  const maxBet = () => {
    setCurrentBet(Math.min(playerStats.chips, 5000));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm">
        <Button onClick={onBack} variant="outline" className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lobby
        </Button>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-yellow-400 bg-clip-text text-transparent">
          Premium Blackjack
        </h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowStrategy(!showStrategy)}
            variant="outline"
            className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Strategy
          </Button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* 3D Game View */}
        <div className="flex-1 relative">
          <Canvas camera={{ position: [0, 5, 8], fov: 75 }}>
            <Environment preset="studio" />
            <ambientLight intensity={0.4} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
            <pointLight position={[-10, -10, -10]} />
            
            <CasinoTable />
            
            {/* Dealer Cards */}
            {dealerHand.map((card, index) => (
              <Card3D
                key={card.id}
                card={card}
                position={[-2 + index * 0.5, 0.5, -2]}
                rotation={[0, 0, 0]}
                isHidden={gameState === 'playing' && index === 1}
              />
            ))}
            
            {/* Player Cards */}
            {playerHand.map((card, index) => (
              <Card3D
                key={card.id}
                card={card}
                position={[-2 + index * 0.5, 0.5, 2]}
                rotation={[0, 0, 0]}
              />
            ))}
            
            <OrbitControls enablePan={false} enableZoom={false} enableRotate={true} />
          </Canvas>

          {/* Game Controls Overlay */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            {gameState === 'playing' && (
              <div className="flex gap-4">
                <Button onClick={hit} className="casino-button px-8 py-3 text-lg">
                  Hit
                </Button>
                <Button onClick={stand} className="casino-button px-8 py-3 text-lg">
                  Stand
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Betting & Stats */}
        <div className="w-80 bg-slate-900/80 backdrop-blur-sm p-6 space-y-6">
          {/* Chip Stats */}
          <Card className="casino-card p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Session Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Chips:</span>
                <span className="text-yellow-400 font-bold">{playerStats.chips.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Won:
                </span>
                <span className="text-emerald-400 font-semibold">+{gameHistory.won.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" />
                  Lost:
                </span>
                <span className="text-red-400 font-semibold">-{gameHistory.lost.toLocaleString()}</span>
              </div>
            </div>
          </Card>

          {/* Betting Panel */}
          <Card className="casino-card p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Betting</h3>
            
            {/* Current Bet Display */}
            <div className="text-center mb-4">
              <p className="text-slate-400 text-sm mb-1">Current Bet</p>
              <div className="text-3xl font-bold text-yellow-400 mb-3">
                ${currentBet.toLocaleString()}
              </div>
              
              {/* Bet Adjustment */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <Button 
                  onClick={() => setCurrentBet(Math.max(5, currentBet - 5))}
                  size="sm"
                  variant="outline"
                  className="border-emerald-500/50 text-emerald-400"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Button 
                  onClick={() => setCurrentBet(Math.min(playerStats.chips, currentBet + 5, 5000))}
                  size="sm"
                  variant="outline"
                  className="border-emerald-500/50 text-emerald-400"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Quick Bet Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[25, 50, 100, 250].map(amount => (
                <Button
                  key={amount}
                  onClick={() => setCurrentBet(Math.min(amount, playerStats.chips))}
                  variant="outline"
                  size="sm"
                  className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                >
                  ${amount}
                </Button>
              ))}
            </div>

            {/* Advanced Betting */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <Button
                onClick={() => quickBet(2)}
                variant="outline"
                size="sm"
                className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 text-xs"
              >
                2x
              </Button>
              <Button
                onClick={() => quickBet(0.5)}
                variant="outline"
                size="sm"
                className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 text-xs"
              >
                1/2
              </Button>
              <Button
                onClick={maxBet}
                variant="outline"
                size="sm"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10 text-xs"
              >
                MAX
              </Button>
            </div>

            {/* Action Buttons */}
            {gameState === 'betting' && (
              <Button onClick={startGame} className="w-full casino-button mb-2">
                Deal Cards
              </Button>
            )}

            {gameState === 'finished' && (
              <Button onClick={() => setGameState('betting')} className="w-full casino-button mb-2">
                <RotateCcw className="w-4 h-4 mr-2" />
                New Game
              </Button>
            )}
          </Card>

          {/* Game Info */}
          <Card className="casino-card p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Player Score:</span>
                <span className="text-white font-semibold">{playerScore}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dealer Score:</span>
                <span className="text-white font-semibold">{dealerScore}</span>
              </div>
            </div>
            
            {gameResult && (
              <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
                <p className="text-center font-semibold text-white">{gameResult}</p>
              </div>
            )}
          </Card>

          {showStrategy && (
            <Card className="casino-card p-4">
              <h4 className="text-white font-semibold mb-2">Strategy Hint</h4>
              <p className="text-emerald-400 text-sm">
                {playerScore <= 11 ? 'Always HIT - Cannot bust' :
                 playerScore >= 17 ? 'STAND - High risk of busting' :
                 'Consider dealer\'s up card carefully'}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Enhanced3DBlackjack;
