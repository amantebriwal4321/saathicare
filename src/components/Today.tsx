import { daySlots, type DoseSlot } from '../lib/schedule'
import type { AppState } from '../lib/types'
import { speak } from '../hooks'

const MEAL_TEXT = { before_food: 'before food', after_food: 'after food', with_food: 'with food', any: '' }
const STATE_TEXT = { taken: 'Taken', skipped: 'Skipped', due: 'Take now', missed: 'Missed', upcoming: 'Later' }

interface Props {
  state: AppState
  now: Date
  onDose: (slot: DoseSlot, status: 'taken' | 'skipped') => void
  onSOS: () => void
}

export function Today({ state, now, onDose, onSOS }: Props) {
  const slots = daySlots(state.medications, state.logs, now)
  const pending = slots.filter((s) => s.state === 'due' || s.state === 'missed')
  const readOut = () =>
    speak(pending.length ? `${state.elderName}, please take ${pending.map((s) => `${s.med.name} ${MEAL_TEXT[s.med.meal]}`).join(', ')}.` : 'All caught up. No medicine due right now.')

  return (
    <section aria-labelledby="today-h">
      <div className="row between">
        <h2 id="today-h">Namaste {state.elderName}</h2>
        <button className="btn ghost" onClick={readOut} aria-label="Read pending medicines aloud">🔊 Read aloud</button>
      </div>
      <p className="muted">{pending.length ? `${pending.length} dose(s) need attention` : 'Nothing pending right now'}</p>
      {slots.length === 0 && <p className="card">No medicines yet. Add one from the Add tab.</p>}
      <ul className="slots">
        {slots.map((s) => (
          <li key={`${s.med.id}-${s.time}`} className={`card slot ${s.state}`}>
            <div>
              <div className="time">{s.time}</div>
              <div className="med">{s.med.name} <span className="muted">{s.med.dosage}</span></div>
              <div className="muted small">{s.med.perDose} tab {MEAL_TEXT[s.med.meal]}</div>
            </div>
            <div className="actions">
              {s.state === 'taken' || s.state === 'skipped' ? (
                <span className={`pill ${s.state}`}>{STATE_TEXT[s.state]}</span>
              ) : (
                <>
                  <button className="btn big ok" onClick={() => onDose(s, 'taken')} aria-label={`Mark ${s.med.name} at ${s.time} as taken`}>✓ Taken</button>
                  <button className="btn ghost" onClick={() => onDose(s, 'skipped')}>Skip</button>
                  <span className={`pill ${s.state}`}>{STATE_TEXT[s.state]}</span>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
      <button className="btn sos" onClick={onSOS}>🚨 SOS, call family</button>
    </section>
  )
}
