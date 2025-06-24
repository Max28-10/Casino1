
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { toast } from 'sonner';

interface Enhanced2DRouletteProps {
  playerStats: any;
  onUpdateStats: (update: any) => void;
  onBack: () => void;
}

const rouletteNumbers = [
  { number: 0, color: 'green' },
  { number: 32, color: 'red' }, { number: 15, color: 'black' }, { number: 19, color: 'red' },
  { number: 4, color: 'black' }, { number: 21, color: 'red' }, { number: 2, color: 'black' },
  { number: 25, color: 'red' }, { number: 17, color: 'black' }, { number: 34, color: 'red' },
  { number: 6, color: 'black' }, { number: 27, color: 'red' }, { number: 13, color: 'black' },
  { number: 36, color: 'red' }, { number: 11, color: 'black' }, { number: 30, color: 'red' },
  { number: 8, color: 'black' }, { number: 23, color: 'red' }, { number: 10, color: 'black' },
  { number: 5, color: 'red' }, { number: 24, color: 'black' }, { number: 16, color: 'red' },
  { number: 33, color: 'black' }, { number: 1, color: 'red' }, { number: 20, color: 'black' },
  { number: 14, color: 'red' }, { number: 31, color: 'black' }, { number: 9, color: 'red' },
  { number: 22, color: 'black' }, { number: 18, color: 'red' }, { number: 29, color: 'black' },
  { number: 7, color: 'red' }, { number: 28, color: 'black' }, { number: 12, color: 'red' },
  { number: 35, color: 'black' }, { number: 3, color: 'red' }, { number: 26, color: 'black' }
];

