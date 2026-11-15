# SaathiCare

Elderly care and medication management that keeps family and caretakers in the loop.
Built solo for **Catalyst 2026** (Makers Need More x PromptWars).

**Live:** https://amantebriwal4321.github.io/saathicare/

## The problem

Older parents often juggle 4 to 8 medicines a day. Doses get missed, strips run out, risky combos slip through, and the family living in another city finds out late. Most apps stop at a reminder. SaathiCare tries to close the loop between the elder, the medicine box and the family.

## What it does

| For the elder | For family and caretakers |
| --- | --- |
| Big, high contrast "Today" list with one tap **Taken** / **Skip** | Live alerts: missed doses, low stock, risky combos, out of range vitals |
| Add medicines by **typing or speaking** the prescription line | 7 day adherence score |
| **Read aloud** of what is due (speech synthesis) | One tap WhatsApp daily summary and call |
| SOS button that dials the first family contact | Contact list with validation |
| Vitals log: BP, sugar, pulse, SpO2 with safe range flags | Refill countdown based on real dose schedule |

### Smart bits

- **Prescription parser** (`src/lib/parser.ts`): turns "Metformin 500mg twice a day after food, 60 tablets" into a structured schedule. Handles clock times, slots like morning/night, frequency words (BD, TDS, thrice), half tablets, strips, before/after food. Runs fully offline so no health data leaves the phone.
- **Interaction check** (`src/lib/interactions.ts`): flags well known high risk pairs common in older adults (warfarin + aspirin, digoxin + amiodarone, and more) while adding a medicine.
- **Alert engine** (`src/lib/alerts.ts`): ranks what the family should look at first.
- **Stock math** (`src/lib/schedule.ts`): stock drops on every confirmed dose and predicts days left.

## Security and privacy

- No backend, no account, no tracking. Data lives in `localStorage` on the device.
- Everything read back from storage goes through a strict validator (`src/lib/validate.ts`) that drops malformed rows instead of crashing, caps sizes and strips control characters and angle brackets.
- Strict Content Security Policy (`script-src 'self'`, `object-src 'none'`), `no-referrer` policy, external links use `rel="noopener noreferrer"`.
- No `dangerouslySetInnerHTML`, no `eval`, no third party scripts at runtime.

## Tech

React 19 + TypeScript + Vite. Vitest + Testing Library. GitHub Actions runs lint, tests and build, then deploys to GitHub Pages.

```bash
npm ci
npm run dev        # local
npm test           # 26 unit and component tests
npm run build      # production build
```

## Project layout

```
src/
  lib/          pure, tested logic (parser, schedule, alerts, vitals, interactions, validation, storage)
  components/   Today, AddMedicine, Vitals, Family
  hooks.ts      persistence, clock, speech
```

## Disclaimer

SaathiCare is a hackathon prototype and not a medical device. Always confirm with a doctor.

## License

MIT
