import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../lib/api'
import { Card, SpeakerBtn, BackBtn, Tag } from './ui'

export default function MistakesPage({ setCurrentPage }) {
  const [data, setData] = useState([])
  const [expandedIndex, setExpandedIndex] = useState(null)
  const [story, setStory] = useState(null)
  const [loadingStory, setLoadingStory] = useState(false)

  useEffect(() => {
    setData(JSON.parse(localStorage.getItem('mistakes') || '[]').reverse())
  }, [])

  const clearMistakes = () => {
    if (confirm('確定清空？')) {
      localStorage.removeItem('mistakes')
      setData([])
      setStory(null)
    }
  }

  const generateStory = async () => {
    if (data.length < 2) {
      alert('請至少累積 2 個錯題再來生成故事喔！')
      return
    }
    const targetWords = data.slice(0, 5).map((m) => m.word)
    setLoadingStory(true)
    try {
      const res = await api.post('/generate-story', { words: targetWords })
      setStory(res.data)
    } catch {
      alert('故事生成失敗')
    } finally {
      setLoadingStory(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <BackBtn onClick={() => setCurrentPage('home')} />
        {data.length > 0 && (
          <button onClick={clearMistakes} className="text-xs text-slate-500 hover:text-rose-400 transition-colors">
            清空記錄
          </button>
        )}
      </div>

      {data.length > 0 && (
        <Card glow className="p-6 border-grad relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-400/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <h3 className="text-lg font-display font-bold text-white mb-2 flex items-center gap-2">
              📖 魔法記憶故事
              {!loadingStory && !story && <Tag tone="magenta">AI 幫你串連記憶</Tag>}
            </h3>
            {!story ? (
              <div className="text-center py-4">
                <p className="text-sm text-slate-400 mb-4">將你的錯字變成一篇有趣的故事，幫你快速記憶！</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={generateStory}
                  disabled={loadingStory}
                  className="bg-grad-magenta text-white px-6 py-2.5 rounded-full font-bold shadow-glow-purple disabled:opacity-50 transition-all"
                >
                  {loadingStory ? 'AI 作家中...' : '✨ 生成助記故事'}
                </motion.button>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="glass-strong p-4 rounded-xl border border-neon-magenta/20">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-neon-magenta">English Story</h4>
                    <SpeakerBtn text={story.english_story} />
                  </div>
                  <p className="text-slate-100 leading-relaxed font-medium">{story.english_story}</p>
                </div>
                <div className="glass p-4 rounded-xl">
                  <h4 className="font-bold text-slate-400 text-sm mb-1">中文翻譯</h4>
                  <p className="text-slate-300 text-sm">{story.chinese_translation}</p>
                </div>
                <button
                  onClick={() => setStory(null)}
                  className="text-xs text-neon-magenta/70 hover:text-neon-magenta w-full text-center transition-colors"
                >
                  重新生成
                </button>
              </motion.div>
            )}
          </div>
        </Card>
      )}

      <Card className="p-6 min-h-[300px]">
        <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2 text-white">
          📝 錯題筆記
          <Tag tone="magenta">{data.length}</Tag>
        </h2>
        {data.length === 0 ? (
          <div className="text-center py-16 text-slate-500">目前沒有錯題，太強了！🎉</div>
        ) : (
          <div className="space-y-4">
            {data.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 glass rounded-2xl border border-white/5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xl font-black text-white">{m.word}</span>
                  <SpeakerBtn text={m.word} />
                  <Tag tone="slate">{m.pos}</Tag>
                  <span className="text-slate-300 font-medium">{m.definition}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {m.themeName} • {new Date(m.date).toLocaleDateString()}
                </div>
                <div className="mt-3 text-sm text-slate-300 italic glass-strong p-2.5 rounded-lg flex justify-between items-center gap-2">
                  <span>"{m.example}"</span>
                  <SpeakerBtn text={m.example} />
                </div>
                <div className="mt-3 flex gap-4 text-xs font-bold">
                  <span className="text-rose-400">你的答案：{m.userAnswer}</span>
                  <span className="text-emerald-400">正確答案：{m.correctAnswer}</span>
                </div>
                <button
                  onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                  className="mt-4 w-full py-2 text-xs text-neon-violet font-bold bg-neon-violet/10 rounded-lg hover:bg-neon-violet/20 transition-colors"
                >
                  {expandedIndex === i ? '收起選項詳解 ▲' : '查看完整選項解析 ▼'}
                </button>
                <AnimatePresence>
                  {expandedIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 grid gap-2 pt-3 border-t border-white/5">
                        {m.options && m.options.map((opt, oid) => (
                          <div
                            key={oid}
                            className={`flex items-center justify-between p-2.5 rounded-lg text-sm ${
                              opt.word === m.correctAnswer
                                ? 'bg-emerald-400/10 border border-emerald-400/20'
                                : 'bg-white/[0.03] border border-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{opt.word}</span>
                              <SpeakerBtn text={opt.word} />
                              <span className="text-slate-500 text-xs">{opt.pos}</span>
                            </div>
                            <div className="text-slate-400">{opt.chinese}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
