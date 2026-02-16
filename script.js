// Finnhub key provided for this task. Replace for your own deployment.
const FINNHUB_API_KEY = "d695jlhr01qs7u9krk20d695jlhr01qs7u9krk2g";
const FINNHUB_QUOTE_URL = "https://finnhub.io/api/v1/quote";
const FINNHUB_COMPANY_NEWS_URL = "https://finnhub.io/api/v1/company-news";

const STORAGE_KEY_SYMBOLS = "market-dashboard-symbols";
const STORAGE_KEY_TILE_ORDER = "market-dashboard-tile-order";
const INITIAL_SYMBOLS = [
  { symbol: "WDC", name: "Western Digital (WDC)" },
  { symbol: "BINANCE:BTCUSDT", name: "Bitcoin (BTC)" },
];

const NAME_OVERRIDES = {
  WDC: "Western Digital (WDC)",
  "BINANCE:BTCUSDT": "Bitcoin (BTC)",
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const trackedSymbols = loadSavedSymbols();
const previousPrices = new Map();

const quotesBody = document.getElementById("quotes-body");
const quoteUpdatedEl = document.getElementById("quote-updated");
const statusEl = document.getElementById("market-status");
const nextEventEl = document.getElementById("next-event");
const tradingDaysList = document.getElementById("trading-days-list");
const holidayList = document.getElementById("holiday-list");
const calendarGrid = document.getElementById("calendar-grid");
const calendarMonthTitle = document.getElementById("calendar-month-title");
const newsList = document.getElementById("news-list");

const symbolInput = document.getElementById("symbol-input");
const addSymbolBtn = document.getElementById("add-symbol-btn");
const refreshBtn = document.getElementById("refresh-btn");
const googleFinanceBtn = document.getElementById("google-finance-btn");
const resetLayoutBtn = document.getElementById("reset-layout-btn");
const dashboardGrid = document.getElementById("dashboard-grid");

const clockEtEl = document.getElementById("clock-et");
const dateEtEl = document.getElementById("date-et");
const clockNztEl = document.getElementById("clock-nzt");
const dateNztEl = document.getElementById("date-nzt");

function loadSavedSymbols() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SYMBOLS);
    if (!raw) return [...INITIAL_SYMBOLS];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [...INITIAL_SYMBOLS];
    return parsed.filter((item) => item && item.symbol && item.name);
  } catch {
    return [...INITIAL_SYMBOLS];
  }
}

function saveSymbols() {
  localStorage.setItem(STORAGE_KEY_SYMBOLS, JSON.stringify(trackedSymbols));
}

function formatCurrency(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value < 1 ? 4 : 2,
    maximumFractionDigits: value < 1 ? 6 : 2,
  }).format(value);
}

function formatPercent(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return `${value.toFixed(2)}%`;
}

function quoteUrl(symbol) {
  return `${FINNHUB_QUOTE_URL}?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`;
}

function googleFinanceUrl(symbol) {
  return `https://www.google.com/finance/quote/${encodeURIComponent(symbol)}`;
}

async function fetchQuote(symbolObj) {
  const response = await fetch(quoteUrl(symbolObj.symbol));
  if (!response.ok) throw new Error(`Failed to fetch ${symbolObj.symbol}: ${response.status}`);

  const data = await response.json();
  if ([data.c, data.h, data.l].some((n) => typeof n !== "number" || Number.isNaN(n))) {
    throw new Error(`Invalid symbol or no quote data for ${symbolObj.symbol}`);
  }

  const previousPrice = previousPrices.get(symbolObj.symbol);
  previousPrices.set(symbolObj.symbol, data.c);

  return {
    ...symbolObj,
    current: data.c,
    change: data.d,
    percentChange: data.dp,
    high: data.h,
    low: data.l,
    previousPrice,
  };
}

function trendInfo(row) {
  if (typeof row.previousPrice === "number") {
    if (row.current > row.previousPrice) return { className: "up", label: "Rising", icon: "▲" };
    if (row.current < row.previousPrice) return { className: "down", label: "Falling", icon: "▼" };
    return { className: "flat", label: "Flat", icon: "•" };
  }

  if (row.change > 0) return { className: "up", label: "Up", icon: "▲" };
  if (row.change < 0) return { className: "down", label: "Down", icon: "▼" };
  return { className: "flat", label: "Flat", icon: "•" };
}

