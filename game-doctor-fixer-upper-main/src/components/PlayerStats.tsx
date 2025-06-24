
import { Trophy, TrendingUp, Star, Award } from 'lucide-react';
import { Card } from './ui/card';

interface PlayerStatsProps {
  stats: {
    chips: number;
    level: number;
    experience: number;
    gamesWon: number;
    gamesPlayed: number;
  };
}

const PlayerStats = ({ stats }: PlayerStatsProps) => {
  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;

  return (
    <div className="fixed top-4 right-4 z-50">
      <Card className="casino-card p-4 min-w-[200px]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
            {stats.level}
          </div>
          <div>
            <p className="text-white font-semibold">Level {stats.level}</p>
            <p className="text-xs text-slate-400">{stats.experience} XP</p>
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <Star className="w-3 h-3" />
              Chips
            </span>
            <span className="text-yellow-400 font-semibold">{stats.chips.toLocaleString()}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              Win Rate
            </span>
            <span className="text-emerald-400 font-semibold">{winRate}%</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Games
            </span>
            <span className="text-white font-semibold">{stats.gamesWon}/{stats.gamesPlayed}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PlayerStats;
