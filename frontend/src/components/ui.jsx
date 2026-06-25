import { motion } from 'framer-motion'

export const speak = (text, rate = 0.85) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = rate
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find(
      (v) => v.name.includes('Google US English') || v.name.includes('Zira')
    )
    if (preferredVoice) utterance.voice = preferredVoice
    window.speechSynthesis.speak(utterance)
  }
}

export function SpeakerBtn({ text, size = 'sm', rate = 0.85 }) {
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={(e) => {
        e.stopPropagation()
        speak(text, rate)
      }}
      className="rounded-full p-1.5 text-neon-cyan/70 hover:text-neon-cyan hover:bg-neon-cyan/10 transition-colors"
      title="點擊發音"
    >
      <svg
        className={size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
        />
      </svg>
    </motion.button>
  )
}

export function Card({ children, className = '', glow = false, ...props }) {
  return (
    <div
      className={`glass rounded-3xl ${glow ? 'shadow-glow-soft' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function PrimaryButton({ children, className = '', ...props }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={`w-full bg-grad-purple text-white font-bold py-4 rounded-2xl shadow-glow-purple disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none transition-all ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  )
}

export function BackBtn({ onClick, label = '返回' }) {
  return (
    <button
      onClick={onClick}
      className="text-slate-400 hover:text-neon-violet font-medium transition-colors flex items-center gap-1"
    >
      <span className="text-lg">←</span> {label}
    </button>
  )
}

export function Tag({ children, tone = 'violet' }) {
  const tones = {
    violet: 'bg-neon-violet/15 text-neon-violet border-neon-violet/20',
    cyan: 'bg-neon-cyan/15 text-neon-cyan border-neon-cyan/20',
    magenta: 'bg-neon-magenta/15 text-neon-magenta border-neon-magenta/20',
    slate: 'bg-white/5 text-slate-400 border-white/10',
    emerald: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/20',
    rose: 'bg-rose-400/15 text-rose-300 border-rose-400/20',
  }
  return (
    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${tones[tone]}`}>
      {children}
    </span>
  )
}

export function Loader({ label, icon = '🎯' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-5">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
        className="text-5xl drop-shadow-[0_0_12px_rgba(168,85,247,0.6)]"
      >
        {icon}
      </motion.div>
      <p className="text-neon-violet/90 font-semibold animate-pulse text-center">
        {label}
      </p>
    </div>
  )
}