function removeSymbol(symbol) {
  const index = trackedSymbols.findIndex((item) => item.symbol === symbol);
  if (index === -1) return;
  trackedSymbols.splice(index, 1);
  previousPrices.delete(symbol);
  saveSymbols();
  loadQuotes();
  loadNewsForTrackedSymbols();
}

function renderQuotes(rows) {
  quotesBody.innerHTML = "";

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    const changeClass = row.change > 0 ? "positive" : row.change < 0 ? "negative" : "";
    const trend = trendInfo(row);

    tr.innerHTML = `
      <td>${row.name} (${row.symbol})</td>
      <td>${formatCurrency(row.current)}</td>
      <td class="${changeClass}">${typeof row.change === "number" ? row.change.toFixed(2) : "--"}</td>
      <td class="${changeClass}">${formatPercent(row.percentChange)}</td>
      <td><span class="trend-badge ${trend.className}"><span class="pulse"></span>${trend.icon} ${trend.label}</span></td>
      <td>${formatCurrency(row.high)}</td>
      <td>${formatCurrency(row.low)}</td>
      <td>
        <a class="row-action" target="_blank" rel="noreferrer" href="${googleFinanceUrl(row.symbol)}">Finance</a>
        <button class="row-action remove" data-remove-symbol="${row.symbol}">Remove</button>
      </td>
    `;
    quotesBody.appendChild(tr);
  });

  quotesBody.querySelectorAll("button[data-remove-symbol]").forEach((button) => {
    button.addEventListener("click", () => removeSymbol(button.dataset.removeSymbol));
  });
}

async function loadQuotes() {
  try {
    const rows = await Promise.all(trackedSymbols.map(fetchQuote));
    renderQuotes(rows);
    quoteUpdatedEl.textContent = `Updated ${new Date().toLocaleTimeString()}`;
  } catch (error) {
    quoteUpdatedEl.textContent = `Quote update failed: ${error.message}`;
  }
}

function normalizeSymbol(input) {
  return input.trim().toUpperCase();
}

function getDisplayName(symbol) {
  return NAME_OVERRIDES[symbol] || `${symbol} (${symbol})`;
}

function plainTicker(symbol) {
  if (symbol.includes(":")) return symbol.split(":")[1].replace("USDT", "");
  return symbol.replace("^", "");
}

async function addSymbol() {
  const symbol = normalizeSymbol(symbolInput.value);
  if (!symbol) return;

  if (trackedSymbols.some((item) => item.symbol === symbol)) {
    quoteUpdatedEl.textContent = `${symbol} is already in the table.`;
    symbolInput.value = "";
    return;
  }

  const candidate = { symbol, name: getDisplayName(symbol) };

  try {
    await fetchQuote(candidate);
    trackedSymbols.push(candidate);
    saveSymbols();
    symbolInput.value = "";
    await loadQuotes();
    await loadNewsForTrackedSymbols();
  } catch (error) {
    quoteUpdatedEl.textContent = `Could not add ${symbol}: ${error.message}`;
  }
}

function openGoogleFinanceFromInput() {
  const symbol = normalizeSymbol(symbolInput.value);
  if (!symbol) {
    quoteUpdatedEl.textContent = "Enter a symbol first to open Google Finance.";
    return;
  }
  window.open(googleFinanceUrl(symbol), "_blank", "noopener,noreferrer");
}

function getTimeParts(timeZone) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: true,
    year: "numeric",
    month: "short",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return formatter.formatToParts(now).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});
}

function updateClocks() {
  const et = getTimeParts("America/New_York");
  clockEtEl.textContent = `${et.hour}:${et.minute}:${et.second} ${et.dayPeriod}`;
  dateEtEl.textContent = `${et.weekday}, ${et.month} ${et.day}, ${et.year}`;

  const nzt = getTimeParts("Pacific/Auckland");
  clockNztEl.textContent = `${nzt.hour}:${nzt.minute}:${nzt.second} ${nzt.dayPeriod}`;
  dateNztEl.textContent = `${nzt.weekday}, ${nzt.month} ${nzt.day}, ${nzt.year}`;
}

