// ============ 遊戲化系統 ============
// gameStats = { xp, lastActiveDate, streak, badges: [id...] }

const KEY = 'gameStats'

const DEFAULT_STATS = {
  xp: 0,
  streak: 0,
  lastActiveDate: null, // 'YYYY-MM-DD'
  badges: [],
}

export const XP_PER_CORRECT = 10
export const XP_ROUND_BONUS = 30
export const XP_LISTENING = 8
export const XP_SENTENCE = 12

export function levelFromXp(xp) {
  // L1: 0, L2: 100, L3: 250, L4: 450... (每級間距 +50)
  let level = 1
  let need = 0
  let step = 100
  while (xp >= need + step) {
    need += step
    step += 50
    level += 1
  }
  const currentBase = need
  const nextNeed = need + step
  return {
    level,
    currentBase,
    nextNeed,
    intoLevel: xp - currentBase,
    levelSpan: step,
    progress: Math.min(100, Math.round(((xp - currentBase) / step) * 100)),
  }
}

export const BADGES = [
  { id: 'first_step', icon: '🌱', name: '初出茅廬', desc: '完成第一次測驗' },
  { id: 'streak_3', icon: '🔥', name: '三日不斷', desc: '連續學習 3 天' },
  { id: 'streak_7', icon: '⚡', name: '一週戰士', desc: '連續學習 7 天' },
  { id: 'perfect', icon: '🎯', name: '完美一回', desc: '單回測驗 100%' },
  { id: 'xp_500', icon: '💎', name: '經驗豐富', desc: '累積 500 XP' },
  { id: 'listener', icon: '🎧', name: '聽力達人', desc: '完成原速聽力練習' },
  { id: 'builder', icon: '🧩', name: '組句高手', desc: '完成組句練習' },
  { id: 'scholar', icon: '👑', name: '學霸', desc: '達到等級 5' },
]

function today() {
  return new Date().toISOString().slice(0, 10)
}

function daysBetween(a, b) {
  const da = new Date(a + 'T00:00:00')
  const db = new Date(b + 'T00:00:00')
  return Math.round((db - da) / 86400000)
}

export function getStats() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null')
    return { ...DEFAULT_STATS, ...(raw || {}) }
  } catch {
    return { ...DEFAULT_STATS }
  }
}

function save(stats) {
  localStorage.setItem(KEY, JSON.stringify(stats))
}

export function touchStreak() {
  const stats = getStats()
  const t = today()
  if (stats.lastActiveDate === t) return stats
  if (stats.lastActiveDate) {
    const gap = daysBetween(stats.lastActiveDate, t)
    if (gap === 1) stats.streak += 1
    else if (gap > 1) stats.streak = 1
  } else {
    stats.streak = 1
  }
  stats.lastActiveDate = t
  save(stats)
  return stats
}

export function effectiveStreak(stats) {
  if (!stats.lastActiveDate) return 0
  const gap = daysBetween(stats.lastActiveDate, today())
  if (gap <= 0) return stats.streak
  if (gap === 1) return stats.streak
  return 0
}

export function addXp(amount) {
  const stats = getStats()
  const before = levelFromXp(stats.xp).level
  stats.xp += amount
  const after = levelFromXp(stats.xp).level
  save(stats)
  return { stats, leveledUp: after > before, fromLevel: before, toLevel: after }
}

export function unlockBadges(ids) {
  const stats = getStats()
  const newly = []
  for (const id of ids) {
    if (!stats.badges.includes(id)) {
      stats.badges.push(id)
      newly.push(id)
    }
  }
  if (newly.length) save(stats)
  return newly
}

export function autoCheckBadges() {
  const stats = getStats()
  const eff = effectiveStreak(stats)
  const lvl = levelFromXp(stats.xp).level
  const toUnlock = []
  if (eff >= 3) toUnlock.push('streak_3')
  if (eff >= 7) toUnlock.push('streak_7')
  if (stats.xp >= 500) toUnlock.push('xp_500')
  if (lvl >= 5) toUnlock.push('scholar')
  return unlockBadges(toUnlock)
}
