
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RotateCcw, Plus, Minus, Lightbulb, TrendingUp, TrendingDown, Volume2, VolumeX } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { toast } from 'sonner';

interface Enhanced2DBlackjackProps {
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

// Audio hook for sound effects
const useAudio = () => {
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  const playSound = (type: 'deal' | 'win' | 'lose' | 'chip' | 'card') => {
    if (!audioEnabled) return;
    
    // Create audio context for Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different sounds for different actions
    switch (type) {
      case 'deal':
        oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(330, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        break;
      case 'win':
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.2);
        oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.4);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.6);
        break;
      case 'lose':
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(150, audioContext.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
        break;
      case 'chip':
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
        break;
      case 'card':
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
        break;
    }
  };
  
  return { playSound, audioEnabled, setAudioEnabled };
};

// 2D Card Component with animations
function Card2D({ card, isHidden = false, isDealing = false }: { card: PlayingCard; isHidden?: boolean; isDealing?: boolean }) {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  
  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return '';
    }
  };

  return (
    <div className={`
      relative w-20 h-28 rounded-lg border-2 shadow-lg transform transition-all duration-500
      ${isDealing ? 'animate-[slideIn_0.5s_ease-out]' : ''}
      ${isHidden 
        ? 'bg-gradient-to-br from-red-900 to-red-700 border-red-600' 
        : 'bg-white border-gray-300 hover:shadow-xl hover:scale-105'
      }
    `}>
      {!isHidden && (
        <>
          <div className={`absolute top-1 left-1 text-xs font-bold ${isRed ? 'text-red-600' : 'text-black'}`}>
            {card.value}
          </div>
          <div className={`absolute top-1 right-1 text-xs ${isRed ? 'text-red-600' : 'text-black'}`}>
            {getSuitSymbol(card.suit)}
          </div>
          <div className={`absolute inset-0 flex items-center justify-center text-2xl ${isRed ? 'text-red-600' : 'text-black'}`}>
            {getSuitSymbol(card.suit)}
          </div>
          <div className={`absolute bottom-1 right-1 text-xs font-bold transform rotate-180 ${isRed ? 'text-red-600' : 'text-black'}`}>
            {card.value}
          </div>
          <div className={`absolute bottom-1 left-1 text-xs transform rotate-180 ${isRed ? 'text-red-600' : 'text-black'}`}>
            {getSuitSymbol(card.suit)}
          </div>
        </>
      )}
      {isHidden && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded border-2 border-yellow-300 flex items-center justify-center">
            <div className="text-red-800 font-bold text-xs">CASINO</div>
          </div>
        </div>
      )}
    </div>
  );
}