function toEtDate(date = new Date()) {
  const etString = date.toLocaleString("en-US", { timeZone: "America/New_York" });
  return new Date(etString);
}

function easterDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(Date.UTC(year, month - 1, day));
}

function observeHoliday(date) {
  const observed = new Date(date);
  const weekday = observed.getUTCDay();
  if (weekday === 6) observed.setUTCDate(observed.getUTCDate() - 1);
  if (weekday === 0) observed.setUTCDate(observed.getUTCDate() + 1);
  return observed;
}

function nthWeekdayOfMonthUTC(year, month, weekday, nth) {
  const date = new Date(Date.UTC(year, month, 1));
  let count = 0;
  while (date.getUTCMonth() === month) {
    if (date.getUTCDay() === weekday) {
      count += 1;
      if (count === nth) return new Date(date);
    }
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return null;
}

function lastWeekdayOfMonthUTC(year, month, weekday) {
  const date = new Date(Date.UTC(year, month + 1, 0));
  while (date.getUTCDay() !== weekday) {
    date.setUTCDate(date.getUTCDate() - 1);
  }
  return date;
}

function getNyseHolidays(year) {
  const easter = easterDate(year);
  const goodFriday = new Date(easter);
  goodFriday.setUTCDate(goodFriday.getUTCDate() - 2);

  const holidays = [
    { name: "New Year's Day", date: observeHoliday(new Date(Date.UTC(year, 0, 1))) },
    { name: "Martin Luther King Jr. Day", date: nthWeekdayOfMonthUTC(year, 0, 1, 3) },
    { name: "Presidents' Day", date: nthWeekdayOfMonthUTC(year, 1, 1, 3) },
    { name: "Good Friday", date: goodFriday },
    { name: "Memorial Day", date: lastWeekdayOfMonthUTC(year, 4, 1) },
    { name: "Juneteenth", date: observeHoliday(new Date(Date.UTC(year, 5, 19))) },
    { name: "Independence Day", date: observeHoliday(new Date(Date.UTC(year, 6, 4))) },
    { name: "Labor Day", date: nthWeekdayOfMonthUTC(year, 8, 1, 1) },
    { name: "Thanksgiving Day", date: nthWeekdayOfMonthUTC(year, 10, 4, 4) },
    { name: "Christmas Day", date: observeHoliday(new Date(Date.UTC(year, 11, 25))) },
  ]
    .filter((holiday) => holiday.date)
    .map((holiday) => ({ ...holiday, key: holiday.date.toISOString().slice(0, 10) }));

  const byDate = new Map(holidays.map((holiday) => [holiday.key, holiday.name]));
  return { holidays, byDate };
}

function toUtcKey(localDate) {
  return new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate()))
    .toISOString()
    .slice(0, 10);
}

function isTradingDay(etDate) {
  const day = etDate.getDay();
  if (day === 0 || day === 6) return false;

  const dateKey = toUtcKey(etDate);
  const { byDate } = getNyseHolidays(etDate.getFullYear());
  return !byDate.has(dateKey);
}

function nextTradingDays(startDate, count = 5) {
  const result = [];
  const cursor = new Date(startDate);

  while (result.length < count) {
    if (isTradingDay(cursor)) result.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

function renderTradingDays() {
  const etNow = toEtDate();
  const days = nextTradingDays(etNow, 5);
  tradingDaysList.innerHTML = "";

  days.forEach((day, i) => {
    const li = document.createElement("li");
    const friendly = day.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "America/New_York",
    });
    li.textContent = `${i + 1}. ${friendly}`;
    tradingDaysList.appendChild(li);
  });
}

