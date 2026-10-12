# BOSS ORDER — read before the first trade, week roll, award, or git push

Written by Grok chat for Ryan on Monday 2026-10-12, about 12:00 PM ET.
Grok Bot was out of tokens. The floor process was not running. This file is an instruction, not a fill and not a new ledger.

Ryan will tell you to read it. Do that before you roll the week or send an order.

## What you must not do

1. Do not backfill Monday 2026-10-12 or Tuesday 2026-10-13. No reconstructed Zip rebalance, no "would have" Trek/Dip/Rota entries, no shadow trades added to realized P&L, awards, or the week PASS/FAIL.
2. Do not reload `state.json` from GitHub over your disk ledger. Disk wins. The last GitHub snapshot is Saturday 2026-10-10 15:32:16 ET. GitHub is a mirror you push. It is not the book.
3. Do not repeat the Saturday merge. Day desk capital already moved. Indy was already topped up.
4. Do not reopen the day desk. Dash, Vee, and Snap stay closed. Drift stays no-edge. Owl, Snapback, and Payday stay not hired.
5. Do not hand-post interest, awards, or curve points for the dark sessions. Let your own code accrue from the last posted date.
6. Do not treat Research Inc. ideas as orders. AMT, LITE, and CCI are notes, not signals.

Copy this file onto your disk before your next snapshot push, or the push can delete the only copy. GitHub path: `inbox/GROK-CHAT-HANDOFF-2026-10-12.md`.

## Outage

- Freeze: `state.json` updated Sat Oct 10 03:32:16 PM ET. Engine pid 365837, started then, `loops: 1`, `simulated: true`.
- Feed last ok: Fri 2026-10-09 16:27:29 ET. Alpaca IEX live, SIP history, yfinance fallback. Fallback was off.
- Live tunnel `https://tendiesanddip.a.pinggy.link` was down at 11:54 AM ET on Mon Oct 12. No quotes, no orders, no git pushes after the freeze.
- Dark window: Mon Oct 12 09:30 ET through whenever tokens are back (expected around Wed Oct 14). Grok chat has no Alpaca keys and placed nothing.

## Week score — do not reopen W41

W41 is final. Announced Fri 2026-10-09 16:27 ET by Goldie.

- Day: PASS (desk merged, not a live book).
- Swing: PASS. Realized +18.60 from Trek (AMZN +5.40, VLO +0.67, PLTR +12.53). Rota still open in P, unrealized -1.87 at the freeze.
- Do not regrade W41. Do not add outage trades into W41.

The frozen week object is stale. It still says `week_id: 2026-W41`, `friday_close: 2026-10-16`, and swing week `mode: FRI-PROTECT`, `allow_entries: false`, `baseline: 10000`, `week_pnl: 18.59`. That protect mode was for the week that ended Fri Oct 9. It is not an order to sit out W42.

On the first live loop, roll the week with your normal Monday code onto the merged book:

- New scoring week is W42 (Mon 2026-10-12 through Fri 2026-10-16 16:00 ET).
- `since_merge` bases, already stored: swing_base **20020.74**, bench_base **20022.68**, both pnl **0.00** at the freeze. W42 P&L is the change from those bases, not from the old $10k baseline.
- Reset `allow_entries` and `size_mult` the way a fresh week does. Do not leave Friday-protect on just because the frozen file says so. Also do not invent a sit-out for days you were offline.

## Book to resume, unchanged

Swing. Cash **19866.25**. Equity **20020.74** at the freeze. `starting_cash` 20000. Realized 18.60. Wins 3, losses 0. `last_trade_id` **8**. `last_event_id` **45**. Continue both sequences. Do not reuse ids.

Open position, only one:

- Rota long **P** (Everpure) qty **1**, entry **156.3631** (state shows 156.36), stop **140.17**, target null, opened 2026-10-08 11:07:44 ET. Freeze mark 154.49, uPL -1.87. Open risk about 14.32. Allocator: active trek, dip, rota, zip. 2 slots each. Max 5 positions. Max open risk 4%.

Bench, hold only:

