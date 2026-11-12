const PORTFOLIO_KEY = "cointrack-portfolio-v1";

// Читаем сохранённые покупки. Повреждённые данные не ломают приложение
export function loadPortfolio() {
  try {
    const value = JSON.parse(localStorage.getItem(PORTFOLIO_KEY));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function savePortfolio(portfolio, channel) {
  localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(portfolio));
  channel?.postMessage(portfolio);
}

// StorageEvent работает между вкладками, BroadcastChannel — быстрее и удобнее
export function setupPortfolioSync(onChange) {
  const channel = "BroadcastChannel" in window
    ? new BroadcastChannel("cointrack-portfolio")
    : null;

  window.addEventListener("storage", (event) => {
    if (event.key === PORTFOLIO_KEY) onChange(loadPortfolio());
  });

  channel?.addEventListener("message", (event) => {
    if (Array.isArray(event.data)) onChange(event.data);
  });

  return channel;
}