function renderHolidayCalendar() {
  const etNow = toEtDate();
  const year = etNow.getFullYear();
  const month = etNow.getMonth();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const firstWeekday = monthStart.getDay();
  const totalDays = monthEnd.getDate();
  const { holidays, byDate } = getNyseHolidays(year);

  calendarMonthTitle.textContent = monthStart.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "America/New_York",
  });

  calendarGrid.innerHTML = "";
  WEEKDAY_LABELS.forEach((dayLabel) => {
    const header = document.createElement("div");
    header.className = "calendar-cell weekday-header";
    header.textContent = dayLabel;
    calendarGrid.appendChild(header);
  });

  for (let i = 0; i < firstWeekday; i += 1) {
    const empty = document.createElement("div");
    empty.className = "calendar-cell empty";
    calendarGrid.appendChild(empty);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const d = new Date(year, month, day);
    const key = toUtcKey(d);
    const holidayName = byDate.get(key);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;

    const cell = document.createElement("div");
    cell.className = `calendar-cell${holidayName ? " holiday" : ""}${isWeekend ? " weekend" : ""}`;

    const num = document.createElement("div");
    num.className = "day-number";
    num.textContent = String(day);
    cell.appendChild(num);

    const label = document.createElement("div");
    label.className = `day-label${holidayName ? " holiday" : ""}`;
    label.textContent = holidayName || (isWeekend ? "Weekend" : "Trading");
    cell.appendChild(label);

    calendarGrid.appendChild(cell);
  }

  holidayList.innerHTML = "";
  const monthHolidays = holidays.filter((holiday) => new Date(holiday.date).getUTCMonth() === month);

  if (monthHolidays.length === 0) {
    holidayList.innerHTML = "<li>No NYSE market holidays this month.</li>";
    return;
  }

  monthHolidays.forEach((holiday) => {
    const li = document.createElement("li");
    const humanDate = holiday.date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "America/New_York",
    });
    li.textContent = `${holiday.name}: ${humanDate}`;
    holidayList.appendChild(li);
  });
}

function buildEtDateForToday(hour, minute, second = 0) {
  const nowEt = toEtDate();
  return new Date(nowEt.getFullYear(), nowEt.getMonth(), nowEt.getDate(), hour, minute, second, 0);
}

function formatDuration(ms) {
  if (ms <= 0) return "0m";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function updateMarketStatus() {
  const nowEt = toEtDate();
  const open = buildEtDateForToday(9, 30);
  const close = buildEtDateForToday(16, 0);
  const tradingDay = isTradingDay(nowEt);
  const currentlyOpen = tradingDay && nowEt >= open && nowEt < close;

  statusEl.classList.remove("open", "closed", "neutral");

  if (currentlyOpen) {
    statusEl.textContent = "OPEN";
    statusEl.classList.add("open");
    nextEventEl.textContent = `Time until market close: ${formatDuration(close - nowEt)}`;
    return;
  }

  statusEl.textContent = "CLOSED";
  statusEl.classList.add("closed");

  let nextOpen = new Date(nowEt);
  if (tradingDay && nowEt < open) {
    nextOpen = open;
  } else {
    nextOpen.setDate(nextOpen.getDate() + 1);
    nextOpen.setHours(9, 30, 0, 0);
    while (!isTradingDay(nextOpen)) {
      nextOpen.setDate(nextOpen.getDate() + 1);
      nextOpen.setHours(9, 30, 0, 0);
    }
  }

  nextEventEl.textContent = `Next market open in ${formatDuration(nextOpen - nowEt)} (${nextOpen.toLocaleString("en-US", { timeZone: "America/New_York" })} ET)`;
}

function newsDateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 7);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

