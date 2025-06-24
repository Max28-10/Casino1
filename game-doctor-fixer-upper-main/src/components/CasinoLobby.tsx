import { Dice1, Spade, Target, Coins, Trophy, Users, Settings, Zap, Pickaxe } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface CasinoLobbyProps {
  onSelectGame: (game: 'blackjack' | 'roulette' | 'slots' | 'plinko' | 'mines') => void;
  playerStats: {
    chips: number;
    level: number;
    experience: number;
    gamesWon: number;
    gamesPlayed: number;
  };
}

const CasinoLobby = ({ onSelectGame, playerStats }: CasinoLobbyProps) => {
  const games = [
    {
      id: 'blackjack',
      name: 'Blackjack',
      description: 'Classic 21 with strategy hints and card counting training',
      icon: Spade,
      minBet: 25,
      maxBet: 5000,
      players: '1-7',
      difficulty: 'Medium'
    },
    {
      id: 'roulette',
      name: 'Roulette',
      description: 'European roulette with realistic physics and betting options',
      icon: Target,
      minBet: 5,
      maxBet: 2500,
      players: '1-8',
      difficulty: 'Easy'
    },
    {
      id: 'slots',
      name: 'Slot Machine',
      description: 'Modern 5-reel slots with progressive jackpots and bonus rounds',
      icon: Coins,
      minBet: 1,
      maxBet: 100,
      players: '1',
      difficulty: 'Easy'
    },
    {
      id: 'plinko',
      name: 'Plinko',
      description: 'Drop the ball and watch it bounce through pegs to win big multipliers',
      icon: Zap,
      minBet: 1,
      maxBet: 5000,
      players: '1',
      difficulty: 'Easy'
    },
    {
      id: 'mines',
      name: 'Mines',
      description: 'Find gems while avoiding mines in this thrilling risk vs reward game',
      icon: Pickaxe,
      minBet: 1,
      maxBet: 5000,
      players: '1',
      difficulty: 'Medium'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 relative z-10">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-emerald-400 to-yellow-400 bg-clip-text text-transparent mb-4">
          Elite Casino
        </h1>
        <p className="text-xl text-slate-300 max-w-2xl mx-auto">
          Experience the thrill of Las Vegas from anywhere. Train your skills, compete with friends, 
          and master the art of casino gaming in a safe, educational environment.
        </p>
      </div>

      {/* Player Info Banner */}
      <Card className="casino-card mb-8 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-2xl font-bold text-white">
              {playerStats.level}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Welcome, Player</h3>
              <p className="text-slate-400">Level {playerStats.level} • {playerStats.gamesWon}/{playerStats.gamesPlayed} Games Won</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">{playerStats.chips.toLocaleString()}</p>
              <p className="text-sm text-slate-400">Chips</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10">
                <Users className="w-4 h-4 mr-2" />
                Friends
              </Button>
              <Button variant="outline" size="sm" className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10">
                <Trophy className="w-4 h-4 mr-2" />
                Stats
              </Button>
              <Button variant="outline" size="sm" className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Game Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {games.map((game) => (
          <Card key={game.id} className="casino-card p-6 hover:glow-effect transition-all duration-300 cursor-pointer group">
            <div onClick={() => onSelectGame(game.id as any)}>
              <div className="flex items-center justify-between mb-4">
                <game.icon className="w-12 h-12 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                <div className="text-right">
                  <p className="text-sm text-slate-400">Difficulty</p>
                  <p className="text-emerald-400 font-semibold">{game.difficulty}</p>
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">{game.name}</h3>
              <p className="text-slate-300 mb-4 min-h-[3rem]">{game.description}</p>
              
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Bet Range:</span>
                  <span className="text-white">${game.minBet} - ${game.maxBet.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Players:</span>
                  <span className="text-white">{game.players}</span>
                </div>
              </div>
              
              <Button className="w-full casino-button group-hover:shadow-emerald-500/50">
                <Dice1 className="w-4 h-4 mr-2" />
                Play Now
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Coming Soon Games */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Coming Soon</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Poker', 'Baccarat', 'Crash', 'Dice'].map((game) => (
            <Card key={game} className="casino-card p-4 opacity-50">
              <div className="text-center">
                <div className="w-12 h-12 bg-slate-700 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Dice1 className="w-6 h-6 text-slate-500" />
                </div>
                <h4 className="font-semibold text-white">{game}</h4>
                <p className="text-xs text-slate-400 mt-1">Coming Soon</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 text-center text-slate-400 text-sm">
        <p>Elite Casino • Entertainment & Training Platform • No Real Money Required</p>
        <p className="mt-2">Play Responsibly • Educational Purpose Only</p>
      </div>
    </div>
  );
};

export default CasinoLobby;
