import { describe, expect, it, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  beforeEach(() => localStorage.clear())

  it('renders today view with demo medicines and SOS', () => {
    render(<App />)
    expect(screen.getByText(/Namaste Dadi/)).toBeInTheDocument()
    expect(screen.getAllByText('Metformin').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /SOS/ })).toBeInTheDocument()
  })

  it('adds a medicine from a plain sentence', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('tab', { name: 'Add' }))
    fireEvent.change(screen.getByLabelText('Medicine instruction'), { target: { value: 'Warfarin 5mg once daily, 30 tablets' } })
    expect(screen.getByText(/Higher bleeding risk/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save medicine' }))
    expect(screen.getByRole('button', { name: 'Remove Warfarin' })).toBeInTheDocument()
  })

  it('shows family alerts and rejects bad phone numbers', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('tab', { name: 'Family' }))
    expect(screen.getByText('Refill Amlodipine')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Contact name'), { target: { value: 'Papa' } })
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: 'abc' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add contact' }))
    expect(screen.getByRole('alert')).toHaveTextContent('valid phone')
  })
})