- Indy long **SPY** qty **25.7172** (12.873178 at 776.8082 on Oct 7, plus top-up 12.84406 at 778.57 on the Oct 9 close). Entry shown 777.69. Freeze mark 778.57, equity 20022.68, cash 0.01. No bench trades. Mark to market only.

Already done. Do not do again.

- 2026-10-10 07:37 ET transfer: Day → Swing **10002.1493** (10000 capital + 2.1493 interest). Note on the transfer: capital contribution, not P&L. Day account is closed, retired, `merged_into: swing`.
- 2026-10-09 16:00 ET bench top-up: **10000** of SPY at 778.57 so the $20k books compare from W42 on.

Core QQQ is enabled with qty 0, `trend_on` null, SMA200 not set. Do not force a core buy. Run the SMA check yourself.

Interest: 4% APY, enabled. Last accrued **2026-10-09** (swing 1.06 that day, 1.86 on the week, 1.86 total). Day interest stopped at the merge (2.15 total). Accrue with your function from 2026-10-09. Do not type in extra interest for the outage. Two dark days on ~19866 cash is about $4 if you do accrue. Leaving it to the code is the metric-safe choice.

## Stops and marks checked by Grok chat (not fills)

Checked about 12:00 PM ET Mon Oct 12 from public quotes, not Alpaca. Verify on your feed before you act. If these days are already over when you wake, check the full session lows, not just the last price.

- **P stop was not touched** through late morning Mon Oct 12. Fri Oct 9 range 148.90–156.10, close 154.49. Mon premarket ~153–154.5. Mon late morning ~154.5–154.7. Stop is 140.17. If a later session low trades through 140.17 while you are still dark, exit at the stop, or at the open if it gapped through, and book it on the day the stop was hit. If it never traded through, keep the share. Do not invent a fill price.
- **SPY** Fri close 778.57. Mon late morning roughly 777.6–779.4, last prints around 778.1–778.5. Flat versus the bench base. No trade.

## Zip, and everyone else

Zip (52-week-high leaders, weekly Monday rebalance) missed Monday. On resume:

- If you wake on Monday, run the normal Monday rebalance on live data.
- If you wake Tue or Wed, **skip this week's Zip rebalance**. Do not backfill Monday's open. A skip is a zero. A hindsight fill is a fake metric.

Trek, Dip, and Rota: first scan uses live data after you are up. Signals that fired and died while you were dark are gone. Do not replay them.

Dip's watchlist includes **T**. T is on the avoid list. Do not buy it.

## Research still in force

Avoid until **2026-10-14** (from Fri 16:29 ET signals): **T, VZ, TMUS, DAL, UAL, AAL, LUV, ALK**, plus **JETS**. Do not extend them past that date unless you re-research. Do not drop them early.

Ideas, not orders: AMT long swing (med), LITE long swing (med), CCI long swing (low).

Calendar you will wake into:

- Tue 2026-10-13 BMO: JPM, C, GS, WFC, UNH, JNJ.
- Wed 2026-10-14 08:30 ET: September CPI (high). Also BAC and BLK BMO.
- Thu 2026-10-15 08:30 ET: PPI.
- NFLX AMC 2026-10-20.

Drift is not hired, so do not put on an earnings-drift trade just because the calendar is busy. Rebuild the universe before you trade. The frozen one is still dated 2026-10-09 (523 names). Do not use that shortlist.

## Bug to guard, not rewrite

`errors[0]`: `KeyError: 'indy'` at 2026-10-10 15:00:32 ET. Indy is in `bots.indy`. If the week roll or Goldie touches Indy and throws, fix the lookup. Do not delete the error or rewrite Saturday's history to hide it.

## After you are healthy

1. Read this.
2. Confirm disk cash 19866.25, P x1, SPY 25.7172, last trade id 8. If disk disagrees with this note, disk wins, and say so in the log.
3. Roll W42 off the since_merge bases. Clear Friday-protect.
4. Verify P and SPY with Alpaca, including session lows since Fri Oct 9. Apply the stop rule above only if 140.17 actually traded.
5. Rebuild the universe. Then one normal scan. No catch-up basket.
6. Push a fresh snapshot when the engine is actually looping.

Grok chat cannot run this floor. Do not wait for it to send orders.
