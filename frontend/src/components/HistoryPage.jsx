import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, BackBtn } from './ui'

export default function HistoryPage({ setCurrentPage }) {
  const [data, setData] = useState([])
  useEffect(() => {
    setData(JSON.parse(localStorage.getItem('practiceHistory') || '[]').reverse())
  }, [])

  const avg =
    data.length > 0
      ? Math.round(data.reduce((s, r) => s + r.percentage, 0) / data.length)
      : 0

  return (
    <div className="space-y-6">
      <BackBtn onClick={() => setCurrentPage('home')} label="返回首頁" />

      {data.length > 0 && (
        <Card glow className="p-6 border-grad flex items-center justify-around">
          <div className="text-center">
            <div className="text-3xl font-black text-grad">{data.length}</div>
            <div className="text-xs text-slate-400 mt-1">總測驗數</div>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="text-center">
            <div className="text-3xl font-black text-grad">{avg}%</div>
            <div className="text-xs text-slate-400 mt-1">平均正確率</div>
          </div>
        </Card>
      )}

      <Card className="p-7">
        <h2 className="text-2xl font-display font-bold mb-6 text-white">📊 歷史記錄</h2>
        {data.length === 0 ? (
          <div className="text-center text-slate-500 py-12">尚無練習記錄，快去背單字吧！</div>
        ) : (
          <div className="space-y-2">
            {data.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex justify-between items-center p-4 glass rounded-2xl border border-white/5"
              >
                <div>
                  <div className="font-bold text-white">{r.theme}</div>
                  <div className="text-xs text-slate-500">
                    {new Date(r.date).toLocaleDateString()} • {r.score}/{r.total}
                  </div>
                </div>
                <div className={`text-2xl font-black ${r.percentage >= 60 ? 'text-emerald-400' : 'text-orange-400'}`}>
                  {r.percentage}%
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
