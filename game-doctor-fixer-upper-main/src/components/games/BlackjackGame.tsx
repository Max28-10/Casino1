
import { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Plus, Minus, Lightbulb } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { toast } from 'sonner';

interface BlackjackGameProps {
  playerStats: any;
  onUpdateStats: (update: any) => void;
  onBack: () => void;
}

interface PlayingCard {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: string;
  numValue: number;
}

const BlackjackGame = ({ playerStats, onUpdateStats, onBack }: BlackjackGameProps) => {
  const [playerHand, setPlayerHand] = useState<PlayingCard[]>([]);
  const [dealerHand, setDealerHand] = useState<PlayingCard[]>([]);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'finished'>('betting');
  const [currentBet, setCurrentBet] = useState(25);
  const [playerScore, setPlayerScore] = useState(0);
  const [dealerScore, setDealerScore] = useState(0);
  const [gameResult, setGameResult] = useState<string>('');
  const [showStrategy, setShowStrategy] = useState(false);

  const suits = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  const createDeck = (): PlayingCard[] => {
    const deck: PlayingCard[] = [];
    suits.forEach(suit => {
      values.forEach(value => {
        let numValue = parseInt(value);
        if (value === 'A') numValue = 11;
        else if (['J', 'Q', 'K'].includes(value)) numValue = 10;
        
        deck.push({ suit, value, numValue });
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

  const dealCard = (deck: PlayingCard[]) => {
    return deck.pop()!;
  };

  const startGame = () => {
    if (currentBet > playerStats.chips) {
      toast.error('Insufficient chips!');
      return;
    }

    const deck = createDeck();
    const newPlayerHand = [dealCard(deck), dealCard(deck)];
    const newDealerHand = [dealCard(deck), dealCard(deck)];
    
    setPlayerHand(newPlayerHand);
    setDealerHand(newDealerHand);
    setPlayerScore(calculateScore(newPlayerHand));
    setDealerScore(calculateScore([newDealerHand[0]])); // Only show first card
    setGameState('playing');
    setGameResult('');
    
    onUpdateStats({ chips: playerStats.chips - currentBet });
  };

  const hit = () => {
    const deck = createDeck();
    const newCard = dealCard(deck);
    const newHand = [...playerHand, newCard];
    const newScore = calculateScore(newHand);
    
    setPlayerHand(newHand);
    setPlayerScore(newScore);
    
    if (newScore > 21) {
      setGameState('finished');
      setGameResult('Bust! Dealer wins.');
      onUpdateStats({ 
        gamesPlayed: playerStats.gamesPlayed + 1,
        experience: playerStats.experience + 10 
      });
    }
  };

  const stand = () => {
    let newDealerHand = [...dealerHand];
    let newDealerScore = calculateScore(newDealerHand);
    const deck = createDeck();
    
    // Dealer hits on 16, stands on 17
    while (newDealerScore < 17) {
      const newCard = dealCard(deck);
      newDealerHand.push(newCard);
      newDealerScore = calculateScore(newDealerHand);
    }
    
    setDealerHand(newDealerHand);
    setDealerScore(newDealerScore);
    
    let result = '';
    let chipsWon = 0;
    
    if (newDealerScore > 21) {
      result = 'Dealer busts! You win!';
      chipsWon = currentBet * 2;
    } else if (playerScore > newDealerScore) {
      result = 'You win!';
      chipsWon = currentBet * 2;
    } else if (playerScore < newDealerScore) {
      result = 'Dealer wins.';
      chipsWon = 0;
    } else {
      result = 'Push! It\'s a tie.';
      chipsWon = currentBet;
    }
    
    setGameResult(result);
    setGameState('finished');
    
    const won = chipsWon > currentBet;
    onUpdateStats({ 
      chips: playerStats.chips + chipsWon,
      gamesPlayed: playerStats.gamesPlayed + 1,
      gamesWon: won ? playerStats.gamesWon + 1 : playerStats.gamesWon,
      experience: playerStats.experience + (won ? 25 : 10)
    });
    
    toast.success(result);
  };

  const getStrategyAdvice = () => {
    if (playerHand.length < 2) return '';
    
    const dealerUpCard = dealerHand[0]?.numValue || 0;
    
    if (playerScore <= 11) return 'Always HIT - Cannot bust';
    if (playerScore >= 17) return 'STAND - High risk of busting';
    if (playerScore === 16 && dealerUpCard >= 7) return 'HIT - Dealer likely has strong hand';
    if (playerScore >= 12 && dealerUpCard <= 6) return 'STAND - Dealer likely to bust';
    
    return 'Consider the dealer\'s up card carefully';
  };

  const renderCard = (card: PlayingCard, hidden = false) => {
    if (hidden) {
      return (
        <div className="w-16 h-24 bg-gradient-to-br from-red-800 to-red-900 rounded-lg border-2 border-red-600 flex items-center justify-center">
          <div className="text-white text-xs">🂠</div>
        </div>
      );
    }

    const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
    const suitSymbol = {
      hearts: '♥',
      diamonds: '♦',
      clubs: '♣',
      spades: '♠'
    };

    return (
      <div className={`w-16 h-24 bg-white rounded-lg border-2 flex flex-col items-center justify-between p-2 card-animation ${isRed ? 'text-red-600' : 'text-black'}`}>
        <div className="text-xs font-bold">{card.value}</div>
        <div className="text-2xl">{suitSymbol[card.suit]}</div>
        <div className="text-xs font-bold transform rotate-180">{card.value}</div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <Button onClick={onBack} variant="outline" className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lobby
        </Button>
        <h1 className="text-4xl font-bold text-white">Blackjack</h1>
        <Button 
          onClick={() => setShowStrategy(!showStrategy)}
          variant="outline"
          className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
        >
          <Lightbulb className="w-4 h-4 mr-2" />
          Strategy
        </Button>
      </div>

      {showStrategy && (
        <Card className="casino-card p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">Basic Strategy Hint</h3>
          <p className="text-emerald-400">{getStrategyAdvice()}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Game Area */}
        <div className="lg:col-span-2">
          {/* Dealer */}
          <Card className="casino-card p-6 mb-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              Dealer {gameState !== 'playing' && `(${dealerScore})`}
            </h3>
            <div className="flex gap-2 mb-4">
              {dealerHand.map((card, index) => (
                <div key={index}>
                  {renderCard(card, gameState === 'playing' && index === 1)}
                </div>
              ))}
            </div>
          </Card>

          {/* Player */}
          <Card className="casino-card p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              Player ({playerScore})
            </h3>
            <div className="flex gap-2 mb-6">
              {playerHand.map((card, index) => (
                <div key={index}>{renderCard(card)}</div>
              ))}
            </div>

            {gameState === 'playing' && (
              <div className="flex gap-4">
                <Button onClick={hit} className="casino-button">
                  Hit
                </Button>
                <Button onClick={stand} className="casino-button">
                  Stand
                </Button>
              </div>
            )}

            {gameResult && (
              <div className="mt-4 p-4 bg-slate-700 rounded-lg">
                <p className="text-lg font-semibold text-white">{gameResult}</p>
              </div>
            )}
          </Card>
        </div>

        {/* Betting Panel */}
        <div>
          <Card className="casino-card p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Betting</h3>
            
            <div className="mb-4">
              <p className="text-slate-400 mb-2">Current Bet</p>
              <div className="flex items-center gap-2 mb-4">
                <Button 
                  onClick={() => currentBet > 5 && setCurrentBet(currentBet - 5)}
                  size="sm"
                  variant="outline"
                  className="border-emerald-500/50"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-2xl font-bold text-yellow-400 min-w-[100px] text-center">
                  ${currentBet}
                </span>
                <Button 
                  onClick={() => currentBet < 1000 && setCurrentBet(currentBet + 5)}
                  size="sm"
                  variant="outline"
                  className="border-emerald-500/50"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {[25, 50, 100, 250].map(amount => (
                  <Button
                    key={amount}
                    onClick={() => setCurrentBet(amount)}
                    variant="outline"
                    size="sm"
                    className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
            </div>

            {gameState === 'betting' && (
              <Button onClick={startGame} className="w-full casino-button mb-4">
                Deal Cards
              </Button>
            )}

            {gameState === 'finished' && (
              <Button onClick={() => setGameState('betting')} className="w-full casino-button mb-4">
                <RotateCcw className="w-4 h-4 mr-2" />
                New Game
              </Button>
            )}

            <div className="text-sm text-slate-400 space-y-1">
              <p>• Dealer hits on 16, stands on 17</p>
              <p>• Blackjack pays 3:2</p>
              <p>• Insurance available</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BlackjackGame;
