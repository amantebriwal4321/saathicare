import { useState } from 'react'
import { buildAlerts, dailySummary } from '../lib/alerts'
import { adherence, daysOfStock } from '../lib/schedule'
import { cleanText, isPhone } from '../lib/validate'
import type { AppState, Contact } from '../lib/types'

interface Props {
  state: AppState
  now: Date
  onContact: (c: Contact) => void
  onRename: (name: string) => void
}

export function Family({ state, now, onContact, onRename }: Props) {
  const alerts = buildAlerts(state, now)
  const week = adherence(state.medications, state.logs, now, 7)
  const summary = dailySummary(state, now)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [relation, setRelation] = useState('')
  const [err, setErr] = useState('')

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cleanText(name) || !isPhone(phone)) return setErr('Need a name and a valid phone number.')
    onContact({ id: crypto.randomUUID(), name: cleanText(name, 40), relation: cleanText(relation, 30), phone: phone.trim() })
    setName(''); setPhone(''); setRelation(''); setErr('')
  }

  const waLink = (c: Contact) => `https://wa.me/${c.phone.replace(/\D/g, '')}?text=${encodeURIComponent(summary)}`

  return (
    <section aria-labelledby="fam-h">
      <h2 id="fam-h">Family and caretaker view</h2>
      <label className="row small">Caring for <input aria-label="Elder name" defaultValue={state.elderName} maxLength={40} onBlur={(e) => onRename(cleanText(e.target.value, 40) || state.elderName)} /></label>
      <div className="stats">
        <div className="card stat"><div className="num">{week.pct}%</div><div className="muted small">7 day adherence ({week.taken}/{week.expected})</div></div>
        <div className="card stat"><div className="num">{state.medications.length}</div><div className="muted small">active medicines</div></div>
        <div className="card stat"><div className="num">{Math.min(...state.medications.map(daysOfStock), 99)}</div><div className="muted small">days till first refill</div></div>
      </div>
      <h3>Alerts</h3>
      {alerts.length === 0 ? <p className="card">All good. Nothing needs attention.</p> : (
        <ul className="plain" aria-live="polite">
          {alerts.map((a, i) => <li key={i} className={`card alert ${a.level}`}><strong>{a.title}</strong> <span className="muted">{a.detail}</span></li>)}
        </ul>
      )}
      <h3>Today's summary</h3>
      <pre className="card summary">{summary}</pre>
      <h3>Contacts</h3>
      <ul className="plain">
        {state.contacts.map((c) => (
          <li key={c.id} className="card row between">
            <span><strong>{c.name}</strong> <span className="muted">{c.relation}</span></span>
            <span className="row">
              <a className="btn ghost" href={`tel:${c.phone.replace(/\s/g, '')}`}>Call</a>
              <a className="btn ghost" href={waLink(c)} target="_blank" rel="noopener noreferrer">Send summary</a>
            </span>
          </li>
        ))}
      </ul>
      <form className="row wrap" onSubmit={add}>
        <input aria-label="Contact name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" maxLength={40} />
        <input aria-label="Relation" value={relation} onChange={(e) => setRelation(e.target.value)} placeholder="Relation" maxLength={30} />
        <input aria-label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" maxLength={16} />
        <button className="btn ok">Add contact</button>
      </form>
      {err && <p className="error" role="alert">{err}</p>}
    </section>
  )
}
