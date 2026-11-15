import { useEffect, useRef, useState } from 'react'
import { loadState, saveState } from './lib/storage'
import type { AppState } from './lib/types'

export function usePersistentState(): [AppState, React.Dispatch<React.SetStateAction<AppState>>] {
  const [state, setState] = useState<AppState>(() => loadState())
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => saveState(state), 200)
    return () => window.clearTimeout(timer.current)
  }, [state])
  return [state, setState]
}

export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

export function speak(text: string): void {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.rate = 0.9
  window.speechSynthesis.speak(u)
}

type SpeechCtor = new () => {
  lang: string
  interimResults: boolean
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void
  onerror: () => void
  onend: () => void
  start: () => void
}

export function getRecognizer(): SpeechCtor | null {
  const w = window as unknown as { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}