const Enhanced2DRoulette = ({ playerStats, onUpdateStats, onBack }: Enhanced2DRouletteProps) => {
  const [currentBet, setCurrentBet] = useState(25);
  const [selectedBets, setSelectedBets] = useState<{[key: string]: number}>({});
  const [isSpinning, setIsSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [ballRotation, setBallRotation] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const wheelRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);

  const playSound = (type: 'spin' | 'win' | 'lose' | 'chip') => {
    if (!audioEnabled) return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch (type) {
      case 'spin':
        oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 3);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 3);
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
    }
  };

  const placeBet = (betType: string) => {
    if (currentBet > playerStats.chips) {
      toast.error('Insufficient chips!');
      return;
    }

    playSound('chip');
    setSelectedBets(prev => ({
      ...prev,
      [betType]: (prev[betType] || 0) + currentBet
    }));
    onUpdateStats({ chips: playerStats.chips - currentBet });
  };

  const spin = () => {
    if (Object.keys(selectedBets).length === 0) {
      toast.error('Please place a bet first!');
      return;
    }

    setIsSpinning(true);
    playSound('spin');
    
    const finalWheelRotation = wheelRotation + 1800 + Math.random() * 720; // 5-7 full rotations
    const finalBallRotation = ballRotation - 2160 - Math.random() * 1080; // Ball spins opposite direction
    
    setWheelRotation(finalWheelRotation);
    setBallRotation(finalBallRotation);

    setTimeout(() => {
      const winNumber = rouletteNumbers[Math.floor(Math.random() * rouletteNumbers.length)];
      setWinningNumber(winNumber.number);
      
      let totalWon = 0;
      
      Object.entries(selectedBets).forEach(([betType, betAmount]) => {
        let payout = 0;
        
        if (betType === winNumber.number.toString()) {
          payout = betAmount * 35; // Straight up bet
        } else if (betType === winNumber.color && winNumber.color !== 'green') {
          payout = betAmount * 2; // Color bet
        } else if (betType === 'even' && winNumber.number % 2 === 0 && winNumber.number !== 0) {
          payout = betAmount * 2;
        } else if (betType === 'odd' && winNumber.number % 2 === 1) {
          payout = betAmount * 2;
        }
        
        totalWon += payout;
      });

      if (totalWon > 0) {
        onUpdateStats({ 
          chips: playerStats.chips + totalWon,
          gamesWon: playerStats.gamesWon + 1 
        });
        playSound('win');
        toast.success(`You won ${totalWon} chips!`);
      } else {
        playSound('lose');
        toast.error('Better luck next time!');
      }
      
      onUpdateStats({ gamesPlayed: playerStats.gamesPlayed + 1 });
      setIsSpinning(false);
    }, 4000);
  };

  const clearBets = () => {
    const totalBetAmount = Object.values(selectedBets).reduce((sum, bet) => sum + bet, 0);
    onUpdateStats({ chips: playerStats.chips + totalBetAmount });
    setSelectedBets({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-red-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm">
        <Button onClick={onBack} variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lobby
        </Button>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-yellow-400 bg-clip-text text-transparent">
          Premium Roulette
        </h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => setAudioEnabled(!audioEnabled)}
            variant="outline"
            className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 p-8 gap-8">
        {/* Roulette Wheel */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative">
            {/* Outer Wheel */}
            <div 
              ref={wheelRef}
              className="w-80 h-80 rounded-full border-8 border-yellow-600 bg-gradient-to-br from-yellow-800 to-yellow-900 relative shadow-2xl transition-transform duration-[4000ms] ease-out"
              style={{ transform: `rotate(${wheelRotation}deg)` }}
            >
              {/* Numbers around the wheel */}
              {rouletteNumbers.map((item, index) => {
                const angle = (index * 360) / rouletteNumbers.length;
                return (
                  <div
                    key={item.number}
                    className={`absolute w-8 h-8 flex items-center justify-center text-white font-bold text-sm rounded
                      ${item.color === 'red' ? 'bg-red-600' : item.color === 'black' ? 'bg-black' : 'bg-green-600'}`}
                    style={{
                      transform: `rotate(${angle}deg) translateY(-140px) rotate(-${angle}deg)`,
                      transformOrigin: 'center 140px'
                    }}
                  >
                    {item.number}
                  </div>
                );
              })}
              
              {/* Center hub */}
              <div className="absolute inset-1/2 w-8 h-8 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-600 rounded-full border-2 border-yellow-400"></div>
            </div>

            {/* Spinning Ball */}
            <div
              ref={ballRef}
              className="absolute inset-0 transition-transform duration-[4000ms] ease-out"
              style={{ transform: `rotate(${ballRotation}deg)` }}
            >
              <div className="w-4 h-4 bg-white rounded-full shadow-lg absolute" 
                style={{ 
                  top: '20px', 
                  left: '50%', 
                  transform: 'translateX(-50%)',
                  boxShadow: '0 0 10px rgba(255,255,255,0.8)'
                }}
              ></div>
            </div>

            {/* Winning Number Display */}
            {winningNumber !== null && (
              <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
                <div className={`px-6 py-3 rounded-lg text-white font-bold text-xl
                  ${rouletteNumbers.find(n => n.number === winningNumber)?.color === 'red' ? 'bg-red-600' : 
                    rouletteNumbers.find(n => n.number === winningNumber)?.color === 'black' ? 'bg-black' : 'bg-green-600'}`}>
                  Winning: {winningNumber}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Betting Panel */}
        <div className="w-96 bg-slate-900/80 backdrop-blur-sm p-6 space-y-6 rounded-lg">
          {/* Chip Stats */}
          <Card className="bg-slate-800/50 border-red-500/20 p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Your Chips</h3>
            <div className="text-3xl font-bold text-yellow-400">
              ${playerStats.chips.toLocaleString()}
            </div>
          </Card>

          {/* Bet Amount */}
          <Card className="bg-slate-800/50 border-red-500/20 p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Bet Amount</h3>
            <div className="text-2xl font-bold text-yellow-400 mb-3">
              ${currentBet}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[5, 25, 100, 500].map(amount => (
                <Button
                  key={amount}
                  onClick={() => setCurrentBet(amount)}
                  variant="outline"
                  size="sm"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  ${amount}
                </Button>
              ))}
            </div>
          </Card>

          {/* Betting Options */}
          <Card className="bg-slate-800/50 border-red-500/20 p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Place Your Bets</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => placeBet('red')}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={isSpinning}
                >
                  Red (2:1)
                </Button>
                <Button
                  onClick={() => placeBet('black')}
                  className="bg-gray-800 hover:bg-gray-900 text-white"
                  disabled={isSpinning}
                >
                  Black (2:1)
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => placeBet('even')}
                  variant="outline"
                  className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                  disabled={isSpinning}
                >
                  Even (2:1)
                </Button>
                <Button
                  onClick={() => placeBet('odd')}
                  variant="outline"
                  className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                  disabled={isSpinning}
                >
                  Odd (2:1)
                </Button>
              </div>
              
              {/* Number betting grid */}
              <div className="mt-4">
                <h4 className="text-white text-sm mb-2">Straight Up (35:1)</h4>
                <div className="grid grid-cols-6 gap-1 max-h-32 overflow-y-auto">
                  {Array.from({length: 36}, (_, i) => i + 1).map(num => (
                    <Button
                      key={num}
                      onClick={() => placeBet(num.toString())}
                      variant="outline"
                      size="sm"
                      className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 text-xs p-1"
                      disabled={isSpinning}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Current Bets */}
          {Object.keys(selectedBets).length > 0 && (
            <Card className="bg-slate-800/50 border-yellow-500/20 p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Current Bets</h3>
              <div className="space-y-1">
                {Object.entries(selectedBets).map(([betType, amount]) => (
                  <div key={betType} className="flex justify-between text-sm">
                    <span className="text-slate-400">{betType}:</span>
                    <span className="text-yellow-400">${amount}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={spin} 
              disabled={isSpinning || Object.keys(selectedBets).length === 0}
              className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-3"
            >
              {isSpinning ? 'Spinning...' : 'Spin Wheel'}
            </Button>
            
            <Button 
              onClick={clearBets}
              disabled={isSpinning}
              variant="outline"
              className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear Bets
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Enhanced2DRoulette;
