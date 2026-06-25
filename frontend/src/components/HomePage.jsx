import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from './ui'
import {
  getStats,
  levelFromXp,
  effectiveStreak,
  autoCheckBadges,
  BADGES,
} from '../lib/game'

function weakestTheme() {
  try {
    const hist = JSON.parse(localStorage.getItem('practiceHistory') || '[]')
    if (!hist.length) return null
    const map = {}
    hist.forEach((r) => {
      const key = r.theme
      if (!map[key]) map[key] = { sum: 0, n: 0 }
      map[key].sum += r.percentage
      map[key].n += 1
    })
    let worst = null
    Object.entries(map).forEach(([k, v]) => {
      const avg = Math.round(v.sum / v.n)
      if (!worst || avg < worst.avg) worst = { theme: k, avg }
    })
    return worst
  } catch {
    return null
  }
}

function StatPill({ icon, value, label }) {
  return (
    <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3 flex-1 min-w-0">
      <span className="text-2xl">{icon}</span>
      <div className="min-w-0">
        <div className="text-xl font-black text-white leading-none">{value}</div>
        <div className="text-[11px] text-slate-400 truncate">{label}</div>
      </div>
    </div>
  )
}

export default function HomePage({ setCurrentPage }) {
  const [stats, setStats] = useState(getStats())
  const [weak, setWeak] = useState(null)
  const [totalQuizzes, setTotalQuizzes] = useState(0)

  useEffect(() => {
    autoCheckBadges()
    setStats(getStats())
    setWeak(weakestTheme())
    try {
      const hist = JSON.parse(localStorage.getItem('practiceHistory') || '[]')
      setTotalQuizzes(hist.length)
    } catch {
      // ignore
    }
  }, [])

  const lvl = levelFromXp(stats.xp)
  const streak = effectiveStreak(stats)
  const unlocked = stats.badges

  const menu = [
    { id: 'study', title: '開始學習', desc: '分級課程與單字記憶', icon: '📖', tone: 'from-neon-violet/20' },
    { id: 'listening', title: '原速聽力', desc: '聽母語語速例句作答', icon: '🎧', tone: 'from-neon-cyan/20' },
    { id: 'sentence', title: '組句練習', desc: '打散重組正確句子', icon: '🧩', tone: 'from-neon-magenta/20' },
    { id: 'mistakes', title: '錯題本', desc: '強化弱點＋AI 助記故事', icon: '📝', tone: 'from-orange-400/20' },
    { id: 'history', title: '練習記錄', desc: '查看過往成績與進度', icon: '📊', tone: 'from-emerald-400/20' },
  ]

  return (
    <div className="space-y-7">
      <div className="text-center pt-4 pb-1">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-display font-bold tracking-tight"
        >
          準備好<span className="text-grad">升級</span>了嗎？
        </motion.h2>
        <p className="text-slate-400 mt-2">AI 助教隨時為你出題</p>
      </div>

      <Card glow className="p-6 border-grad overflow-hidden relative">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-neon-purple/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-grad-purple flex items-center justify-center text-2xl font-black text-white shadow-glow-purple">
                {lvl.level}
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Level</div>
                <div className="text-lg font-black text-white">
                  {lvl.level >= 5 ? '學霸 👑' : `Lv.${lvl.level}`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.span className={`text-3xl ${streak > 0 ? 'animate-flame' : 'grayscale opacity-50'}`}>
                🔥
              </motion.span>
              <div>
                <div className="text-2xl font-black text-white leading-none">{streak}</div>
                <div className="text-[11px] text-slate-400">天連續</div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-neon-violet font-bold">{stats.xp} XP</span>
              <span className="text-slate-500">距 Lv.{lvl.level + 1} 還差 {Math.max(0, lvl.nextNeed - stats.xp)} XP</span>
            </div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${lvl.progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-grad-neon shadow-glow-cyan"
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="flex gap-3">
        <StatPill icon="✅" value={totalQuizzes} label="完成測驗" />
        <StatPill icon="🏅" value={`${unlocked.length}/${BADGES.length}`} label="徽章" />
      </div>

      {weak && (
        <Card className="p-5 flex items-center gap-4">
          <span className="text-3xl">🎯</span>
          <div className="flex-1">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">弱點提醒</div>
            <div className="text-white font-semibold">
              「{weak.theme}」平均 {weak.avg}% —— 建議加強
            </div>
          </div>
        </Card>
      )}

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-white">🏆 成就徽章</h3>
          <span className="text-xs text-slate-500">已解鎖 {unlocked.length} / {BADGES.length}</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {BADGES.map((b) => {
            const got = unlocked.includes(b.id)
            return (
              <motion.div
                key={b.id}
                whileHover={{ scale: 1.08 }}
                title={`${b.name}：${b.desc}`}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 text-center transition-all ${
                  got
                    ? 'bg-grad-purple/20 border border-neon-violet/30 shadow-glow-soft'
                    : 'bg-white/[0.03] border border-white/5'
                }`}
              >
                <span className={`text-2xl ${got ? '' : 'grayscale opacity-30'}`}>{b.icon}</span>
                <span className={`text-[9px] font-bold leading-tight px-1 ${got ? 'text-neon-violet' : 'text-slate-600'}`}>
                  {b.name}
                </span>
              </motion.div>
            )
          })}
        </div>
      </Card>

      <div className="grid gap-4">
        {menu.map((item, i) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.02, x: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCurrentPage(item.id)}
            className={`group glass rounded-3xl p-5 flex items-center gap-5 text-left hover:shadow-glow-soft transition-all bg-gradient-to-r ${item.tone} to-transparent`}
          >
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              {item.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">{item.title}</h3>
              <p className="text-slate-400 text-sm">{item.desc}</p>
            </div>
            <span className="text-slate-600 group-hover:text-neon-violet group-hover:translate-x-1 transition-all">→</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
