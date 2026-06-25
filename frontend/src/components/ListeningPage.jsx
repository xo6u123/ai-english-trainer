import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api, THEMES, themeName } from '../lib/api'
import { Card, BackBtn, PrimaryButton, Loader, speak } from './ui'
import {
  touchStreak,
  addXp,
  unlockBadges,
  autoCheckBadges,
  XP_LISTENING,
} from '../lib/game'

const NATIVE_RATE = 1.0

export default function ListeningPage({ setCurrentPage }) {
  const [stage, setStage] = useState('pick')
  const [theme, setTheme] = useState(null)
  const [lesson, setLesson] = useState(1)
  const [words, setWords] = useState([])
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)

  const start = async (themeId) => {
    setTheme(themeId)
    setStage('loading')
    try {
      const resp = await api.post('/generate-vocab', { theme: themeId, lesson })
      const ws = resp.data.words || []
      setWords(ws)
      setIdx(0)
      setSelected(null)
      setRevealed(false)
      setCorrectCount(0)
      setStage('quiz')
      setTimeout(() => playCurrent(ws[0]), 400)
    } catch (e) {
      console.error(e)
      if (e.response && e.response.status === 404) {
        alert('請先去「開始學習」生成這一課的單字表喔！')
        setStage('pick')
      } else {
        alert('載入失敗，請稍後再試')
        setStage('pick')
      }
    }
  }

  const playCurrent = (w) => {
    const word = w || words[idx]
    if (!word) return
    speak(word.example.replace('___', word.word), NATIVE_RATE)
  }

  const reveal = () => {
    const w = words[idx]
    const isCorrect = selected === w.correctIndex
    if (isCorrect) {
      setCorrectCount((c) => c + 1)
      addXp(XP_LISTENING)
    }
    setRevealed(true)
  }

  const next = () => {
    if (idx + 1 >= words.length) {
      touchStreak()
      unlockBadges(['listener'])
      autoCheckBadges()
      setStage('done')
      return
    }
    const ni = idx + 1
    setIdx(ni)
    setSelected(null)
    setRevealed(false)
    setTimeout(() => playCurrent(words[ni]), 350)
  }

  if (stage === 'pick') {
    return (
      <div className="space-y-6">
        <BackBtn onClick={() => setCurrentPage('home')} label="返回首頁" />
        <Card className="p-7">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🎧</span>
            <h2 className="text-2xl font-display font-bold text-white">原速聽力</h2>
          </div>
          <p className="text-slate-400 text-sm mb-6">以母語者語速播放例句，聽完後選出正確的單字。</p>
          <div className="flex items-center justify-center gap-4 mb-6">
            <button onClick={() => setLesson((l) => Math.max(1, l - 1))} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 font-bold text-slate-300">◀</button>
            <div className="text-center">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Lesson</div>
              <div className="text-2xl font-black text-grad">{lesson}</div>
            </div>
            <button onClick={() => setLesson((l) => l + 1)} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 font-bold text-slate-300">▶</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {THEMES.map((t) => (
              <motion.button
                key={t.id}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => start(t.id)}
                className="p-6 rounded-2xl glass hover:shadow-glow-soft border border-white/5 hover:border-neon-cyan/30 transition-all"
              >
                <div className="text-4xl mb-2">{t.emoji}</div>
                <div className="font-bold text-white">{t.name}</div>
              </motion.button>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  if (stage === 'loading') return <Loader icon="🎧" label={`AI 準備聽力題 (Lesson ${lesson})...`} />

  if (stage === 'done') {
    return (
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <Card glow className="p-10 border-grad text-center">
          <div className="text-7xl mb-4">🎧</div>
          <h2 className="text-3xl font-display font-black text-white mb-2">聽力完成！</h2>
          <div className="text-6xl font-black text-grad my-6">{correctCount}/{words.length}</div>
          <p className="text-neon-cyan text-sm mb-6 font-bold">+{correctCount * XP_LISTENING} XP • 解鎖「聽力達人」🎧</p>
          <PrimaryButton onClick={() => setStage('pick')}>再來一輪</PrimaryButton>
          <button onClick={() => setCurrentPage('home')} className="mt-3 text-sm text-slate-400 hover:text-white transition-colors">返回首頁</button>
        </Card>
      </motion.div>
    )
  }

  const w = words[idx]
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BackBtn onClick={() => setStage('pick')} label="退出" />
        <div className="text-sm font-display font-bold text-grad">🎧 {themeName(theme)} L{lesson}</div>
        <div className="text-sm text-slate-500 font-bold">{idx + 1}/{words.length}</div>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div animate={{ width: `${((idx + 1) / words.length) * 100}%` }} className="h-full bg-grad-cyan shadow-glow-cyan" />
      </div>
      <Card className="p-8 text-center">
        <p className="text-slate-400 text-sm mb-6">點擊播放，聽出缺少的單字</p>
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => playCurrent()}
          className="mx-auto w-24 h-24 rounded-full bg-grad-cyan flex items-center justify-center text-4xl shadow-glow-cyan mb-3"
        >🔊</motion.button>
        <button onClick={() => playCurrent()} className="text-xs text-neon-cyan/80 hover:text-neon-cyan mb-6">重新播放</button>

        {revealed && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg font-bold text-white mb-6">
            {w.example.split('___').map((part, i) => (
              <span key={i}>
                {part}
                {i === 0 && <span className="mx-1 text-neon-cyan underline">{w.word}</span>}
              </span>
            ))}
          </motion.p>
        )}

        <div className="grid gap-3 text-left">
          {w.options.map((opt, oi) => (
            <motion.button
              key={oi}
              whileHover={!revealed ? { x: 4 } : {}}
              onClick={() => !revealed && setSelected(oi)}
              className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                revealed
                  ? oi === w.correctIndex
                    ? 'border-emerald-400 bg-emerald-400/10 shadow-glow-cyan'
                    : oi === selected
                    ? 'border-rose-400 bg-rose-400/10'
                    : 'border-white/5 opacity-40'
                  : selected === oi
                  ? 'border-neon-cyan bg-neon-cyan/10 shadow-glow-soft'
                  : 'border-white/10 hover:border-white/25'
              }`}
            >
              <span className="font-bold text-lg text-white">{opt.word}</span>
              {revealed && <span className="text-sm text-slate-400">{opt.chinese}</span>}
            </motion.button>
          ))}
        </div>

        <PrimaryButton onClick={revealed ? next : reveal} disabled={selected === null} className="mt-7">
          {revealed ? (idx + 1 >= words.length ? '看結果 →' : '下一題 →') : '確認答案'}
        </PrimaryButton>
      </Card>
    </div>
  )
}
