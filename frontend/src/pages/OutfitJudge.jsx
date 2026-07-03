import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Camera } from 'lucide-react'
import { judgeOutfit } from '../services/api'
import toast from 'react-hot-toast'

export default function OutfitJudge() {
  const [file, setFile] = useState(null)
  const [mode, setMode] = useState('balanced')
  const [result, setResult] = useState(null)

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('image', file)
      fd.append('mode', mode)
      return judgeOutfit(fd)
    },
    onSuccess: (res) => setResult(res.data.judgment),
    onError: (err) => toast.error(err.response?.data?.message || 'Could not judge outfit'),
  })

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Outfit Judge</h1>
        <p className="text-sm text-gray-400 mt-1">Requires your OpenAI key in settings.</p>
      </div>
      <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-lg p-5 space-y-4">
        <select value={mode} onChange={(e) => setMode(e.target.value)} className="bg-[#0f0f1a] border border-[#2d2d44] rounded-lg px-3 py-2 text-white">
          {['balanced', 'hype', 'formal', 'comfy', 'roast'].map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block text-sm text-gray-300" />
        <button onClick={() => file && mutation.mutate()} disabled={!file || mutation.isPending} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white flex items-center gap-2 disabled:opacity-60">
          <Camera size={16} /> {mutation.isPending ? 'Analyzing...' : 'Judge Outfit'}
        </button>
      </div>
      {result && (
        <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-lg p-5 space-y-3">
          <p className="text-white font-semibold">Score: {result.score || 'N/A'}</p>
          {['colorHarmony', 'fitFeedback', 'occasionMatch', 'verdict'].map((key) => result[key] && (
            <p key={key} className="text-sm text-gray-300"><span className="text-gray-500">{key}: </span>{result[key]}</p>
          ))}
          {result.improvements?.length > 0 && <p className="text-sm text-gray-300">Improvements: {result.improvements.join(', ')}</p>}
        </div>
      )}
    </div>
  )
}
