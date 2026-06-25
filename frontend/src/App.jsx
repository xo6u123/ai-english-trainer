import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import HomePage from './components/HomePage'
import StudyPage from './components/StudyPage'
import VocabPage from './components/VocabPage'
import MistakesPage from './components/MistakesPage'
import HistoryPage from './components/HistoryPage'
import ListeningPage from './components/ListeningPage'
import SentencePage from './components/SentencePage'

const variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
}

const PAGES = {
  home: HomePage,
  study: StudyPage,
  vocab: VocabPage,
  mistakes: MistakesPage,
  history: HistoryPage,
  listening: ListeningPage,
  sentence: SentencePage,
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const Page = PAGES[currentPage] || HomePage

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 glass-strong border-b border-white/5">
        <div className="max-w-2xl mx-auto px-6 py-4 flex justify-between items-center">
          <motion.div
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setCurrentPage('home')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span className="text-2xl drop-shadow-[0_0_10px_rgba(168,85,247,0.6)]">
              ⚡
            </span>
            <h1 className="text-xl font-display font-black text-grad tracking-tight">
              AI ENGLISH
            </h1>
          </motion.div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25 }}
          >
            <Page setCurrentPage={setCurrentPage} />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