async function fetchNewsForSymbol(symbol) {
  const simpleSymbol = plainTicker(symbol);
  if (!/^[A-Z.]+$/.test(simpleSymbol)) return [];

  const { from, to } = newsDateRange();
  const url = `${FINNHUB_COMPANY_NEWS_URL}?symbol=${encodeURIComponent(simpleSymbol)}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const news = await response.json();
    if (!Array.isArray(news)) return [];

    return news.slice(0, 2).map((item) => ({
      symbol,
      headline: item.headline || "Untitled",
      source: item.source || "Unknown",
      url: item.url || "#",
      time: item.datetime ? new Date(item.datetime * 1000) : null,
    }));
  } catch {
    return [];
  }
}

async function loadNewsForTrackedSymbols() {
  newsList.innerHTML = "<li>Loading news...</li>";
  if (trackedSymbols.length === 0) {
    newsList.innerHTML = "<li>No symbols tracked. Add a symbol to see related news.</li>";
    return;
  }

  const allNews = (await Promise.all(trackedSymbols.map((item) => fetchNewsForSymbol(item.symbol)))).flat();

  if (allNews.length === 0) {
    newsList.innerHTML = "<li>No symbol-specific news returned right now.</li>";
    return;
  }

  allNews.sort((a, b) => (b.time?.getTime() || 0) - (a.time?.getTime() || 0));
  newsList.innerHTML = "";

  allNews.slice(0, 8).forEach((entry) => {
    const li = document.createElement("li");
    const dateText = entry.time ? entry.time.toLocaleString() : "Unknown time";
    li.innerHTML = `
      <div class="news-meta">${entry.symbol} • ${entry.source} • ${dateText}</div>
      <a href="${entry.url}" target="_blank" rel="noreferrer">${entry.headline}</a>
    `;
    newsList.appendChild(li);
  });
}


function saveTileOrder() {
  if (!dashboardGrid) return;
  const order = [...dashboardGrid.querySelectorAll(".dashboard-tile")].map((tile) => tile.dataset.tileId);
  localStorage.setItem(STORAGE_KEY_TILE_ORDER, JSON.stringify(order));
}

function applySavedTileOrder() {
  if (!dashboardGrid) return;

  let order = [];
  try {
    order = JSON.parse(localStorage.getItem(STORAGE_KEY_TILE_ORDER) || "[]");
  } catch {
    order = [];
  }

  if (!Array.isArray(order) || order.length === 0) return;

  const tileMap = new Map(
    [...dashboardGrid.querySelectorAll(".dashboard-tile")].map((tile) => [tile.dataset.tileId, tile]),
  );

  order.forEach((tileId) => {
    const tile = tileMap.get(tileId);
    if (tile) dashboardGrid.appendChild(tile);
  });
}

function resetTileOrder() {
  localStorage.removeItem(STORAGE_KEY_TILE_ORDER);
  const defaultOrder = ["stocks", "time", "news", "calendar"];
  const tileMap = new Map(
    [...dashboardGrid.querySelectorAll(".dashboard-tile")].map((tile) => [tile.dataset.tileId, tile]),
  );
  defaultOrder.forEach((tileId) => {
    const tile = tileMap.get(tileId);
    if (tile) dashboardGrid.appendChild(tile);
  });
}

function wireTileDragAndDrop() {
  if (!dashboardGrid) return;
  let draggedTile = null;

  dashboardGrid.querySelectorAll(".dashboard-tile").forEach((tile) => {
    tile.addEventListener("dragstart", () => {
      draggedTile = tile;
      tile.classList.add("dragging");
    });

    tile.addEventListener("dragend", () => {
      tile.classList.remove("dragging");
      dashboardGrid.querySelectorAll(".dashboard-tile").forEach((el) => el.classList.remove("drop-target"));
      draggedTile = null;
      saveTileOrder();
    });

    tile.addEventListener("dragover", (event) => {
      event.preventDefault();
    });

    tile.addEventListener("dragenter", () => {
      if (tile !== draggedTile) tile.classList.add("drop-target");
    });

    tile.addEventListener("dragleave", () => {
      tile.classList.remove("drop-target");
    });

    tile.addEventListener("drop", (event) => {
      event.preventDefault();
      tile.classList.remove("drop-target");
      if (!draggedTile || draggedTile === tile) return;

      const rect = tile.getBoundingClientRect();
      const insertAfter = event.clientY > rect.top + rect.height / 2;
      if (insertAfter) {
        tile.after(draggedTile);
      } else {
        tile.before(draggedTile);
      }
      saveTileOrder();
    });
  });
}

function wireEvents() {
  addSymbolBtn.addEventListener("click", addSymbol);
  refreshBtn.addEventListener("click", () => {
    loadQuotes();
    loadNewsForTrackedSymbols();
  });
  googleFinanceBtn.addEventListener("click", openGoogleFinanceFromInput);
  resetLayoutBtn.addEventListener("click", () => {
    resetTileOrder();
    quoteUpdatedEl.textContent = "Layout reset to default.";
  });

  symbolInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addSymbol();
    }
  });
}

function init() {
  applySavedTileOrder();
  wireTileDragAndDrop();
  wireEvents();
  loadQuotes();
  loadNewsForTrackedSymbols();
  updateClocks();
  updateMarketStatus();
  renderTradingDays();
  renderHolidayCalendar();

  setInterval(updateClocks, 1000);
  setInterval(updateMarketStatus, 1000);
  setInterval(loadQuotes, 30000);
  setInterval(loadNewsForTrackedSymbols, 120000);
}

init();
