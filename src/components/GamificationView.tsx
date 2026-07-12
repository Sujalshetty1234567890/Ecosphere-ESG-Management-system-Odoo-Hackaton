import React, { useState, useEffect } from 'react';
import { 
  Trophy, Sparkles, Award, ShoppingBag, ListChecks, CheckCircle, 
  ChevronRight, RefreshCw, AlertCircle, CheckCircle2, User as UserIcon, HelpCircle 
} from 'lucide-react';
import { Challenge, ChallengeParticipation, Badge, Reward, RewardRedemption, LeaderboardEntry, User } from '../types';

interface GamificationViewProps {
  user: User;
  onRefreshStats: () => void;
  onUpdateUserLocal: (updates: Partial<User>) => void;
}

export default function GamificationView({ user, onRefreshStats, onUpdateUserLocal }: GamificationViewProps) {
  const [activeSub, setActiveSub] = useState<'challenges' | 'badges' | 'rewards' | 'leaderboard'>('challenges');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [joinedChallenges, setJoinedChallenges] = useState<ChallengeParticipation[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [unlockedBadges, setUnlockedBadges] = useState<any[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Sliders for active challenge progress
  const [challengeProgresses, setChallengeProgresses] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchGamificationData();
  }, [activeSub]);

  const fetchGamificationData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const [chalRes, badgesRes, rewardsRes, leaderRes, userBadgesRes, redRes] = await Promise.all([
        fetch('/api/challenges', { headers }),
        fetch('/api/badges', { headers }),
        fetch('/api/rewards', { headers }),
        fetch('/api/leaderboard', { headers }),
        fetch('/api/user-badges', { headers }),
        fetch('/api/rewards/redemptions', { headers })
      ]);

      if (chalRes.ok) setChallenges(await chalRes.json());
      if (badgesRes.ok) setBadges(await badgesRes.json());
      if (rewardsRes.ok) setRewards(await rewardsRes.json());
      if (leaderRes.ok) setLeaderboard(await leaderRes.json());
      if (userBadgesRes.ok) setUnlockedBadges(await userBadgesRes.json());
      if (redRes.ok) setRedemptions(await redRes.json());

      // Fetch specific user's challenge participations
      const dbParticipationsResponse = await fetch('/api/challenges/participations', { headers });
      if (dbParticipationsResponse.ok) {
        const parts: ChallengeParticipation[] = await dbParticipationsResponse.json();
        const userParts = parts.filter(p => p.userId === user.id);
        setJoinedChallenges(userParts);
        
        // Populate slider progress states
        const initialProgresses: { [key: string]: number } = {};
        userParts.forEach(p => {
          initialProgresses[p.challengeId] = p.progress;
        });
        setChallengeProgresses(initialProgresses);
      }
    } catch (err) {
      console.error('Failed to load gamification engine', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/challenges/${challengeId}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Join failed');
      
      setSuccess('Challenge joined successfully! Complete daily logs to update progress.');
      fetchGamificationData();
    } catch (err) {
      setError('Failed to register for challenge');
    }
  };

  const handleUpdateProgressSlider = (challengeId: string, progressValue: number) => {
    setChallengeProgresses(prev => ({ ...prev, [challengeId]: progressValue }));
  };

  const handleSaveProgress = async (challengeId: string) => {
    setError('');
    setSuccess('');
    const progress = challengeProgresses[challengeId] || 0;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/challenges/${challengeId}/progress`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ progress })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (progress === 100) {
        setSuccess('Outstanding! Challenge progress saved. Submission is now pending Admin validation.');
      } else {
        setSuccess('Challenge progress updated.');
      }
      
      // Since progress reaches 100, backend grants rewards instantly. Let's trigger a full user update
      const meResponse = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
      if (meResponse.ok) {
        const meData = await meResponse.json();
        onUpdateUserLocal(meData); // update header and sidebar instantly!
      }
      fetchGamificationData();
      onRefreshStats();
    } catch (err: any) {
      setError(err.message || 'Progress update failed');
    }
  };

  const handleRedeemReward = async (rewardId: string) => {
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/rewards/${rewardId}/redeem`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSuccess('Redemption order created successfully! Please visit standard collection zones.');
      
      // Update local points
      const meResponse = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
      if (meResponse.ok) {
        const meData = await meResponse.json();
        onUpdateUserLocal(meData);
      }
      fetchGamificationData();
    } catch (err: any) {
      setError(err.message || 'Insufficient points or out of stock');
    }
  };

  return (
    <div className="space-y-8" id="gamification-view-container">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-light text-slate-900 uppercase tracking-tight">Gamification & <span className="font-bold">Rewards</span></h1>
          <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase mt-1">Unlock badges, participate in green challenges, redeem eco-sustainable rewards, and top leaderboards</p>
        </div>
        <div className="bg-slate-900 border border-slate-900 px-4 py-2 rounded-none flex items-center space-x-3 text-sm text-white shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Available Points Balance:</span>
          <span className="font-mono font-bold text-teal-400 text-base">{user.balancePoints} PTS</span>
        </div>
      </div>

      {/* Selector Sub Menu */}
      <div className="flex border border-slate-200 space-x-1 p-1 bg-slate-50 rounded-none max-w-lg">
        <button
          onClick={() => { setActiveSub('challenges'); setError(''); setSuccess(''); }}
          className={`flex-1 py-2 px-3 rounded-none text-xs font-bold tracking-wider uppercase transition-all ${
            activeSub === 'challenges' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ListChecks className="h-4 w-4 inline mr-1.5" />
          Challenges
        </button>
        <button
          onClick={() => { setActiveSub('badges'); setError(''); setSuccess(''); }}
          className={`flex-1 py-2 px-3 rounded-none text-xs font-bold tracking-wider uppercase transition-all ${
            activeSub === 'badges' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="h-4 w-4 inline mr-1.5" />
          Badges
        </button>
        <button
          onClick={() => { setActiveSub('rewards'); setError(''); setSuccess(''); }}
          className={`flex-1 py-2 px-3 rounded-none text-xs font-bold tracking-wider uppercase transition-all ${
            activeSub === 'rewards' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShoppingBag className="h-4 w-4 inline mr-1.5" />
          Bazaar
        </button>
        <button
          onClick={() => { setActiveSub('leaderboard'); setError(''); setSuccess(''); }}
          className={`flex-1 py-2 px-3 rounded-none text-xs font-bold tracking-wider uppercase transition-all ${
            activeSub === 'leaderboard' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Trophy className="h-4 w-4 inline mr-1.5" />
          Leaderboard
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-none text-xs flex items-center space-x-2">
          <AlertCircle className="h-4.5 w-4.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-none text-xs flex items-center space-x-2">
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Tab: Challenges */}
      {activeSub === 'challenges' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {challenges.map((chal) => {
            const isJoined = joinedChallenges.some(p => p.challengeId === chal.id);
            const joinedRecord = joinedChallenges.find(p => p.challengeId === chal.id);
            const sliderVal = challengeProgresses[chal.id] !== undefined ? challengeProgresses[chal.id] : 0;
            return (
              <div key={chal.id} className="bg-white border border-slate-200 rounded-none p-6 flex flex-col justify-between h-85 shadow-sm text-slate-900">
                <div className="space-y-4">
                  {/* Flow Header Layout instead of Absolute Overlap Positioning */}
                  <div className="flex justify-between items-start gap-4">
                    <h4 className="font-display font-bold text-base text-slate-900 leading-tight uppercase tracking-tight flex-1">
                      {chal.title}
                    </h4>
                    <span className="shrink-0 px-2 py-1 bg-slate-900 text-[9px] uppercase font-bold text-emerald-400 font-mono tracking-wider whitespace-nowrap">
                      {chal.category} Class
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed font-medium">
                    {chal.description}
                  </p>
                  
                  <div className="flex items-center space-x-3">
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-none font-mono uppercase tracking-wider">
                      +{chal.xpReward} XP
                    </span>
                    <span className="text-[9px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-none font-mono uppercase tracking-wider">
                      +{chal.pointsReward} Points
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-200">
                  {isJoined ? (
                    joinedRecord?.status === 'under_review' ? (
                      <div className="text-center text-xs text-slate-500 font-bold py-2.5 bg-slate-50 border border-slate-200 rounded-none flex items-center justify-center space-x-1.5 uppercase tracking-wider">
                        <CheckCircle className="h-4 w-4 text-emerald-600 animate-pulse" />
                        <span>Awaiting Admin Approval</span>
                      </div>
                    ) : joinedRecord?.status === 'completed' ? (
                      <div className="text-center text-xs text-emerald-700 font-bold py-2.5 bg-emerald-50 border border-emerald-200 rounded-none flex items-center justify-center space-x-1.5 uppercase tracking-wider">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>Completed & Claimed</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          <span>Set Progress:</span>
                          <span className="font-mono text-slate-900 font-bold">{sliderVal}%</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={sliderVal}
                            onChange={(e) => handleUpdateProgressSlider(chal.id, Number(e.target.value))}
                            className="flex-1 accent-slate-900 h-1.5 bg-slate-100 rounded-none cursor-pointer"
                          />
                          <button
                            onClick={() => handleSaveProgress(chal.id)}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-none uppercase tracking-wider transition"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    )
                  ) : (
                    <button
                      onClick={() => handleJoinChallenge(chal.id)}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-none transition uppercase tracking-wider flex items-center justify-center space-x-1"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Accept Challenge</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Unlocked Badges */}
      {activeSub === 'badges' && (
        <div className="bg-white border border-slate-200 rounded-none p-6 shadow-sm text-slate-900">
          <h3 className="font-display font-bold text-lg text-slate-900 uppercase tracking-tight mb-6">Unlocked Corporate Badges Trophy room</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {badges.map((badge) => {
              const isUnlocked = unlockedBadges.some(ub => ub.badgeId === badge.id);
              return (
                <div 
                  key={badge.id}
                  className={`border rounded-none p-6 flex flex-col items-center justify-between text-center transition-all h-64 ${
                    isUnlocked 
                      ? 'bg-slate-50 border-amber-300 shadow-sm' 
                      : 'bg-slate-50/50 border-slate-200 opacity-50'
                  }`}
                >
                  <div className={`p-4 rounded-none border ${
                    isUnlocked 
                      ? 'bg-amber-50 border-amber-200 text-amber-600' 
                      : 'bg-slate-100 text-slate-400 border-slate-200'
                  }`}>
                    <Award className="h-8 w-8" />
                  </div>
                  <div className="space-y-1.5 mt-4">
                    <h4 className="text-sm font-bold text-slate-900 leading-tight uppercase tracking-tight">{badge.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-normal line-clamp-3 font-medium">{badge.description}</p>
                  </div>
                  <div className="mt-4 w-full">
                    {isUnlocked ? (
                      <div className="text-[9px] text-amber-700 font-mono font-bold uppercase tracking-wider bg-amber-50 px-2 py-1 rounded-none border border-amber-200">
                        Unlocked YTD
                      </div>
                    ) : (
                      <div className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider">
                        Locked ({badge.xpThreshold} XP Req)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Rewards Bazaar */}
      {activeSub === 'rewards' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h3 className="font-display font-bold text-lg text-slate-900 uppercase tracking-tight">Carbon-Offset Rewards Bazaar</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rewards.map((reward) => (
                <div key={reward.id} className="bg-white border border-slate-200 rounded-none p-6 flex flex-col justify-between h-56 relative overflow-hidden shadow-sm text-slate-900">
                  <div>
                    <div className="flex justify-between items-start mb-3 border-b border-slate-50 pb-2">
                      <span className="px-2 py-0.5 rounded-none bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-mono font-bold uppercase tracking-wider">
                        {reward.costPoints} points
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Stock: {reward.stock} left</span>
                    </div>
                    <h4 className="font-display font-bold text-sm text-slate-900 uppercase tracking-tight">{reward.title}</h4>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed font-medium">{reward.description}</p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => handleRedeemReward(reward.id)}
                      disabled={user.balancePoints < reward.costPoints || reward.stock <= 0}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 border border-transparent text-white text-xs font-bold rounded-none transition uppercase tracking-wider cursor-pointer"
                    >
                      {reward.stock <= 0 ? 'Out of stock' : user.balancePoints < reward.costPoints ? 'Insufficient points balance' : 'Redeem Eco-Reward'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Past Redemptions Drawer */}
          <div className="bg-white border border-slate-200 rounded-none p-6 h-fit shadow-sm text-slate-900">
            <h3 className="font-display font-bold text-md text-slate-900 mb-6 uppercase tracking-tight">Your Redemption logs</h3>
            <div className="space-y-4">
              {redemptions.map((red) => {
                const rew = rewards.find(r => r.id === red.rewardId);
                return (
                  <div key={red.id} className="p-3 bg-slate-50 border border-slate-200 rounded-none flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">{rew ? rew.title : 'Redemption order'}</h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono mt-0.5">{new Date(red.redeemedAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-none text-[9px] font-bold uppercase border ${
                      red.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      red.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {red.status}
                    </span>
                  </div>
                );
              })}
              {redemptions.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">No reward items redeemed yet</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Leaderboard */}
      {activeSub === 'leaderboard' && (
        <div className="bg-white border border-slate-200 rounded-none p-6 shadow-sm text-slate-900">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900 uppercase tracking-tight">Global Sustainability Hall of Fame</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-bold uppercase tracking-wider">Corporate ranking computed directly via aggregates XP levels</p>
            </div>
            <button onClick={fetchGamificationData} className="p-1.5 hover:bg-slate-100 rounded text-slate-500">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] text-slate-400 uppercase tracking-widest font-extrabold">
                  <th className="pb-3 pl-3">Rank</th>
                  <th className="pb-3">Sustainability Champion</th>
                  <th className="pb-3">Corporate Division</th>
                  <th className="pb-3 text-center">Achievements</th>
                  <th className="pb-3 text-right pr-3">Aggregated XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-900 font-medium">
                {leaderboard.map((entry) => (
                  <tr key={entry.userId} className={`hover:bg-slate-50/60 ${entry.userId === user.id ? 'bg-emerald-50/40 border-l-2 border-l-emerald-600' : ''}`}>
                    <td className="py-3.5 pl-3">
                      <span className={`font-mono font-bold text-xs inline-flex items-center justify-center h-6 w-6 rounded-none border ${
                        entry.rank === 1 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        entry.rank === 2 ? 'bg-slate-100 text-slate-600 border-slate-200' :
                        entry.rank === 3 ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        'bg-slate-50 text-slate-500 border-slate-100'
                      }`}>
                        #{entry.rank}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center space-x-2.5">
                        <span className="h-8 w-8 rounded-none bg-slate-900 flex items-center justify-center font-bold text-[11px] text-white">
                          {entry.userName.charAt(0)}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-900 uppercase tracking-tight">{entry.userName}</div>
                          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">{entry.userRole}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-500 uppercase tracking-tight font-semibold text-[11px]">{entry.departmentName}</td>
                    <td className="py-3.5 text-center font-semibold font-mono text-amber-700 uppercase tracking-wide">{entry.badgesCount} badges</td>
                    <td className="py-3.5 text-right pr-3 font-mono font-bold text-emerald-700">{entry.xp} XP</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}