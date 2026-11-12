import {
  ApiError,
  getCoinHistory,
  getCoinRates,
  getTopCoins
} from "./api.js";

import {
  destroyCoinChart,
  renderCoinPage
} from "./coin.js";

import {
  renderMarketPage,
  resetMarketView
} from "./market.js";

import {
  renderPortfolioPage
} from "./portfolio.js";

import {
  connectRender,
  setCoin,
  setFilters,
  setRoute,
  setState,
  state
} from "./state.js";

import {
  loadPortfolio,
  savePortfolio,
  setupPortfolioSync
} from "./storage.js";

const POLL_INTERVAL = 45_000;
const DEFAULT_FILTERS = {
  search: "",
  minPrice: "",
  maxPrice: "",
  sortBy: "market_cap_rank",
  sortDirection: "asc",
};

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");
let coinRequestController = null;
let toastTimer = null;

function parseRoute() {
  // Hash-маршруты позволяют менять страницы без перезагрузки
  const rawHash = window.location.hash.slice(1) || "home";
  const [name, queryString = ""] = rawHash.split("?");
  const params = new URLSearchParams(queryString);

  if (name === "coin" && params.get("id")) {
    return { name: "coin", coinId: params.get("id") };
  }
  if (name === "portfolio") return { name: "portfolio" };
  return { name: "home" };
}

function render(options = {}) {
  // Выбираем нужную страницу по текущему маршруту и передаём ей state
  const scrollY = options.preserveScroll ? window.scrollY : null;

  document.querySelectorAll("[data-route]").forEach((link) => {
    link.classList.toggle("is-active", link.dataset.route === state.route.name);
  });

  if (state.route.name === "coin") {
    renderCoinPage(state, app, {
      changeTimeframe,
      showError,
    });
  } else if (state.route.name === "portfolio") {
    renderPortfolioPage(state, app, {
      addTransaction,
      removeTransaction,
    });
  } else {
    renderMarketPage(state, app, {
      changeFilters: setFilters,
      resetFilters,
      changeSort,
    });
  }

  if (scrollY !== null) {
    requestAnimationFrame(() => window.scrollTo({ top: scrollY }));
  }
}

function showError(error) {
  // Ошибка показывается пользователю через небольшое уведомление внизу экрана
  const isRateLimit = error instanceof ApiError && error.status === 429;
  const message = error.message || "Произошла неизвестная ошибка.";
  const rateLimitedUntil = isRateLimit
    ? Date.now() + error.retryAfter * 1000
    : state.rateLimitedUntil;

  setState({ error: message, rateLimitedUntil });
  document.querySelector("#toast-title").textContent = isRateLimit
    ? "Слишком много запросов"
    : "Ошибка загрузки";
  document.querySelector("#toast-message").textContent = message;
  toast.hidden = false;

  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(hideToast, 7_000);
}

function hideToast() {
  // Закрываем уведомление и очищаем ошибку в общем state
  toast.hidden = true;
  setState({ error: null });
}

async function loadMarket({ background = false } = {}) {
  // Фоновое обновление не должно сбрасывать текущую прокрутку пользователя
  if (Date.now() < state.rateLimitedUntil) return;
  setState(background ? { updating: true } : { loading: true });

  try {
    // Fetch-логика находится в api.js, а здесь только обновляем state
    const market = await getTopCoins();
    setState({
      market,
      loading: false,
      updating: false,
      lastUpdated: new Date(),
      error: null,
    }, { preserveScroll: background });
  } catch (error) {
    setState({ loading: false, updating: false });
    showError(error);
  }
}

async function loadCoinData() {
  // Загружаем историю и курсы параллельно, чтобы страница открывалась быстрее
  const coinId = state.route.coinId;
  if (!coinId) return;

  coinRequestController?.abort();
  coinRequestController = new AbortController();
  setCoin({ id: coinId, loading: true, history: [], rates: null });

  try {
    const [history, rates] = await Promise.all([
      getCoinHistory(coinId, state.coin.timeframe, coinRequestController.signal),
      getCoinRates(coinId, coinRequestController.signal),
    ]);

    if (state.route.name !== "coin" || state.route.coinId !== coinId) return;
    setCoin({
      id: coinId,
      loading: false,
      history: history.prices || [],
      rates: rates[coinId] || null,
    });
  } catch (error) {
    if (error.name === "AbortError") return;
    setCoin({ loading: false });
    showError(error);
  }
}

function changeSort(key) {
  // Повторный клик по тому же столбцу меняет направление сортировки
  const sameColumn = state.filters.sortBy === key;
  setFilters({
    sortBy: key,
    sortDirection: sameColumn && state.filters.sortDirection === "asc" ? "desc" : "asc",
  });
}

function resetFilters() {
  // Сбрасываем фильтры и пересоздаём таблицу с начальными значениями
  resetMarketView();
  setFilters(DEFAULT_FILTERS);
}

function changeTimeframe(days) {
  // Меняем период графика, затем запрашиваем новую историю цены
  if (state.coin.timeframe === days) return;
  setCoin({ timeframe: days });
  loadCoinData();
}

function addTransaction(transaction) {
  // Новая покупка сначала попадает в state, потом сохраняется в браузере
  const portfolio = [...state.portfolio, transaction];
  setState({ portfolio });
  savePortfolio(portfolio, portfolioChannel);
}

function removeTransaction(transactionId) {
  // Удаляем только одну операцию по её уникальному id
  const portfolio = state.portfolio.filter((item) => item.id !== transactionId);
  setState({ portfolio });
  savePortfolio(portfolio, portfolioChannel);
}

function handleRouteChange() {
  // При переходе уничтожаем старый график и строим выбранную страницу заново
  destroyCoinChart();
  resetMarketView();
  setRoute(parseRoute());

  if (state.route.name === "coin") loadCoinData();
  window.scrollTo({ top: 0 });
}

if (!window.location.hash) {
  window.history.replaceState(null, "", "#home");
}

setState({
  route: parseRoute(),
  portfolio: loadPortfolio(),
});
connectRender(render);

const portfolioChannel = setupPortfolioSync((portfolio) => {
  setState({ portfolio });
});

window.addEventListener("hashchange", handleRouteChange);
document.querySelector("#toast-close").addEventListener("click", hideToast);

render();
loadMarket();
if (state.route.name === "coin") loadCoinData();

// Раз в 45 секунд обновляем цены рынка в фоне
window.setInterval(() => loadMarket({ background: true }), POLL_INTERVAL);
