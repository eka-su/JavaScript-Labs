// Один объект state — единственный источник данных приложения
export const state = {
  market: [],
  portfolio: [],
  filters: {
    search: "",
    minPrice: "",
    maxPrice: "",
    sortBy: "market_cap_rank",
    sortDirection: "asc",
  },
  route: { name: "home" },
  coin: {
    id: null,
    timeframe: 7,
    history: [],
    rates: null,
    loading: false,
  },
  loading: true,
  updating: false,
  lastUpdated: null,
  rateLimitedUntil: 0,
  error: null,
};

// Все изменения состояния проходят через эти функции, после чего вызывается render
let render = () => {};

// app.js передаёт сюда главную функцию render один раз при запуске
export function connectRender(renderFunction) {
  render = renderFunction;
}

export function setState(patch, options = {}) {
  Object.assign(state, patch);
  render(options);
}

export function setFilters(patch) {
  state.filters = { ...state.filters, ...patch };
  render();
}

export function setCoin(patch) {
  state.coin = { ...state.coin, ...patch };
  render();
}

export function setRoute(route) {
  state.route = route;
  render();
}
