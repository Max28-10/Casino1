
import { useState } from 'react';
import { ArrowLeft, Play, Zap, Star, Crown } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { toast } from 'sonner';

interface SlotMachineProps {
  playerStats: any;
  onUpdateStats: (update: any) => void;
  onBack: () => void;
}

const SlotMachine = ({ playerStats, onUpdateStats, onBack }: SlotMachineProps) => {
  const [reels, setReels] = useState(['🍎', '🍌', '🍇']);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentBet, setCurrentBet] = useState(10);
  const [winAmount, setWinAmount] = useState(0);
  const [jackpot, setJackpot] = useState(50000);

  const symbols = ['🍎', '🍌', '🍇', '🍊', '🍒', '⭐', '💎', '👑'];
  const symbolValues = {
    '🍎': 2,
    '🍌': 3,
    '🍇': 4,
    '🍊': 5,
    '🍒': 8,
    '⭐': 15,
    '💎': 25,
    '👑': 50
  };

  const spin = async () => {
    if (currentBet > playerStats.chips) {
      toast.error('Insufficient chips!');
      return;
    }

    setIsSpinning(true);
    setWinAmount(0);
    onUpdateStats({ chips: playerStats.chips - currentBet });

    // Simulate spinning animation
    const spinDuration = 2000;
    const spinInterval = 100;
    let elapsed = 0;

    const spinAnimation = setInterval(() => {
      if (elapsed < spinDuration) {
        setReels([
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)]
        ]);
        elapsed += spinInterval;
      } else {
        clearInterval(spinAnimation);
        
        // Final result
        const finalReels = [
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)]
        ];
        
        setReels(finalReels);
        calculateWin(finalReels);
        setIsSpinning(false);
      }
    }, spinInterval);
  };

  const calculateWin = (reels: string[]) => {
    let winnings = 0;
    let message = '';

    // Check for jackpot (three crowns)
    if (reels.every(symbol => symbol === '👑')) {
      winnings = jackpot;
      message = `🎉 JACKPOT! You won ${jackpot} chips!`;
      setJackpot(50000); // Reset jackpot
    }
    // Check for three of a kind
    else if (reels[0] === reels[1] && reels[1] === reels[2]) {
      const symbol = reels[0] as keyof typeof symbolValues;
      winnings = currentBet * symbolValues[symbol];
      message = `🎊 Three ${symbol}! You won ${winnings} chips!`;
    }
    // Check for two of a kind
    else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
      const matchingSymbol = reels[0] === reels[1] ? reels[0] : 
                           reels[1] === reels[2] ? reels[1] : reels[0];
      const symbol = matchingSymbol as keyof typeof symbolValues;
      winnings = Math.floor(currentBet * symbolValues[symbol] * 0.5);
      message = `Two ${symbol}! You won ${winnings} chips!`;
    }

    if (winnings > 0) {
      setWinAmount(winnings);
      toast.success(message);
      onUpdateStats({
        chips: playerStats.chips + winnings,
        gamesWon: playerStats.gamesWon + 1,
        gamesPlayed: playerStats.gamesPlayed + 1,
        experience: playerStats.experience + 20
      });
    } else {
      toast.error('Try again!');
      onUpdateStats({
        gamesPlayed: playerStats.gamesPlayed + 1,
        experience: playerStats.experience + 5
      });
    }

    // Increase jackpot
    setJackpot(prev => prev + Math.floor(currentBet * 0.1));
  };

  const betOptions = [5, 10, 25, 50, 100];

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <Button onClick={onBack} variant="outline" className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lobby
        </Button>
        <h1 className="text-4xl font-bold text-white">Diamond Slots</h1>
        <div className="text-right">
          <p className="text-yellow-400 text-2xl font-bold animate-glow">
            Jackpot: ${jackpot.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400">Progressive Jackpot</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card className="casino-card p-8 mb-6">
          {/* Slot Machine Display */}
          <div className="bg-gradient-to-b from-yellow-400 to-yellow-600 p-6 rounded-2xl mb-6 shadow-2xl">
            <div className="bg-black p-4 rounded-xl">
              <div className="flex justify-center gap-4 mb-4">
                {reels.map((symbol, index) => (
                  <div
                    key={index}
                    className={`w-24 h-24 bg-white rounded-lg flex items-center justify-center text-5xl border-4 border-yellow-400 ${isSpinning ? 'slot-spin' : ''}`}
                  >
                    {symbol}
                  </div>
                ))}
              </div>
              
              {winAmount > 0 && !isSpinning && (
                <div className="text-center">
                  <p className="text-yellow-400 text-3xl font-bold animate-pulse">
                    WIN: ${winAmount}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center">
              <p className="text-slate-400 mb-2">Bet Amount</p>
              <div className="flex gap-2">
                {betOptions.map(amount => (
                  <Button
                    key={amount}
                    onClick={() => setCurrentBet(amount)}
                    variant={currentBet === amount ? "default" : "outline"}
                    className={currentBet === amount ? "casino-button" : "border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"}
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={spin}
              disabled={isSpinning || currentBet > playerStats.chips}
              className="casino-button px-12 py-6 text-2xl"
            >
              {isSpinning ? (
                <>
                  <Zap className="w-6 h-6 mr-2 animate-pulse" />
                  Spinning...
                </>
              ) : (
                <>
                  <Play className="w-6 h-6 mr-2" />
                  SPIN ${currentBet}
                </>
              )}
            </Button>

            <div className="text-center">
              <p className="text-slate-400 mb-2">Max Win</p>
              <p className="text-emerald-400 text-2xl font-bold">
                ${(currentBet * 50).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        {/* Paytable */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="casino-card p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Star className="w-5 h-5 mr-2 text-yellow-400" />
              Paytable
            </h3>
            <div className="space-y-2">
              {Object.entries(symbolValues).map(([symbol, multiplier]) => (
                <div key={symbol} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{symbol}</span>
                    <span className="text-slate-400">× 3</span>
                  </div>
                  <span className="text-emerald-400 font-semibold">
                    {multiplier}x bet
                  </span>
                </div>
              ))}
              <div className="border-t border-slate-600 pt-2 mt-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">👑</span>
                    <span className="text-slate-400">× 3</span>
                  </div>
                  <span className="text-yellow-400 font-bold animate-pulse">
                    JACKPOT!
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="casino-card p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Crown className="w-5 h-5 mr-2 text-yellow-400" />
              Game Rules
            </h3>
            <div className="text-sm text-slate-300 space-y-2">
              <p>• Three matching symbols win the full multiplier</p>
              <p>• Two matching symbols win half the multiplier</p>
              <p>• Three crowns (👑) win the progressive jackpot</p>
              <p>• Higher value symbols have better payouts</p>
              <p>• Jackpot grows with every spin</p>
              <p>• Minimum bet: $5, Maximum bet: $100</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SlotMachine;
