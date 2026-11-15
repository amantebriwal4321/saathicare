import { useState } from 'react'
import { classifyVital, formatVital, VITAL_LABEL } from '../lib/vitals'
import type { VitalKind, VitalReading } from '../lib/types'

interface Props {
  vitals: VitalReading[]
  onAdd: (v: VitalReading) => void
}

export function Vitals({ vitals, onAdd }: Props) {
  const [kind, setKind] = useState<VitalKind>('bp')
  const [v1, setV1] = useState('')
  const [v2, setV2] = useState('')
  const [err, setErr] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = Number(v1)
    const value2 = kind === 'bp' ? Number(v2) : undefined
    if (!Number.isFinite(value) || value <= 0 || value > 400 || (kind === 'bp' && (!Number.isFinite(value2) || !value2 || value2 > 250))) {
      return setErr('Enter a realistic number.')
    }
    onAdd({ id: crypto.randomUUID(), kind, value, value2, at: Date.now() })
    setV1('')
    setV2('')
    setErr('')
  }

  const recent = [...vitals].sort((a, b) => b.at - a.at).slice(0, 10)
  return (
    <section aria-labelledby="vit-h">
      <h2 id="vit-h">Vitals</h2>
      <form className="row wrap" onSubmit={submit}>
        <select aria-label="Vital type" value={kind} onChange={(e) => setKind(e.target.value as VitalKind)}>
          {(Object.keys(VITAL_LABEL) as VitalKind[]).map((k) => <option key={k} value={k}>{VITAL_LABEL[k]}</option>)}
        </select>
        <input aria-label={kind === 'bp' ? 'Systolic' : 'Value'} inputMode="numeric" value={v1} onChange={(e) => setV1(e.target.value)} placeholder={kind === 'bp' ? 'Systolic' : 'Value'} />
        {kind === 'bp' && <input aria-label="Diastolic" inputMode="numeric" value={v2} onChange={(e) => setV2(e.target.value)} placeholder="Diastolic" />}
        <button className="btn ok">Log</button>
      </form>
      {err && <p className="error" role="alert">{err}</p>}
      <ul className="plain">
        {recent.map((r) => {
          const flag = classifyVital(r)
          return (
            <li key={r.id} className={`card row between flag-${flag}`}>
              <span>{VITAL_LABEL[r.kind]}: <strong>{formatVital(r)}</strong></span>
              <span className="muted small">{new Date(r.at).toLocaleString()} · {flag}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
