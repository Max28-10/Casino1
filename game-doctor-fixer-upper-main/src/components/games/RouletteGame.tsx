
import { useState } from 'react';
import { ArrowLeft, RotateCcw, Play } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { toast } from 'sonner';

interface RouletteGameProps {
  playerStats: any;
  onUpdateStats: (update: any) => void;
  onBack: () => void;
}

const RouletteGame = ({ playerStats, onUpdateStats, onBack }: RouletteGameProps) => {
  const [selectedBets, setSelectedBets] = useState<{[key: string]: number}>({});
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [gameHistory, setGameHistory] = useState<number[]>([]);

  const numbers = Array.from({length: 37}, (_, i) => i); // 0-36
  const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
  const blackNumbers = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];

  const getNumberColor = (num: number) => {
    if (num === 0) return 'green';
    return redNumbers.includes(num) ? 'red' : 'black';
  };

  const placeBet = (betType: string, amount: number = 10) => {
    if (amount > playerStats.chips) {
      toast.error('Insufficient chips!');
      return;
    }

    setSelectedBets(prev => ({
      ...prev,
      [betType]: (prev[betType] || 0) + amount
    }));
  };

  const clearBets = () => {
    setSelectedBets({});
  };

  const spin = async () => {
    const totalBet = Object.values(selectedBets).reduce((sum, bet) => sum + bet, 0);
    if (totalBet === 0) {
      toast.error('Place a bet first!');
      return;
    }

    if (totalBet > playerStats.chips) {
      toast.error('Insufficient chips!');
      return;
    }

    setIsSpinning(true);
    onUpdateStats({ chips: playerStats.chips - totalBet });

    // Simulate spinning delay
    setTimeout(() => {
      const result = Math.floor(Math.random() * 37);
      setLastResult(result);
      setGameHistory(prev => [result, ...prev.slice(0, 9)]);
      
      let totalWinnings = 0;
      const color = getNumberColor(result);
      
      // Calculate winnings
      Object.entries(selectedBets).forEach(([betType, betAmount]) => {
        let payout = 0;
        
        if (betType === `number-${result}`) {
          payout = betAmount * 36; // Straight up bet pays 35:1 + original bet
        } else if (betType === 'red' && color === 'red') {
          payout = betAmount * 2;
        } else if (betType === 'black' && color === 'black') {
          payout = betAmount * 2;
        } else if (betType === 'even' && result !== 0 && result % 2 === 0) {
          payout = betAmount * 2;
        } else if (betType === 'odd' && result !== 0 && result % 2 === 1) {
          payout = betAmount * 2;
        } else if (betType === 'low' && result >= 1 && result <= 18) {
          payout = betAmount * 2;
        } else if (betType === 'high' && result >= 19 && result <= 36) {
          payout = betAmount * 2;
        }
        
        totalWinnings += payout;
      });

      if (totalWinnings > 0) {
        toast.success(`You won ${totalWinnings} chips!`);
        onUpdateStats({ 
          chips: playerStats.chips + totalWinnings,
          gamesWon: playerStats.gamesWon + 1,
          gamesPlayed: playerStats.gamesPlayed + 1,
          experience: playerStats.experience + 30
        });
      } else {
        toast.error('Better luck next time!');
        onUpdateStats({ 
          gamesPlayed: playerStats.gamesPlayed + 1,
          experience: playerStats.experience + 10
        });
      }

      setSelectedBets({});
      setIsSpinning(false);
    }, 3000);
  };

  const renderRouletteWheel = () => (
    <div className="relative w-64 h-64 mx-auto mb-6">
      <div className={`w-full h-full rounded-full border-4 border-yellow-400 bg-gradient-to-br from-emerald-800 to-emerald-900 flex items-center justify-center ${isSpinning ? 'roulette-spin' : ''}`}>
        <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-black rounded-full"></div>
        </div>
      </div>
      {lastResult !== null && !isSpinning && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full w-16 h-16 flex items-center justify-center border-4 border-yellow-400">
          <span className={`text-2xl font-bold ${getNumberColor(lastResult) === 'red' ? 'text-red-600' : getNumberColor(lastResult) === 'black' ? 'text-black' : 'text-green-600'}`}>
            {lastResult}
          </span>
        </div>
      )}
    </div>
  );

  const renderBettingBoard = () => (
    <div className="grid grid-cols-3 gap-2 mb-6">
      {/* Numbers 1-36 */}
      {Array.from({length: 36}, (_, i) => i + 1).map(num => (
        <Button
          key={num}
          onClick={() => placeBet(`number-${num}`)}
          className={`h-12 text-white font-bold ${
            getNumberColor(num) === 'red' 
              ? 'bg-red-600 hover:bg-red-500' 
              : 'bg-slate-800 hover:bg-slate-700'
          }`}
        >
          {num}
          {selectedBets[`number-${num}`] && (
            <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {selectedBets[`number-${num}`]}
            </div>
          )}
        </Button>
      ))}
      
      {/* Zero */}
      <div className="col-span-3">
        <Button
          onClick={() => placeBet('number-0')}
          className="w-full h-12 bg-green-600 hover:bg-green-500 text-white font-bold relative"
        >
          0
          {selectedBets['number-0'] && (
            <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {selectedBets['number-0']}
            </div>
          )}
        </Button>
      </div>
    </div>
  );

  const renderOutsideBets = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
      {[
        { key: 'red', label: 'Red', color: 'bg-red-600' },
        { key: 'black', label: 'Black', color: 'bg-slate-800' },
        { key: 'even', label: 'Even', color: 'bg-slate-600' },
        { key: 'odd', label: 'Odd', color: 'bg-slate-600' },
        { key: 'low', label: '1-18', color: 'bg-slate-600' },
        { key: 'high', label: '19-36', color: 'bg-slate-600' }
      ].map(bet => (
        <Button
          key={bet.key}
          onClick={() => placeBet(bet.key)}
          className={`${bet.color} hover:opacity-80 text-white font-bold h-12 relative`}
        >
          {bet.label}
          {selectedBets[bet.key] && (
            <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {selectedBets[bet.key]}
            </div>
          )}
        </Button>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <Button onClick={onBack} variant="outline" className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lobby
        </Button>
        <h1 className="text-4xl font-bold text-white">European Roulette</h1>
        <Button onClick={clearBets} variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
          <RotateCcw className="w-4 h-4 mr-2" />
          Clear Bets
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="casino-card p-6">
            {renderRouletteWheel()}
            
            <div className="text-center mb-6">
              {isSpinning ? (
                <p className="text-yellow-400 text-xl font-semibold animate-pulse">Spinning...</p>
              ) : lastResult !== null ? (
                <p className="text-white text-xl">
                  Last Result: <span className={`font-bold ${getNumberColor(lastResult) === 'red' ? 'text-red-400' : getNumberColor(lastResult) === 'black' ? 'text-white' : 'text-green-400'}`}>
                    {lastResult} {getNumberColor(lastResult).toUpperCase()}
                  </span>
                </p>
              ) : (
                <p className="text-slate-400 text-xl">Place your bets!</p>
              )}
            </div>

            {renderBettingBoard()}
            {renderOutsideBets()}

            <div className="flex justify-center">
              <Button 
                onClick={spin} 
                disabled={isSpinning || Object.keys(selectedBets).length === 0}
                className="casino-button px-8 py-4 text-lg"
              >
                <Play className="w-5 h-5 mr-2" />
                {isSpinning ? 'Spinning...' : 'Spin'}
              </Button>
            </div>
          </Card>
        </div>

        <div>
          <Card className="casino-card p-6 mb-6">
            <h3 className="text-xl font-semibold text-white mb-4">Your Bets</h3>
            {Object.keys(selectedBets).length === 0 ? (
              <p className="text-slate-400">No bets placed</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(selectedBets).map(([betType, amount]) => (
                  <div key={betType} className="flex justify-between text-sm">
                    <span className="text-slate-400 capitalize">
                      {betType.replace('-', ' ')}
                    </span>
                    <span className="text-yellow-400">${amount}</span>
                  </div>
                ))}
                <div className="border-t border-slate-600 pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-white">Total</span>
                    <span className="text-yellow-400">
                      ${Object.values(selectedBets).reduce((sum, bet) => sum + bet, 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card className="casino-card p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Recent Results</h3>
            <div className="flex flex-wrap gap-2">
              {gameHistory.map((num, index) => (
                <div
                  key={index}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    getNumberColor(num) === 'red' 
                      ? 'bg-red-600 text-white' 
                      : getNumberColor(num) === 'black'
                      ? 'bg-slate-800 text-white'
                      : 'bg-green-600 text-white'
                  }`}
                >
                  {num}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RouletteGame;
