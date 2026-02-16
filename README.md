# Stock Market Static Dashboard

A fully static **dark-mode** dashboard page designed for GitHub Pages deployment.

## Included sections

1. **Live Stock & Crypto Table**
   - Default symbols:
     - Western Digital (WDC)
     - Bitcoin (BTC)
   - Add any extra symbol from the UI search box (example: `AAPL`, `TSLA`).
   - Remove symbols directly from the table.
   - Manual **Refresh Now** button plus automatic refresh (~30s).
   - **Open in Google Finance** button for the symbol entered in the input.
   - Per-row **Finance** action for quick symbol lookup.
   - Live quote data from Finnhub.
   - **Live Trend** column (rising/falling/flat) based on real-time price movement.
2. **Dual Clocks + Market Session Status**
   - ET and NZT clocks.
   - NYSE regular-hours status (9:30 AM–4:00 PM ET).
   - Countdown to next open/close event.
3. **Latest News (by tracked symbols)**
   - Pulls symbol-specific company news for currently tracked symbols.
   - News list updates when symbols are added or removed.
4. **Market Calendar**
   - Built-in holiday-aware NYSE logic.
   - Current month calendar grid.
   - Holiday labels directly on calendar days.
   - “Holidays This Month” list with holiday name + exact date.
   - Next 5 trading days, no external calendar API required.
5. **Snap Layout Tile Reordering**
   - Rearrange primary dashboard tiles by dragging.
   - Tiles snap into an even grid with consistent spacing.
   - Layout order is saved in localStorage.
6. **One-page Minimizable Live Trend Drawer**
   - Floating **Live Trends** tab opens a minimizable panel.
   - Live chart for selected tracked symbol (start/stop/clear).
   - Uses the same quote stream and symbol set as the dashboard.

## GitHub Pages compatibility note

The drag-and-drop tile snap behavior uses standard HTML5 Drag and Drop + CSS Grid, which is fully supported on modern desktop browsers served from GitHub Pages (no server-side features required).

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
- Remove action removes symbol and updates related news.
- Google Finance button opens symbol page from input.
- Live Trend column changes between Rising/Falling/Flat based on quote movement.
- Latest News section updates based on tracked symbols.
- Dashboard tiles can be dragged, snapped into grid positions, and reset to default layout.
- Live trend drawer opens/minimizes and live chart updates over time.
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
