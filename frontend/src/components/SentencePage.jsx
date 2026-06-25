import { useState, useRef } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { api, THEMES, themeName } from '../lib/api'
import { Card, BackBtn, PrimaryButton, Loader, speak } from './ui'
import {
  touchStreak,
  addXp,
  unlockBadges,
  autoCheckBadges,
  XP_SENTENCE,
} from '../lib/game'

function tokenize(sentence) {
  return sentence.trim().split(/\s+/).filter(Boolean)
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function SentencePage({ setCurrentPage }) {
  const [stage, setStage] = useState('pick')
  const [theme, setTheme] = useState(null)
  const [lesson, setLesson] = useState(1)
  const [items, setItems] = useState([])
  const [idx, setIdx] = useState(0)
  const [pool, setPool] = useState([])
  const [picked, setPicked] = useState([])
  const [checked, setChecked] = useState(false)
  const [correct, setCorrect] = useState(false)
  const [solvedCount, setSolvedCount] = useState(0)
  const [translations, setTranslations] = useState({})
  const draggingRef = useRef(false)

  const buildItem = (i, list) => {
    const it = list[i]
    const tokens = it.tokens.map((t, k) => ({ token: t, key: `${i}-${k}-${t}` }))
    setPool(shuffle(tokens))
    setPicked([])
    setChecked(false)
    setCorrect(false)
  }

  const start = async (themeId) => {
    setTheme(themeId)
    setStage('loading')
    try {
      const resp = await api.post('/generate-study-list', { theme: themeId, lesson })
      const list = (resp.data || [])
        .map((w) => w.example)
        .filter((ex) => ex && !ex.includes('___'))
        .map((ex) => ({ answer: ex.trim(), tokens: tokenize(ex) }))
        .filter((it) => it.tokens.length >= 4 && it.tokens.length <= 12)
        .slice(0, 8)

      if (list.length === 0) {
        alert('這一課暫無適合組句的例句，換個主題或 Lesson 試試')
        setStage('pick')
        return
      }
      setItems(list)
      setIdx(0)
      setSolvedCount(0)
      setTranslations({})
      buildItem(0, list)
      setStage('play')

      api
        .post('/translate-sentences', { sentences: list.map((it) => it.answer) })
        .then((r) => {
          const arr = r.data?.translations || []
          const map = {}
          arr.forEach((zh, i) => { if (zh) map[i] = zh })
          setTranslations(map)
        })
        .catch((err) => console.error('翻譯失敗（降級不顯示）', err))
    } catch (e) {
      console.error(e)
      alert('載入失敗，請稍後再試')
      setStage('pick')
    }
  }

  const pick = (item) => {
    if (checked) return
    setPicked((p) => [...p, item])
    setPool((p) => p.filter((x) => x.key !== item.key))
  }

  const unpick = (item) => {
    if (checked) return
    setPicked((p) => p.filter((x) => x.key !== item.key))
    setPool((p) => [...p, item])
  }

  const check = () => {
    const guess = picked.map((p) => p.token).join(' ')
    const ok = guess === items[idx].answer
    setCorrect(ok)
    setChecked(true)
    if (ok) {
      setSolvedCount((c) => c + 1)
      addXp(XP_SENTENCE)
      speak(items[idx].answer, 0.95)
    }
  }

  const next = () => {
    if (idx + 1 >= items.length) {
      touchStreak()
      unlockBadges(['builder'])
      autoCheckBadges()
      setStage('done')
      return
    }
    const ni = idx + 1
    setIdx(ni)
    buildItem(ni, items)
  }

  if (stage === 'pick') {
    return (
      <div className="space-y-6">
        <BackBtn onClick={() => setCurrentPage('home')} label="返回首頁" />
        <Card className="p-7">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🧩</span>
            <h2 className="text-2xl font-display font-bold text-white">組句練習</h2>
          </div>
          <p className="text-slate-400 text-sm mb-6">把打散的單字依序點選，重組成正確的句子，完成後自動朗讀。</p>
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
                className="p-6 rounded-2xl glass hover:shadow-glow-soft border border-white/5 hover:border-neon-magenta/30 transition-all"
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

  if (stage === 'loading') return <Loader icon="🧩" label={`AI 準備句子 (Lesson ${lesson})...`} />

  if (stage === 'done') {
    return (
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <Card glow className="p-10 border-grad text-center">
          <div className="text-7xl mb-4">🧩</div>
          <h2 className="text-3xl font-display font-black text-white mb-2">組句完成！</h2>
          <div className="text-6xl font-black text-grad my-6">{solvedCount}/{items.length}</div>
          <p className="text-neon-magenta text-sm mb-6 font-bold">+{solvedCount * XP_SENTENCE} XP • 解鎖「組句高手」🧩</p>
          <PrimaryButton onClick={() => setStage('pick')}>再來一輪</PrimaryButton>
          <button onClick={() => setCurrentPage('home')} className="mt-3 text-sm text-slate-400 hover:text-white transition-colors">返回首頁</button>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BackBtn onClick={() => setStage('pick')} label="退出" />
        <div className="text-sm font-display font-bold text-grad">🧩 {themeName(theme)} L{lesson}</div>
        <div className="text-sm text-slate-500 font-bold">{idx + 1}/{items.length}</div>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div animate={{ width: `${((idx + 1) / items.length) * 100}%` }} className="h-full bg-grad-magenta shadow-glow-purple" />
      </div>
      <Card className="p-7">
        <p className="text-slate-400 text-sm mb-4">依正確順序點選單字組成句子：</p>
        <Reorder.Group
          axis="x"
          as="div"
          values={picked}
          onReorder={setPicked}
          className={`min-h-[64px] rounded-2xl p-3 mb-5 flex flex-wrap gap-2 content-start border-2 border-dashed transition-colors ${
            checked
              ? correct
                ? 'border-emerald-400/50 bg-emerald-400/5'
                : 'border-rose-400/50 bg-rose-400/5'
              : 'border-white/10 bg-white/[0.02]'
          }`}
        >
          {picked.length === 0 && (
            <span className="text-slate-600 text-sm self-center px-2">點下方單字開始排列…（拖曳可調整順序）</span>
          )}
          {picked.map((item) => (
            <Reorder.Item
              key={item.key}
              value={item}
              as="div"
              drag={!checked}
              layout
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
              onDragStart={() => { draggingRef.current = true }}
              onClick={() => {
                if (draggingRef.current) { draggingRef.current = false; return }
                unpick(item)
              }}
              className={`px-3 py-2 rounded-xl bg-grad-purple text-white font-semibold shadow-glow-soft select-none ${checked ? '' : 'cursor-grab touch-none'}`}
            >
              {item.token}
            </Reorder.Item>
          ))}
        </Reorder.Group>

        <div className="flex flex-wrap gap-2 mb-6 min-h-[48px]">
          <AnimatePresence>
            {pool.map((item) => (
              <motion.button
                key={item.key}
                layout
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => pick(item)}
                disabled={checked}
                className="px-3 py-2 rounded-xl glass border border-white/10 text-slate-100 font-semibold hover:border-neon-magenta/40 disabled:opacity-40"
              >
                {item.token}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {checked && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl mb-5 ${correct ? 'glass-strong border border-emerald-400/20' : 'glass-strong border border-rose-400/20'}`}
          >
            <div className="text-sm font-bold mb-1">
              {correct ? <span className="text-emerald-400">✅ 完全正確！</span> : <span className="text-rose-400">正確答案：</span>}
            </div>
            <p className="text-white">{items[idx].answer}</p>
            {translations[idx] && (
              <p className="text-slate-400 text-sm mt-2 pt-2 border-t border-white/10">🌐 {translations[idx]}</p>
            )}
          </motion.div>
        )}

        {!checked ? (
          <PrimaryButton onClick={check} disabled={pool.length > 0}>檢查答案</PrimaryButton>
        ) : (
          <PrimaryButton onClick={next}>{idx + 1 >= items.length ? '看結果 →' : '下一題 →'}</PrimaryButton>
        )}
      </Card>
    </div>
  )
}
