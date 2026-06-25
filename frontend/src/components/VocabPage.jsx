import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../lib/api'
import { Card, SpeakerBtn, PrimaryButton, Tag, Loader } from './ui'
import {
  touchStreak,
  addXp,
  unlockBadges,
  autoCheckBadges,
  XP_PER_CORRECT,
  XP_ROUND_BONUS,
} from '../lib/game'

export default function VocabPage({ setCurrentPage }) {
  const [quizData, setQuizData] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [score, setScore] = useState(0)
  const [mistakes, setMistakes] = useState([])
  const [loading, setLoading] = useState(true)
  const [context, setContext] = useState(null)
  const [xpFlash, setXpFlash] = useState(null)

  useEffect(() => {
    const ctxString = localStorage.getItem('currentContext')
    if (!ctxString) {
      alert('請先選擇主題')
      setCurrentPage('home')
      return
    }
    const ctx = JSON.parse(ctxString)
    setContext(ctx)
    startQuiz(ctx.theme, ctx.lesson)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startQuiz = async (theme, lesson) => {
    setLoading(true)
    try {
      const resp = await api.post('/generate-vocab', { theme, lesson })
      setQuizData(resp.data)
      setMistakes([])
    } catch (e) {
      console.error(e)
      if (e.response && e.response.status === 404) {
        alert('請先去「開始學習」生成這一課的單字表，才能進行測驗喔！')
        setCurrentPage('study')
      } else {
        alert('出題失敗，請稍後再試')
      }
    } finally {
      setLoading(false)
    }
  }

  const saveScore = () => {
    const history = JSON.parse(localStorage.getItem('practiceHistory') || '[]')
    history.push({
      theme: `${context.theme} (L${context.lesson})`,
      score,
      total: quizData.words.length,
      percentage: Math.round((score / quizData.words.length) * 100),
      date: new Date().toISOString(),
    })
    localStorage.setItem('practiceHistory', JSON.stringify(history))
  }

  const saveMistakes = () => {
    if (mistakes.length === 0) return
    const existing = JSON.parse(localStorage.getItem('mistakes') || '[]')
    const newMistakes = mistakes.map((m) => ({
      ...m,
      themeName: `${context.theme} (L${context.lesson})`,
      date: new Date().toISOString(),
    }))
    localStorage.setItem('mistakes', JSON.stringify([...existing, ...newMistakes]))
  }

  const finishRound = () => {
    saveScore()
    saveMistakes()
    touchStreak()
    addXp(XP_ROUND_BONUS)
    const newBadges = ['first_step']
    if (mistakes.length === 0 && quizData.words.length > 0) newBadges.push('perfect')
    unlockBadges(newBadges)
    autoCheckBadges()
    setCurrentPage('home')
  }

  const checkAnswer = async () => {
    const currentWord = quizData.words[currentQuestion]
    const isCorrect = selectedAnswer === currentWord.correctIndex

    if (isCorrect) {
      setScore((s) => s + 1)
      addXp(XP_PER_CORRECT)
      setXpFlash(`+${XP_PER_CORRECT} XP`)
      setTimeout(() => setXpFlash(null), 1200)
    } else {
      setMistakes((prev) => [
        ...prev,
        {
          word: currentWord.word,
          pos: currentWord.pos,
          definition: currentWord.definition,
          example: currentWord.example,
          userAnswer: currentWord.options[selectedAnswer].word,
          correctAnswer: currentWord.word,
          options: currentWord.options,
        },
      ])
    }

    setShowFeedback(true)
    try {
      const resp = await api.post('/check-answer', {
        userAnswer: currentWord.options[selectedAnswer].word,
        correctAnswer: currentWord.word,
        word: currentWord.word,
        example: currentWord.example,
      })
      setFeedback(resp.data.feedback)
    } catch {
      setFeedback(isCorrect ? '✅ 答對了！' : `❌ 正確答案是：${currentWord.word}`)
    }
  }

  if (loading || !quizData) {
    return <Loader label={`AI 老師正在出題 (Lesson ${context?.lesson})...`} />
  }

  if (currentQuestion >= quizData.words.length) {
    const pct = Math.round((score / quizData.words.length) * 100)
    return (
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <Card glow className="p-10 border-grad text-center relative overflow-hidden">
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-56 h-56 bg-neon-purple/20 rounded-full blur-3xl" />
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="text-7xl mb-6"
            >
              {pct >= 80 ? '🥳' : '💪'}
            </motion.div>
            <h2 className="text-3xl font-display font-black mb-1 text-white">測驗結束！</h2>
            <div className="text-slate-400 mb-2">Lesson {context.lesson} 完成</div>
            <div className="text-7xl font-black text-grad my-6">{pct}%</div>
            <div className="flex justify-center gap-3 mb-4">
              <Tag tone="emerald">答對 {score}</Tag>
              <Tag tone="rose">答錯 {mistakes.length}</Tag>
              <Tag tone="violet">+{score * XP_PER_CORRECT + XP_ROUND_BONUS} XP</Tag>
            </div>
            {mistakes.length === 0 && (
              <p className="text-neon-cyan text-sm mb-6 font-bold">🎯 完美一回，解鎖徽章！</p>
            )}
            <PrimaryButton onClick={finishRound}>完成並儲存記錄</PrimaryButton>
          </div>
        </Card>
      </motion.div>
    )
  }

  const word = quizData.words[currentQuestion]
  const fullExampleForSpeech = word.example.replace('___', word.word)

  return (
    <div className="space-y-6 relative">
      <AnimatePresence>
        {xpFlash && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.6 }}
            animate={{ opacity: 1, y: -30, scale: 1 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-grad-cyan text-white font-black px-4 py-2 rounded-full shadow-glow-cyan pointer-events-none"
          >
            {xpFlash}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${((currentQuestion + 1) / quizData.words.length) * 100}%` }}
          className="h-full bg-grad-neon shadow-glow-cyan"
        />
      </div>

      <motion.div key={currentQuestion} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
        <Card className="p-7">
          <div className="mb-6 flex items-center justify-between">
            <Tag tone="violet">L{context.lesson} • Q{currentQuestion + 1}/{quizData.words.length}</Tag>
            <SpeakerBtn text={fullExampleForSpeech} size="lg" />
          </div>

          <p className="text-xl font-bold leading-relaxed text-white mb-8">
            {word.example.split('___').map((part, i) => (
              <span key={i}>
                {part}
                {i === 0 && (
                  <span className="mx-2 px-4 py-1 bg-neon-violet/15 border-b-2 border-neon-violet text-neon-violet italic font-mono rounded-t">?</span>
                )}
              </span>
            ))}
          </p>

          <div className="grid gap-3">
            {word.options.map((opt, idx) => (
              <motion.button
                key={idx}
                whileHover={!showFeedback ? { x: 4 } : {}}
                onClick={() => !showFeedback && setSelectedAnswer(idx)}
                className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                  showFeedback
                    ? idx === word.correctIndex
                      ? 'border-emerald-400 bg-emerald-400/10 shadow-glow-cyan'
                      : idx === selectedAnswer
                      ? 'border-rose-400 bg-rose-400/10'
                      : 'border-white/5 opacity-40'
                    : selectedAnswer === idx
                    ? 'border-neon-violet bg-neon-violet/10 shadow-glow-soft'
                    : 'border-white/10 hover:border-white/25'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-white">{opt.word}</span>
                  <SpeakerBtn text={opt.word} />
                  {showFeedback && <Tag tone="slate">{opt.pos}</Tag>}
                </div>
                {showFeedback && <span className="text-sm text-slate-400">{opt.chinese}</span>}
              </motion.button>
            ))}
          </div>

          {showFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-7 p-5 glass-strong rounded-2xl border border-neon-violet/20"
            >
              <h4 className="font-bold text-neon-violet mb-2 flex items-center gap-2">💡 AI 解析</h4>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{feedback}</p>
            </motion.div>
          )}

          <PrimaryButton
            onClick={
              showFeedback
                ? () => {
                    setShowFeedback(false)
                    setSelectedAnswer(null)
                    setFeedback('')
                    setCurrentQuestion((v) => v + 1)
                  }
                : checkAnswer
            }
            disabled={selectedAnswer === null}
            className="mt-7"
          >
            {showFeedback ? '下一題 →' : '確認答案'}
          </PrimaryButton>
        </Card>
      </motion.div>
    </div>
  )
}
