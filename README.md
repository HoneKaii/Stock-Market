# Stock Market Static Dashboard

A fully static **dark-mode** dashboard page designed for GitHub Pages deployment.

## Included sections

1. **Live Stock & Crypto Table**
   - Default symbols:
     - Western Digital (WDC)
     - Bitcoin (BTC)
   - Add any extra symbol from the UI search box (example: `AAPL`, `TSLA`).
   - Manual **Refresh Now** button plus automatic refresh (~30s).
   - Live quote data from Finnhub.
   - **Live Trend** column (rising/falling/flat) based on real-time price movement.
2. **Dual Clocks + Market Session Status**
   - ET and NZT clocks.
   - NYSE regular-hours status (9:30 AM–4:00 PM ET).
   - Countdown to next open/close event.
3. **Market Calendar**
   - Built-in holiday-aware NYSE logic.
   - Current month calendar grid.
   - Holiday labels directly on calendar days.
   - “Holidays This Month” list with holiday name + exact date.
   - Next 5 trading days, no external calendar API required.

## API configuration

`script.js` includes a Finnhub token for this build:

```js
const FINNHUB_API_KEY = "d695jlhr01qs7u9krk20d695jlhr01qs7u9krk2g";
```

> For production, you should protect API keys behind a backend proxy.

## Local test steps

```bash
# 1) Clone
# git clone <repo-url>
# cd Stock-Market

# 2) Serve static files (Python)
python3 -m http.server 8080

# 3) Open browser
# http://localhost:8080
```

Validation checks:
- Quotes update every ~30 seconds.
- “Refresh Now” updates quotes immediately.
- New symbol input adds valid symbols to the tracked table.
- Live Trend column changes between Rising/Falling/Flat based on quote movement.
- Session badge changes between OPEN/CLOSED correctly.
- Countdown timer updates each second.
- Calendar shows the current month with holiday names on holiday days.
- “Holidays This Month” lists holiday name and date.
- Next 5 trading days exclude weekends/NYSE holidays.

## Deploy to GitHub Pages

1. Push this repository to GitHub.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select branch **main** and folder **/ (root)**.
5. Save and wait for deployment.

The site will publish at:

```text
https://<your-username>.github.io/<repo-name>/
```
