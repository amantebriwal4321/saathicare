import { useCallback, useEffect, useRef, useState } from 'react'
import { Today } from './components/Today'
import { AddMedicine } from './components/AddMedicine'
import { Vitals } from './components/Vitals'
import { Family } from './components/Family'
import { useNow, usePersistentState, speak } from './hooks'
import { daySlots, recordDose, type DoseSlot } from './lib/schedule'
import { demoState } from './lib/storage'

const TABS = ['Today', 'Add', 'Vitals', 'Family'] as const
type Tab = (typeof TABS)[number]

export default function App() {
  const [state, setState] = usePersistentState()
  const now = useNow()
  const [tab, setTab] = useState<Tab>('Today')
  const [large, setLarge] = useState(true)
  const announced = useRef(new Set<string>())

  // Gentle spoken + system reminder the first time a dose becomes due.
  useEffect(() => {
    for (const s of daySlots(state.medications, state.logs, now)) {
      const key = `${s.med.id}|${s.time}|${now.toDateString()}`
      if (s.state !== 'due' || announced.current.has(key)) continue
      announced.current.add(key)
      if ('Notification' in window && Notification.permission === 'granted') new Notification(`Time for ${s.med.name}`, { body: `${s.med.dosage} at ${s.time}` })
    }
  }, [state.medications, state.logs, now])

  const onDose = useCallback((slot: DoseSlot, status: 'taken' | 'skipped') => {
    setState((s) => ({ ...s, ...recordDose(s.medications, s.logs, slot.med.id, slot.time, status, new Date()) }))
    if (status === 'taken') speak(`Great. ${slot.med.name} marked as taken.`)
  }, [setState])

  const onSOS = () => {
    const c = state.contacts[0]
    if (c) window.location.href = `tel:${c.phone.replace(/\s/g, '')}`
    else alert('Add a family contact in the Family tab first.')
  }

  return (
    <div className={large ? 'app large' : 'app'}>
      <header className="row between">
        <h1>SaathiCare <span className="muted small">medicine and care, together</span></h1>
        <div className="row">
          <button className="btn ghost" onClick={() => setLarge((l) => !l)} aria-pressed={large}>A{large ? '-' : '+'}</button>
          {'Notification' in window && Notification.permission === 'default' && (
            <button className="btn ghost" onClick={() => Notification.requestPermission()}>Enable reminders</button>
          )}
        </div>
      </header>
      <nav role="tablist" className="tabs">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'tab active' : 'tab'} onClick={() => setTab(t)}>{t}</button>
        ))}
      </nav>
      <main>
        {tab === 'Today' && <Today state={state} now={now} onDose={onDose} onSOS={onSOS} />}
        {tab === 'Add' && (
          <AddMedicine
            existing={state.medications}
            onAdd={(m) => setState((s) => ({ ...s, medications: [...s.medications, m] }))}
            onRemove={(id) => setState((s) => ({ ...s, medications: s.medications.filter((m) => m.id !== id) }))}
          />
        )}
        {tab === 'Vitals' && <Vitals vitals={state.vitals} onAdd={(v) => setState((s) => ({ ...s, vitals: [...s.vitals, v] }))} />}
        {tab === 'Family' && (
          <Family
            state={state}
            now={now}
            onContact={(c) => setState((s) => ({ ...s, contacts: [...s.contacts, c].slice(-10) }))}
            onRename={(elderName) => setState((s) => ({ ...s, elderName }))}
          />
        )}
      </main>
      <footer className="muted small">
        Data stays on this device. Not a substitute for medical advice.{' '}
        <button className="link" onClick={() => confirm('Reset to demo data?') && setState(demoState())}>Reset demo</button>
      </footer>
    </div>
  )
}
