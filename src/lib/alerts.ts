import { daySlots, needsRefill, daysOfStock } from './schedule'
import { findInteractions } from './interactions'
import { classifyVital, formatVital, VITAL_LABEL } from './vitals'
import type { AppState } from './types'

export interface CareAlert {
  level: 'critical' | 'warning' | 'info'
  title: string
  detail: string
}

/** What the family/caretaker dashboard should surface right now, most urgent first. */
export function buildAlerts(state: AppState, now: Date): CareAlert[] {
  const alerts: CareAlert[] = []
  for (const s of daySlots(state.medications, state.logs, now)) {
    if (s.state === 'missed') alerts.push({ level: 'warning', title: `Missed ${s.med.name}`, detail: `${s.time} dose not confirmed.` })
  }
  for (const m of state.medications) {
    if (needsRefill(m)) alerts.push({ level: daysOfStock(m) <= 2 ? 'critical' : 'warning', title: `Refill ${m.name}`, detail: `About ${daysOfStock(m)} day(s) of stock left.` })
  }
  for (const i of findInteractions(state.medications.map((m) => m.name))) {
    alerts.push({ level: i.severity === 'high' ? 'critical' : 'warning', title: `Check ${i.a} + ${i.b}`, detail: `${i.note} Ask the doctor.` })
  }
  const dayAgo = now.getTime() - 24 * 3600 * 1000
  for (const v of state.vitals) {
    if (v.at < dayAgo) continue
    const flag = classifyVital(v)
    if (flag !== 'normal') alerts.push({ level: flag === 'critical' ? 'critical' : 'warning', title: `${VITAL_LABEL[v.kind]} ${formatVital(v)}`, detail: flag === 'critical' ? 'Out of safe range. Call now.' : 'Higher than usual, keep an eye.' })
  }
  const rank = { critical: 0, warning: 1, info: 2 }
  return alerts.sort((a, b) => rank[a.level] - rank[b.level])
}

/** Ready to share text summary for WhatsApp/SMS. Kept plain to avoid leaking more than needed. */
export function dailySummary(state: AppState, now: Date): string {
  const slots = daySlots(state.medications, state.logs, now)
  const taken = slots.filter((s) => s.state === 'taken').length
  const missed = slots.filter((s) => s.state === 'missed').map((s) => `${s.med.name} ${s.time}`)
  const lines = [`${state.elderName} today: ${taken}/${slots.length} doses taken.`]
  if (missed.length) lines.push(`Missed: ${missed.join(', ')}`)
  const crit = buildAlerts(state, now).filter((a) => a.level === 'critical')
  if (crit.length) lines.push(`Urgent: ${crit.map((a) => a.title).join('; ')}`)
  return lines.join('\n')
}