const Enhanced2DBlackjack = ({ playerStats, onUpdateStats, onBack }: Enhanced2DBlackjackProps) => {
  const [playerHand, setPlayerHand] = useState<PlayingCard[]>([]);
  const [dealerHand, setDealerHand] = useState<PlayingCard[]>([]);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'finished'>('betting');
  const [currentBet, setCurrentBet] = useState(25);
  const [playerScore, setPlayerScore] = useState(0);
  const [dealerScore, setDealerScore] = useState(0);
  const [gameResult, setGameResult] = useState<string>('');
  const [showStrategy, setShowStrategy] = useState(false);
  const [gameHistory, setGameHistory] = useState<{won: number, lost: number}>({won: 0, lost: 0});
  const [dealingAnimation, setDealingAnimation] = useState(false);
  const deckRef = useRef<PlayingCard[]>([]);
  const { playSound, audioEnabled, setAudioEnabled } = useAudio();

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

    setDealingAnimation(true);
    playSound('deal');
    
    setTimeout(() => {
      deckRef.current = createDeck();
      const newPlayerHand = [deckRef.current.pop()!, deckRef.current.pop()!];
      const newDealerHand = [deckRef.current.pop()!, deckRef.current.pop()!];
      
      setPlayerHand(newPlayerHand);
      setDealerHand(newDealerHand);
      setPlayerScore(calculateScore(newPlayerHand));
      setDealerScore(calculateScore([newDealerHand[0]]));
      setGameState('playing');
      setGameResult('');
      setDealingAnimation(false);
      
      onUpdateStats({ chips: playerStats.chips - currentBet });
    }, 500);
  };

  const hit = () => {
    if (deckRef.current.length === 0) deckRef.current = createDeck();
    
    playSound('card');
    const newCard = deckRef.current.pop()!;
    const newHand = [...playerHand, newCard];
    const newScore = calculateScore(newHand);
    
    setPlayerHand(newHand);
    setPlayerScore(newScore);
    
    if (newScore > 21) {
      setTimeout(() => endGame(false, 'Bust! Dealer wins.'), 500);
    }
  };

  const stand = () => {
    let newDealerHand = [...dealerHand];
    let newDealerScore = calculateScore(newDealerHand);
    
    if (deckRef.current.length === 0) deckRef.current = createDeck();
    
    const dealerDraw = () => {
      if (newDealerScore < 17) {
        setTimeout(() => {
          playSound('card');
          const newCard = deckRef.current.pop()!;
          newDealerHand.push(newCard);
          newDealerScore = calculateScore(newDealerHand);
          setDealerHand([...newDealerHand]);
          setDealerScore(newDealerScore);
          dealerDraw();
        }, 800);
      } else {
        finishGame(newDealerScore);
      }
    };
    
    dealerDraw();
  };

  const finishGame = (finalDealerScore: number) => {
    let won = false;
    let result = '';
    
    if (finalDealerScore > 21) {
      result = 'Dealer busts! You win!';
      won = true;
    } else if (playerScore > finalDealerScore) {
      result = 'You win!';
      won = true;
    } else if (playerScore < finalDealerScore) {
      result = 'Dealer wins.';
    } else {
      result = "Push! It's a tie.";
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
    
    playSound(won ? 'win' : 'lose');
    toast.success(result);
  };

  const adjustBet = (amount: number) => {
    playSound('chip');
    setCurrentBet(prev => Math.max(5, Math.min(prev + amount, playerStats.chips, 5000)));
  };

  const quickBet = (amount: number) => {
    playSound('chip');
    setCurrentBet(Math.min(amount, playerStats.chips));
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
            onClick={() => setAudioEnabled(!audioEnabled)}
            variant="outline"
            className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
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
        {/* Game Table */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            {/* Dealer Section */}
            <div className="text-center mb-8">
              <h3 className="text-xl font-semibold text-white mb-4">
                Dealer {gameState !== 'betting' && `(${dealerScore})`}
              </h3>
              <div className="flex justify-center gap-2 min-h-[120px] items-center">
                {dealerHand.map((card, index) => (
                  <Card2D
                    key={card.id}
                    card={card}
                    isHidden={gameState === 'playing' && index === 1}
                    isDealing={dealingAnimation}
                  />
                ))}
              </div>
            </div>

            {/* Game Table Visual */}
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-full h-32 mb-8 border-4 border-emerald-600 shadow-2xl flex items-center justify-center">
              <div className="text-center">
                {gameState === 'betting' && (
                  <div className="text-white text-lg font-semibold">
                    Place your bet and click "Deal Cards"
                  </div>
                )}
                {gameState === 'playing' && (
                  <div className="flex gap-4">
                    <Button onClick={hit} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-lg font-semibold">
                      Hit
                    </Button>
                    <Button onClick={stand} className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg font-semibold">
                      Stand
                    </Button>
                  </div>
                )}
                {gameResult && (
                  <div className="text-yellow-400 text-xl font-bold">
                    {gameResult}
                  </div>
                )}
              </div>
            </div>

            {/* Player Section */}
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-4">
                You {gameState !== 'betting' && `(${playerScore})`}
              </h3>
              <div className="flex justify-center gap-2 min-h-[120px] items-center">
                {playerHand.map((card) => (
                  <Card2D
                    key={card.id}
                    card={card}
                    isDealing={dealingAnimation}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Betting & Stats */}
        <div className="w-80 bg-slate-900/80 backdrop-blur-sm p-6 space-y-6">
          {/* Chip Stats */}
          <Card className="bg-slate-800/50 border-emerald-500/20 p-4">
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
          <Card className="bg-slate-800/50 border-emerald-500/20 p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Betting</h3>
            
            <div className="text-center mb-4">
              <p className="text-slate-400 text-sm mb-1">Current Bet</p>
              <div className="text-3xl font-bold text-yellow-400 mb-3">
                ${currentBet.toLocaleString()}
              </div>
              
              <div className="flex items-center justify-center gap-2 mb-4">
                <Button 
                  onClick={() => adjustBet(-5)}
                  size="sm"
                  variant="outline"
                  className="border-emerald-500/50 text-emerald-400"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Button 
                  onClick={() => adjustBet(5)}
                  size="sm"
                  variant="outline"
                  className="border-emerald-500/50 text-emerald-400"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {[25, 50, 100, 250].map(amount => (
                <Button
                  key={amount}
                  onClick={() => quickBet(amount)}
                  variant="outline"
                  size="sm"
                  className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                >
                  ${amount}
                </Button>
              ))}
            </div>

            {/* Action Buttons */}
            {gameState === 'betting' && (
              <Button onClick={startGame} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mb-2">
                Deal Cards
              </Button>
            )}

            {gameState === 'finished' && (
              <Button onClick={() => setGameState('betting')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mb-2">
                <RotateCcw className="w-4 h-4 mr-2" />
                New Game
              </Button>
            )}
          </Card>

          {/* Game Info */}
          {/* Strategy Hint */}
          <Card className="bg-slate-800/50 border-emerald-500/20 p-4">
            <h4 className="text-white font-semibold mb-2">Strategy Hint</h4>
            <p className="text-emerald-400 text-sm">
              {playerScore <= 11 ? 'Always HIT - Cannot bust' :
               playerScore >= 17 ? 'STAND - High risk of busting' :
               'Consider dealer\'s up card carefully'}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Enhanced2DBlackjack;
