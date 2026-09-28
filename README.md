# 🔥 Sparkora Fire Challenge

One self-contained file (`index.html`, ~290 KB). Mascots and logo are embedded, sounds are generated in the browser, so there is nothing else to upload.

## Run locally

```bash
cd sparkora-fire-challenge
python3 -m http.server 8080
```
Open http://localhost:8080. To test on your phone, connect to the same Wi‑Fi and open `http://<your-laptop-IP>:8080`.
(Double-clicking `index.html` also works.)

## Deploy online (Vercel)

```bash
npm i -g vercel
cd sparkora-fire-challenge
vercel --prod
```
Or drag the folder into https://vercel.com/new. Netlify Drop (https://app.netlify.com/drop) works the same way.

**Custom domain**
- `game.sparkora.com` → Vercel project → Settings → Domains → add it, then create the CNAME record Vercel shows you.
- `sparkora.com/game` → upload `index.html` into a `/game/` folder on the existing website. No code changes needed.

## Connect to a QR code

1. Deploy, open the live URL on your phone and play once end-to-end.
2. Generate the QR from the final URL (e.g. https://game.sparkora.com). Any generator works; for brand colours use qr-code-generator.com or QRCode Monkey with foreground `#E2461F`.
3. Optional: add `?src=table12` style tags per outlet/table for tracking later. The game ignores them, so they are safe.
4. Print at least 3 × 3 cm with a quiet margin, test-scan on iPhone and Android before printing in bulk.
5. Tip: point the QR at a short link you control (TinyURL alias or a redirect on sparkora.com), so you can change the game URL later without reprinting.

## Admin / test mode

Open `/#admin` (or `/admin` on Vercel), or tap the Sparkora logo 5× quickly on the start screen. Default PIN: **2580** (change `ADMIN_PIN`).

Reset leaderboard, add test scores, remove rude names, change every game setting and reward tier, list issued reward codes, and jump straight to WIN / TIME'S UP / each tier.

Admin changes are saved **on that device only**. To change settings for every customer, edit `DEFAULT_CONFIG` at the top of the `<script>` in `index.html` and redeploy.

## Configuration

All tuning lives in `DEFAULT_CONFIG` (section 1 of the script): duration, points, taps to complete, combo, event timing/weights, bonuses, reward tiers, daily limit, name length, PIN.

Default tiers were calibrated by simulating 3,000 games per tap speed:

| Tap speed | Typical result | Tier |
|---|---|---|
| < 5 taps/s | Doesn't finish 150 taps in 30 s | — |
| ~5.5 taps/s | 2,450–2,850 | SPARKORA FAN (2,400+) |
| ~7.5 taps/s | 3,050–3,500 | GRILL MASTER (3,200+) |
| ~10 taps/s | 3,550–4,050 | SPARKORA LEGEND (3,700+) |

If you change points, taps or bonuses, re-check these thresholds in admin with "Preview" buttons.

## Going to production (backend)

The prototype stores everything in the phone's `localStorage`, so:
- each phone has its **own** leaderboard (outlet-wide boards need a backend);
- the "1 reward per phone per day" limit can be bypassed by clearing browser data or using another browser;
- staff can't verify a code is real — they can only check the live clock (proves it's not a screenshot).

To go live properly, replace the bodies of two objects in the script (nothing else changes):
- `Leaderboard.all / add / remove / reset` → Supabase table or Firebase collection.
- `Rewards.claim` → POST to your server, which issues the code, stores it, enforces limits, and returns `{ code, tier, reward, score, name, ts }`. A staff-side redeem page (like the Sheets voucher Web App) can then mark codes as used.

Both are already `async`, so a network call drops straight in.
