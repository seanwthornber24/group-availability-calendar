# CLAUDE.md – Group Availability Calendar POC

## Development Approach

**Always use Test-Driven Development (TDD).** Write tests before writing implementation code.

1. Write a failing test that defines the expected behaviour
2. Write the minimum code to make the test pass
3. Refactor if needed, keeping tests green

**Always use braces for `if` statements**, even single-line bodies. Use `if (condition) { statement }`, never `if (condition) statement`.

---

## Project Overview

A mobile-first web app that lets a group of people collaboratively mark their available days on a shared calendar. One person creates a session and shares a link or QR code (e.g. via WhatsApp). Everyone joins the same session and marks their free days. The app surfaces days when everyone — or most people — are free.

---

## Goals

- **Primary:** Make it trivially easy to find a day that works for a group.
- **Secondary:** Zero friction to join — no account, no app install, just a link.
- **POC scope:** Single month view, real-time updates, shareable session link + QR code.

---

## Tech Stack (Recommended for POC)

| Layer         | Choice         | Rationale                                              |
| ------------- | -------------- | ------------------------------------------------------ |
| Frontend      | React (Vite)   | Fast setup, component-friendly                         |
| Styling       | Tailwind CSS   | Mobile-first utility classes                           |
| Realtime / DB | Supabase       | Postgres + real-time subscriptions, generous free tier |
| Hosting       | Vercel         | Free tier, instant deploys                             |
| QR Code       | `qrcode.react` | Simple React component                                 |

> **Alternatives:** Firebase instead of Supabase; Next.js instead of Vite if SSR is later needed.

---

## Core Features (POC)

### 1. Session Creation

- Landing page with a single CTA: **"Create a session"**
- Creator enters:
  - Session name (e.g. "Summer BBQ")
  - Their own name/nickname (no login required)
  - Month to plan for (defaults to next calendar month)
- On submit → unique session ID is generated (e.g. `nanoid`) → creator is taken to the session view

### 2. Sharing

- Session view displays:
  - A **shareable link** (`app.com/session/<id>`) with a one-tap copy button
  - A **QR code** of the link (suitable for screenshotting into WhatsApp)
- Share section is prominent and always accessible (e.g. collapsible banner at top)

### 3. Joining a Session

- Visiting a session link prompts the user for their **name/nickname** only
- No account, no password, no email
- Name is stored in `localStorage` so the user is remembered on return visits to the same session

### 4. Calendar & Availability Marking

- Single-month calendar grid (mobile-optimised, large tap targets)
- Each user can **tap a day to toggle their availability** (free / not marked)
- Their selections are saved in real time
- Past days are greyed out and non-interactive

### 5. Availability Overview

- Each calendar day visually encodes group availability:
  - **All free** → green (or strong highlight)
  - **Most free** → yellow/amber
  - **Few/none free** → no highlight or subtle indicator
- Tapping a day shows a **popover/sheet** listing who is free that day
- A summary banner highlights the **best day(s)** (most people free)

### 6. Participant List

- A simple list of everyone who has joined the session
- Shows each person's name and how many days they've marked

---

## Data Model

### `sessions`

| Column       | Type            | Notes                         |
| ------------ | --------------- | ----------------------------- |
| `id`         | `text` (nanoid) | Primary key, used in URL      |
| `name`       | `text`          | Session display name          |
| `month`      | `date`          | First day of the target month |
| `created_at` | `timestamp`     | Auto                          |

### `participants`

| Column       | Type        | Notes                                                             |
| ------------ | ----------- | ----------------------------------------------------------------- |
| `id`         | `uuid`      | Primary key                                                       |
| `session_id` | `text`      | FK → sessions                                                     |
| `name`       | `text`      | Nickname entered on join                                          |
| `local_id`   | `text`      | Random ID stored in localStorage, used to identify returning user |
| `created_at` | `timestamp` | Auto                                                              |

### `availability`

| Column           | Type   | Notes                  |
| ---------------- | ------ | ---------------------- |
| `id`             | `uuid` | Primary key            |
| `session_id`     | `text` | FK → sessions          |
| `participant_id` | `uuid` | FK → participants      |
| `date`           | `date` | The day marked as free |

> Unique constraint on `(participant_id, date)` — one record per person per day.

---

## User Flows

### Creator Flow

```
Landing page
  → Enter session name + their name + month
  → Session created
  → Session view (calendar + share panel)
  → Mark own availability
```

### Joiner Flow

```
Tap link / scan QR code
  → Prompt: "What's your name?"
  → Session view (calendar + share panel)
  → Mark own availability
```

### Return Visit Flow

```
Tap link again
  → Name recognised from localStorage
  → Drop straight into session view
```

---

## UI / UX Requirements

- **Mobile-first:** Designed for 390px width (iPhone 14 baseline), usable up to tablet
- **Tap targets:** Minimum 44×44px for calendar day cells
- **No page reloads:** All availability updates appear in real time via Supabase subscriptions
- **Colour blind friendly:** Don't rely on colour alone — use icons or fill patterns as secondary indicators
- **No dark patterns:** No sign-up prompts, no email capture, no notifications

---

## Out of Scope (POC)

- User authentication / accounts
- Multiple months
- Time-of-day availability (date-only for now)
- Push notifications
- Admin controls (deleting sessions, removing participants)
- Native mobile app (iOS/Android)
- Paid tiers / rate limiting

---

## Success Criteria (POC)

1. A user can create a session and share the link in under 30 seconds
2. A new joiner can see the calendar and mark availability in under 60 seconds from tapping the link
3. Availability updates appear for all connected users within 2 seconds
4. The best available day is clearly identifiable at a glance
5. The flow works end-to-end on a mobile browser (Chrome/Safari iOS/Android)

---

## Project Structure (Suggested)

```
/src
  /components
    Calendar.jsx          # Month grid
    DayCell.jsx           # Individual day with availability indicator
    DayDetailSheet.jsx    # Bottom sheet showing who's free on a day
    SharePanel.jsx        # Link + QR code
    ParticipantList.jsx   # Who's in the session
    JoinPrompt.jsx        # Name entry modal
  /pages
    Home.jsx              # Landing / create session
    Session.jsx           # Main session view
  /lib
    supabase.js           # Supabase client
    session.js            # Session creation helpers
    availability.js       # Availability read/write helpers
  /hooks
    useSession.js         # Session + participants subscription
    useAvailability.js    # Availability subscription
```

---

## Open Questions (To Decide Before Build)

1. **Session expiry** — should sessions auto-delete after X days post target month?
2. **Max participants** — should there be a cap (e.g. 20) for the POC?
3. **Name collisions** — what happens if two people enter the same name?
4. **Deselection** — can a user un-mark a day, or is it add-only?
5. **Link format** — short random ID (e.g. `abc123`) or longer UUID?
