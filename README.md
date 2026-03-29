<div align="center">

# Betroom

### Peer-to-peer prediction markets between friends.

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](#)
[![Next.js](https://img.shields.io/badge/Next.js_15-000?logo=nextdotjs&logoColor=white)](#)
[![React](https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=black)](#)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)](#)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)](#)
[![PWA](https://img.shields.io/badge/PWA-5A0FC8?logo=pwa&logoColor=white)](#)

---

</div>

## The idea

Betting with friends is as old as friendship itself. "I bet you it'll rain tomorrow." "I bet the next round is on you." "I bet they break up before summer." We all do it — but there's never any accountability. Nobody remembers the terms. Nobody pays up.

Betroom turns those casual wagers into real, structured prediction markets. Create a bet, set the odds, invite your friends, put money on it. When it resolves, the payout happens automatically. No arguments, no "I never agreed to that," no IOUs that never get collected.

It's not a casino. It's not DraftKings. It's a private betting room for your group of friends — a prediction market where the only participants are people you actually know.

## How it works

### Creating a bet

You start by writing a question — anything with a binary YES/NO outcome. "Will France win the Euros?" "Will the new restaurant last 6 months?" "Will Alex actually run that marathon?"

Then you set the odds. A slider goes from 0 to 100, representing the probability you think YES is correct. If you set it at 70%, you're saying "I think there's a 70% chance this happens." Your avatar follows the slider so you can see exactly where you stand.

You pick your side (YES or NO), choose how much to stake, set an expiration date, upload an image for the bet, and select which friends can participate. You can also designate other admins — people who will help resolve the outcome later.

### Taking a bet

When someone creates a bet, it shows up in your room as a card with the question, the current odds, and YES/NO buttons. If you disagree with the odds, you can take the other side at the complementary probability. If the maker bet YES at 60%, you can take NO at implied 40%.

But it goes deeper than that. You can also propose a counter-offer at different odds. Maybe you think the real probability is 45%, not 60%. You post your own maker trade at 45% and wait for someone else to match you. Multiple people can partially fill a single bet — it's a real orderbook, not a simple 1-to-1 wager.

### Rooms

Bets live inside rooms. Think of them like group chats, but for betting. You create a room, add your friends, and optionally give some of them admin powers (shown with a crown icon).

"My Room" is special — it's your personal feed that aggregates every bet you're involved in, across all rooms. Other rooms only show bets where the participants match the room's members.

The homepage lets you swipe horizontally between rooms. Touch-based navigation with smooth scale and opacity transitions — it feels like flipping through cards.

### Resolving a bet

This is where it gets interesting. Bets don't resolve automatically — admins decide the outcome. And it requires unanimous agreement. Every admin on the bet must submit their decision (YES or NO), and they must all agree. This prevents disputes and ensures the group trusts the result.

Once all admins agree, the settlement engine kicks in:

1. It fetches all trades for the bet
2. Identifies makers and their takers
3. For each position pair, calculates who won and what they're owed
4. Handles partial fills — if a maker was only 60% matched, only that portion settles
5. Creates credit/debit entries for every participant
6. Updates balances automatically

The math accounts for different price levels across multiple takers. A maker who bet at 70% and another who bet at 45% on the same side get different payouts based on their individual risk.

### Money

The platform tracks real money. You can deposit via crypto (USDC on Base, Polygon, or Arbitrum) or bank transfer. A QR code is generated for your deposit address. You can also transfer funds directly to other users on the platform.

Your profile shows three numbers:
- **Total cash** — everything you've deposited plus winnings minus losses
- **In bets** — money locked in unresolved positions
- **Available** — what you can actually use right now

A portfolio chart (built with Recharts) shows your balance over time. Your bet history shows every position with P&L — green for wins, red for losses.

## Architecture

```
betroom/
├── app/
│   ├── page.tsx                        # Auth guard + splash screen
│   ├── layout.tsx                      # Root layout with Supabase provider
│   ├── login/page.tsx                  # Email/password auth
│   ├── onboarding/page.tsx             # 6-step guided tour
│   ├── homepage/page.tsx               # Rooms, bet feed, swipe navigation
│   ├── profile/
│   │   ├── page.tsx                    # Stats, portfolio chart, bet history
│   │   └── addMoney.tsx                # Deposit/withdraw/transfer dialog
│   └── api/
│       ├── upload/route.ts             # Image upload to Cloudflare R2
│       └── complete_bet/route.ts       # Bet resolution + settlement engine
│
├── components/
│   ├── appStartup.tsx                  # Splash screen + PWA install prompt
│   ├── createBet.tsx                   # Full bet creation dialog
│   ├── addRoom.tsx                     # Room creation with admin selection
│   ├── bet/
│   │   ├── betCard.tsx                 # Bet display with YES/NO trading
│   │   ├── betDialog.tsx               # Take or propose counter-offer
│   │   ├── betAnimation.tsx            # Celebration animation on bet placed
│   │   ├── betParticipants.tsx         # Position breakdown by side
│   │   └── resolve.tsx                 # Admin resolution + unanimous check
│   ├── onboarding/                     # 6 onboarding-specific components
│   └── ui/                             # Radix + Tailwind primitives
│
├── lib/
│   ├── database/
│   │   ├── bet.ts                      # useCreateBet, useTakeBet, useCreateMakerTrade
│   │   └── money.ts                    # useUserMoney (balance aggregation)
│   └── hooks/
│       ├── supabase.tsx                # Supabase client provider
│       └── r2.ts                       # R2 upload utility
│
└── public/
    ├── manifest.json                   # PWA manifest
    └── icon-*.png                      # App icons
```

## The onboarding

New users go through a 6-step interactive tutorial that teaches by doing, not by reading:

1. **Create your profile** — Pick a pseudonym, upload an avatar
2. **Learn the odds** — Play with the probability slider, understand what the numbers mean
3. **Create a room** — Set up your first betting room, learn about admins
4. **Create a bet** — Walk through the full bet creation flow with mock data
5. **Place a bet** — Take a position on an existing bet
6. **You're ready** — Summary of what to do next

Each step uses simplified versions of the real components with mock data, so the muscle memory transfers directly to the actual app.

## The settlement math

This is the most complex part of the codebase (`/api/complete_bet`). Here's how it works:

A maker who bets YES at 60% is saying "I'll put up $X at 60% odds." A taker on the NO side needs to put up enough to balance the risk: `(maker_amount × (100 - 60)) / 60`.

When the bet resolves:
- **YES wins**: Takers' stakes flow to the YES side, proportional to each maker's position
- **NO wins**: Makers' stakes flow to the NO side, proportional to taker positions
- **Partial fills**: If a maker is only partially matched, only the matched portion settles — the rest is returned

The system handles edge cases: multiple takers at different price levels against the same maker, deterministic outcomes (0% or 100%), and the scenario where taker liquidity exceeds what the maker needs.

Every transfer is recorded as a credit/debit pair in the `money_movement` table, creating a complete audit trail.

## Tech stack

| Layer | What | Why |
|-------|------|-----|
| **Framework** | Next.js 15, React 19 | App Router, server actions, Turbopack |
| **Language** | TypeScript 5 | Type safety across the stack |
| **Database** | Supabase (Postgres + Auth) | Auth, real-time subscriptions, row-level security |
| **UI** | Tailwind CSS 4, Radix UI | Dark mode by default, accessible primitives |
| **Charts** | Recharts 3.2 | Portfolio value over time |
| **Storage** | Cloudflare R2 | Profile pictures and bet images |
| **PWA** | next-pwa | Installable on mobile, offline-capable |
| **Gestures** | Custom touch handlers | Swipe between rooms |

## Database schema

```
profiles        — id, pseudonym, avatar_url, email
rooms           — id, name, created_at
room_members    — room_id, user_id, is_admin
bets            — id, title, image_url, is_resolved, resolved_outcome, created_by
bet_participants — bet_id, user_id, is_admin, admin_decision
trades          — id, bet_id, user_id, side, price, amount, maker_trade_id
money_movement  — id, user_id, type (credit/debit), amount, source, reference
```

## Getting started

```bash
# Clone
git clone git@github.com:Cesarioo/betroom.git
cd betroom

# Install
npm install

# Set up environment
# Create .env.local with your Supabase and R2 credentials

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

# Cloudflare R2 (image storage)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
```

---

<div align="center">

Built by [Oscar Mairey](https://oscarmairey.com)

</div>
