const FINNHUB_API_KEY = "d695jlhr01qs7u9krk20d695jlhr01qs7u9krk2g";
const FINNHUB_QUOTE_URL = "https://finnhub.io/api/v1/quote";
const STORAGE_KEY_SYMBOLS = "market-dashboard-symbols";

const DEFAULT_SYMBOLS = [
  { symbol: "WDC", name: "Western Digital (WDC)" },
  { symbol: "BINANCE:BTCUSDT", name: "Bitcoin (BTC)" },
];

const symbolSelect = document.getElementById("trend-symbol");
const startBtn = document.getElementById("trend-start-btn");
const stopBtn = document.getElementById("trend-stop-btn");
const clearBtn = document.getElementById("trend-clear-btn");
const statusEl = document.getElementById("trend-status");
const googleLink = document.getElementById("trend-google-link");
const canvas = document.getElementById("trend-canvas");
const ctx = canvas.getContext("2d");

let timer = null;
let points = [];

function loadSymbols() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SYMBOLS);
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // fall back to defaults
  }
  return DEFAULT_SYMBOLS;
}

function googleFinanceUrl(symbol) {
  return `https://www.google.com/finance/quote/${encodeURIComponent(symbol)}`;
}

function quoteUrl(symbol) {
  return `${FINNHUB_QUOTE_URL}?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`;
}

function drawChart() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0b1323";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (points.length < 2) {
    ctx.fillStyle = "#9fb0cf";
    ctx.font = "16px sans-serif";
    ctx.fillText("Collecting data points...", 20, 35);
    return;
  }

  const values = points.map((p) => p.price);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min || 1) * 0.15;
  const yMin = min - pad;
  const yMax = max + pad;

  ctx.strokeStyle = "#34d399";
  ctx.lineWidth = 2;
  ctx.beginPath();

  points.forEach((point, i) => {
    const x = (i / (points.length - 1)) * (canvas.width - 60) + 30;
    const yRatio = (point.price - yMin) / (yMax - yMin);
    const y = canvas.height - 30 - yRatio * (canvas.height - 60);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();

  ctx.fillStyle = "#9fb0cf";
  ctx.font = "12px sans-serif";
  ctx.fillText(`Min: ${min.toFixed(2)}  Max: ${max.toFixed(2)}  Last: ${values[values.length - 1].toFixed(2)}`, 20, canvas.height - 10);
}

async function pullQuote() {
  const symbol = symbolSelect.value;
  if (!symbol) return;

  try {
    const response = await fetch(quoteUrl(symbol));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (typeof data.c !== "number" || Number.isNaN(data.c)) throw new Error("No quote price");

    points.push({ time: Date.now(), price: data.c });
    if (points.length > 60) points = points.slice(-60);
    statusEl.textContent = `Live: ${symbol} @ ${data.c.toFixed(2)} (${new Date().toLocaleTimeString()})`;
    drawChart();
  } catch (error) {
    statusEl.textContent = `Live draw failed for ${symbol}: ${error.message}`;
  }
}

function startLive() {
  if (timer) clearInterval(timer);
  pullQuote();
  timer = setInterval(pullQuote, 5000);
}

function stopLive() {
  if (timer) clearInterval(timer);
  timer = null;
  statusEl.textContent = "Live draw stopped.";
}

function clearPoints() {
  points = [];
  drawChart();
  statusEl.textContent = "Chart cleared.";
}

function updateGoogleLink() {
  googleLink.href = googleFinanceUrl(symbolSelect.value);
}

function init() {
  const symbols = loadSymbols();
  symbols.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.symbol;
    option.textContent = `${item.name} (${item.symbol})`;
    symbolSelect.appendChild(option);
  });

  updateGoogleLink();
  drawChart();

  symbolSelect.addEventListener("change", () => {
    updateGoogleLink();
    clearPoints();
  });

  startBtn.addEventListener("click", startLive);
  stopBtn.addEventListener("click", stopLive);
  clearBtn.addEventListener("click", clearPoints);
}

init();
