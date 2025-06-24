
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { ArrowLeft, Bomb, Diamond, RotateCcw, Pickaxe } from 'lucide-react';
import { Card } from '../ui/card';
import { toast } from 'sonner';

interface MinesGameProps {
  playerStats: any;
  onUpdateStats: (update: any) => void;
  onBack: () => void;
}

type CellState = 'hidden' | 'revealed' | 'mine' | 'gem';

interface GameCell {
  state: CellState;
  isMine: boolean;
  isRevealed: boolean;
}

const MinesGame = ({ playerStats, onUpdateStats, onBack }: MinesGameProps) => {
  const [betAmount, setBetAmount] = useState(100);
  const [mineCount, setMineCount] = useState(3);
  const [gameBoard, setGameBoard] = useState<GameCell[][]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [revealedGems, setRevealedGems] = useState(0);
  const [gameHistory, setGameHistory] = useState<Array<{ result: 'win' | 'lose'; multiplier: number; betAmount: number; profit: number }>>([]);

  const quickBets = [25, 50, 100, 250, 500, 1000];
  const mineOptions = [1, 3, 5, 7, 10, 15, 20, 24];
  const maxBet = Math.min(5000, playerStats.chips);

  // Initialize game board
  const initializeBoard = () => {
    const newBoard: GameCell[][] = [];
    const mines = new Set<string>();
    
    // Place mines randomly
    while (mines.size < mineCount) {
      const row = Math.floor(Math.random() * 5);
      const col = Math.floor(Math.random() * 5);
      mines.add(`${row}-${col}`);
    }
    
    // Create board
    for (let row = 0; row < 5; row++) {
      const boardRow: GameCell[] = [];
      for (let col = 0; col < 5; col++) {
        boardRow.push({
          state: 'hidden',
          isMine: mines.has(`${row}-${col}`),
          isRevealed: false
        });
      }
      newBoard.push(boardRow);
    }
    
    setGameBoard(newBoard);
  };

  // Calculate multiplier based on revealed gems and mine count
  const calculateMultiplier = (gems: number) => {
    const totalCells = 25;
    const safeCells = totalCells - mineCount;
    if (gems === 0) return 1;
    
    // Progressive multiplier calculation
    let multiplier = 1;
    for (let i = 1; i <= gems; i++) {
      multiplier *= (safeCells - i + 1) / (safeCells - i + 1 - 0.1);
    }
    return Math.max(1, multiplier);
  };

  // Start new game
  const startGame = () => {
    if (betAmount > playerStats.chips) {
      toast.error("Insufficient chips!");
      return;
    }
    
    initializeBoard();
    setIsPlaying(true);
    setRevealedGems(0);
    setCurrentMultiplier(1);
    
    // Deduct bet amount
    onUpdateStats({
      chips: playerStats.chips - betAmount
    });
  };

  // Reveal cell
  const revealCell = (row: number, col: number) => {
    if (!isPlaying || gameBoard[row][col].isRevealed) return;
    
    const newBoard = [...gameBoard];
    newBoard[row][col].isRevealed = true;
    
    if (newBoard[row][col].isMine) {
      // Game over - hit mine
      newBoard[row][col].state = 'mine';
      setGameBoard(newBoard);
      setIsPlaying(false);
      
      // Show all mines
      setTimeout(() => {
        const finalBoard = [...newBoard];
        finalBoard.forEach((boardRow, r) => {
          boardRow.forEach((cell, c) => {
            if (cell.isMine) {
              finalBoard[r][c].state = 'mine';
              finalBoard[r][c].isRevealed = true;
            }
          });
        });
        setGameBoard(finalBoard);
      }, 500);
      
      setGameHistory(prev => [{ result: 'lose', multiplier: 0, betAmount, profit: -betAmount }, ...prev.slice(0, 9)]);
      toast.error(`Mine exploded! Lost ${betAmount} chips`);
      
      // Update stats
      onUpdateStats({
        gamesPlayed: playerStats.gamesPlayed + 1
      });
    } else {
      // Safe cell - found gem
      newBoard[row][col].state = 'gem';
      const newGemsCount = revealedGems + 1;
      const newMultiplier = calculateMultiplier(newGemsCount);
      
      setGameBoard(newBoard);
      setRevealedGems(newGemsCount);
      setCurrentMultiplier(newMultiplier);
      
      toast.success(`Found gem! Multiplier: ${newMultiplier.toFixed(2)}x`);
    }
  };

  // Cash out
  const cashOut = () => {
    if (!isPlaying || revealedGems === 0) return;
    
    const winAmount = Math.floor(betAmount * currentMultiplier);
    const profit = winAmount - betAmount;
    
    setIsPlaying(false);
    
    // Update player stats
    onUpdateStats({
      chips: playerStats.chips + winAmount,
      gamesPlayed: playerStats.gamesPlayed + 1,
      gamesWon: playerStats.gamesWon + 1,
      experience: playerStats.experience + Math.floor(profit / 10)
    });
    
    setGameHistory(prev => [{ result: 'win', multiplier: currentMultiplier, betAmount, profit }, ...prev.slice(0, 9)]);
    toast.success(`Cashed out ${winAmount} chips! (+${profit})`);
  };

  const getCellContent = (cell: GameCell) => {
    if (!cell.isRevealed) {
      return <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-700 rounded border border-slate-500" />;
    }
    
    if (cell.state === 'mine') {
      return (
        <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-700 rounded flex items-center justify-center">
          <Bomb className="w-6 h-6 text-white" />
        </div>
      );
    }
    
    if (cell.state === 'gem') {
      return (
        <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-600 rounded flex items-center justify-center">
          <Diamond className="w-6 h-6 text-white" />
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-yellow-900 relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-yellow-500/20">
        <Button
          onClick={onBack}
          variant="ghost"
          className="text-white hover:bg-yellow-500/20"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lobby
        </Button>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
          Mines
        </h1>
        <div className="text-right">
          <p className="text-lg font-semibold text-white">{playerStats.chips.toLocaleString()} chips</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)]">
        {/* Game Board */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md">
            <div className="grid grid-cols-5 gap-2 mb-6 bg-slate-800/50 p-4 rounded-lg border border-yellow-500/20">
              {gameBoard.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => revealCell(rowIndex, colIndex)}
                    disabled={!isPlaying || cell.isRevealed}
                    className="w-12 h-12 hover:scale-105 transition-transform disabled:cursor-not-allowed"
                  >
                    {getCellContent(cell)}
                  </button>
                ))
              )}
            </div>
            
            {isPlaying && revealedGems > 0 && (
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-yellow-400 mb-2">
                  {currentMultiplier.toFixed(2)}x
                </div>
                <Button
                  onClick={cashOut}
                  className="casino-button text-lg px-8 py-3"
                >
                  Cash Out ({Math.floor(betAmount * currentMultiplier)} chips)
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Control Panel */}
        <div className="lg:w-80 p-6 bg-slate-800/50 backdrop-blur-sm border-l border-yellow-500/20">
          {/* Game Controls */}
          <Card className="casino-card p-4 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Game Setup</h3>
            
            {/* Bet Amount */}
            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">Bet Amount</label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, Math.min(maxBet, parseInt(e.target.value) || 1)))}
                disabled={isPlaying}
                className="w-full bg-slate-700 text-white text-center py-2 rounded border border-yellow-500/30 focus:border-yellow-400"
              />
              <div className="grid grid-cols-3 gap-1 mt-2">
                {quickBets.map((amount) => (
                  <Button
                    key={amount}
                    onClick={() => setBetAmount(amount)}
                    disabled={isPlaying}
                    variant="outline"
                    size="sm"
                    className="border-yellow-500/50 text-yellow-400 text-xs"
                  >
                    {amount}
                  </Button>
                ))}
              </div>
            </div>

            {/* Mine Count */}
            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">Mines ({mineCount})</label>
              <div className="grid grid-cols-4 gap-1">
                {mineOptions.map((count) => (
                  <Button
                    key={count}
                    onClick={() => setMineCount(count)}
                    disabled={isPlaying}
                    variant={mineCount === count ? "default" : "outline"}
                    size="sm"
                    className={mineCount === count ? "casino-button text-xs" : "border-yellow-500/50 text-yellow-400 text-xs"}
                  >
                    {count}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={startGame}
              disabled={isPlaying}
              className="w-full casino-button text-lg py-3 mb-4"
            >
              <Pickaxe className="w-4 h-4 mr-2" />
              Start Mining ({betAmount} chips)
            </Button>

            {isPlaying && (
              <div className="text-center text-sm text-slate-400">
                <p>Gems found: {revealedGems}</p>
                <p>Current multiplier: {currentMultiplier.toFixed(2)}x</p>
              </div>
            )}
          </Card>

          {/* Game History */}
          <Card className="casino-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Recent Games</h3>
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
                    <span className={`text-sm font-semibold ${game.result === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                      {game.result === 'win' ? '✓' : '✗'}
                    </span>
                    <span className="text-yellow-400 font-semibold text-sm">
                      {game.multiplier > 0 ? `${game.multiplier.toFixed(2)}x` : 'BOOM'}
                    </span>
                    <span className="text-slate-400 text-xs">
                      (bet: {game.betAmount})
                    </span>
                  </div>
                  <span className={`font-semibold text-sm ${game.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {game.profit > 0 ? '+' : ''}{game.profit}
                  </span>
                </div>
              ))}
              {gameHistory.length === 0 && (
                <p className="text-slate-400 text-center py-4 text-sm">No games played yet</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MinesGame;
