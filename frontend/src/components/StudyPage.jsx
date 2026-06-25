import { useState } from 'react'
import { motion } from 'framer-motion'
import { api, THEMES, themeName } from '../lib/api'
import { Card, SpeakerBtn, BackBtn, PrimaryButton, Tag, Loader } from './ui'

export default function StudyPage({ setCurrentPage }) {
  const [words, setWords] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState(null)
  const [currentLesson, setCurrentLesson] = useState(1)

  const fetchWords = async (themeId, lessonNum) => {
    setLoading(true)
    setWords([])
    try {
      const res = await api.post('/generate-study-list', { theme: themeId, lesson: lessonNum })
      setWords(res.data)
    } catch (e) {
      console.error(e)
      alert('生成單字失敗，請檢查網路或後端狀態')
    } finally {
      setLoading(false)
    }
  }

  const handleThemeSelect = (themeId) => {
    setSelectedTheme(themeId)
    setCurrentLesson(1)
    fetchWords(themeId, 1)
  }

  const changeLesson = (newLesson) => {
    if (newLesson < 1) return
    setCurrentLesson(newLesson)
    fetchWords(selectedTheme, newLesson)
  }

  const startQuiz = () => {
    localStorage.setItem('currentContext', JSON.stringify({ theme: selectedTheme, lesson: currentLesson }))
    setCurrentPage('vocab')
  }

  if (!selectedTheme) {
    return (
      <div className="space-y-6">
        <BackBtn onClick={() => setCurrentPage('home')} label="返回首頁" />
        <Card className="p-7">
          <h2 className="text-2xl font-display font-bold mb-6 text-white">選擇學習主題</h2>
          <div className="grid grid-cols-2 gap-4">
            {THEMES.map((t) => (
              <motion.button
                key={t.id}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleThemeSelect(t.id)}
                className="p-6 rounded-2xl glass hover:shadow-glow-soft border border-white/5 hover:border-neon-violet/30 transition-all"
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

  return (
    <div className="space-y-6">
      <div className="sticky top-[68px] z-40 -mx-2 px-2 py-2 space-y-3 bg-base-900/80 backdrop-blur-md">
        <div className="flex justify-between items-center">
          <BackBtn onClick={() => setSelectedTheme(null)} label="重選主題" />
          <div className="text-lg font-display font-black text-grad">{themeName(selectedTheme)}</div>
          <div className="w-20" />
        </div>
        <Card className="flex items-center justify-between p-2">
          <button
            onClick={() => changeLesson(currentLesson - 1)}
            disabled={currentLesson === 1 || loading}
            className="w-12 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 disabled:opacity-20 text-slate-300 font-bold"
          >◀</button>
          <div className="text-center">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Lesson</div>
            <div className="text-2xl font-black text-grad">{currentLesson}</div>
          </div>
          <button
            onClick={() => changeLesson(currentLesson + 1)}
            disabled={loading}
            className="w-12 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 disabled:opacity-20 text-slate-300 font-bold"
          >▶</button>
        </Card>
      </div>

      <Card className="p-6 min-h-[300px]">
        {loading ? (
          <Loader icon="⏳" label={`AI 正在編寫 Lesson ${currentLesson} 的教材...`} />
        ) : (
          <div className="divide-y divide-white/5">
            {words.map((w, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="py-5 flex gap-4 first:pt-0"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-neon-violet/15 text-neon-violet rounded-full flex items-center justify-center font-bold text-sm mt-1">
                  {i + 1}
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xl font-bold text-white">{w.word}</span>
                    <SpeakerBtn text={w.word} />
                    <Tag tone="slate">{w.pos}</Tag>
                    <span className="text-slate-300 font-medium">{w.chinese}</span>
                  </div>
                  <p className="text-sm text-slate-500">{w.definition}</p>
                  <div className="text-sm text-neon-cyan/90 bg-neon-cyan/5 border border-neon-cyan/10 p-3 rounded-xl mt-2 flex justify-between items-start gap-2">
                    <span className="flex-1 leading-relaxed">
                      <span className="font-bold mr-1 text-neon-cyan">Ex:</span>
                      {w.example}
                    </span>
                    <SpeakerBtn text={w.example} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {!loading && words.length > 0 && (
        <PrimaryButton onClick={startQuiz} className="sticky bottom-6 shadow-glow-purple">
          Lesson {currentLesson} 背好了，開始測驗！ →
        </PrimaryButton>
      )}
    </div>
  )
}
