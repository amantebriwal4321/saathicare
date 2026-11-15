import { useState } from 'react'
import { parseMedicationText, type ParseResult } from '../lib/parser'
import { findInteractions } from '../lib/interactions'
import { parseMedication } from '../lib/validate'
import type { Medication } from '../lib/types'
import { getRecognizer } from '../hooks'

interface Props {
  existing: Medication[]
  onAdd: (m: Medication) => void
  onRemove: (id: string) => void
}

export function AddMedicine({ existing, onAdd, onRemove }: Props) {
  const [text, setText] = useState('')
  const [result, setResult] = useState<ParseResult | null>(null)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const Recognizer = getRecognizer()

  const run = (value: string) => {
    setText(value)
    setResult(parseMedicationText(value))
    setError('')
  }

  const listen = () => {
    if (!Recognizer) return
    const r = new Recognizer()
    r.lang = 'en-IN'
    r.interimResults = false
    r.onresult = (e) => run(e.results[0][0].transcript)
    r.onerror = () => setError('Could not hear that. Try typing.')
    r.onend = () => setListening(false)
    setListening(true)
    r.start()
  }

  const save = () => {
    if (!result?.draft) return
    const med = parseMedication({ ...result.draft, id: crypto.randomUUID() })
    if (!med) return setError('That does not look valid. Check the timing and stock.')
    onAdd(med)
    setText('')
    setResult(null)
  }

  const clash = result?.draft ? findInteractions([...existing.map((m) => m.name), result.draft.name]).filter((i) => result.draft!.name.toLowerCase().includes(i.a) || result.draft!.name.toLowerCase().includes(i.b)) : []

  return (
    <section aria-labelledby="add-h">
      <h2 id="add-h">Add a medicine</h2>
      <p className="muted">Type or say it like the prescription reads. Example: Metformin 500mg twice a day after food, 60 tablets</p>
      <form className="row" onSubmit={(e) => { e.preventDefault(); save() }}>
        <input aria-label="Medicine instruction" value={text} maxLength={200} onChange={(e) => run(e.target.value)} placeholder="Medicine, dose, when, how many" />
        {Recognizer && <button type="button" className="btn ghost" onClick={listen} disabled={listening}>{listening ? 'Listening…' : '🎤 Speak'}</button>}
      </form>
      {error && <p className="error" role="alert">{error}</p>}
      {result?.draft && (
        <div className="card preview">
          <strong>{result.draft.name}</strong> {result.draft.dosage}
          <div>Times: {result.draft.times.join(', ')} · {result.draft.meal.replace('_', ' ')} · {result.draft.perDose} per dose · stock {result.draft.stock}</div>
          {result.hints.map((h) => <div key={h} className="muted small">• {h}</div>)}
          {clash.map((c) => <div key={c.a + c.b} className={`warn ${c.severity}`}>⚠ {c.a} + {c.b}: {c.note} Ask the doctor.</div>)}
          <button className="btn ok" onClick={save}>Save medicine</button>
        </div>
      )}
      <h3>Current list</h3>
      <ul className="plain">
        {existing.map((m) => (
          <li key={m.id} className="card row between">
            <span><strong>{m.name}</strong> {m.dosage} at {m.times.join(', ')} · stock {m.stock}</span>
            <button className="btn ghost" onClick={() => onRemove(m.id)} aria-label={`Remove ${m.name}`}>Remove</button>
          </li>
        ))}
      </ul>
    </section>
  )
}
