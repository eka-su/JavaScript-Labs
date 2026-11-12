const API_BASE = "https://api.coingecko.com/api/v3";

// Общая функция для всех запросов: проверяет сеть, HTTP-ошибки и лимит 429

export class ApiError extends Error {
  constructor(message, status = 0, retryAfter = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

async function request(path, signal) {
  let response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: { accept: "application/json" },
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError("Не удалось подключиться к CoinGecko. Проверьте интернет-соединение.");
  }

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("retry-after")) || 60;
    throw new ApiError(
      `Лимит запросов исчерпан. Повторная попытка будет доступна примерно через ${retryAfter} сек.`,
      429,
      retryAfter,
    );
  }

  if (!response.ok) {
    throw new ApiError(`CoinGecko вернул ошибку ${response.status}. Попробуйте немного позже.`, response.status);
  }

  return response.json();
}

export function getTopCoins(signal) {
  // Загружаем первые 100 монет, отсортированных по капитализации
  const query = new URLSearchParams({
    vs_currency: "usd",
    order: "market_cap_desc",
    per_page: "100",
    page: "1",
    sparkline: "false",
    price_change_percentage: "24h",
  });

  return request(`/coins/markets?${query}`, signal);
}

export function getCoinHistory(coinId, days, signal) {
  // История нужна странице монеты для построения графика
  const safeId = encodeURIComponent(coinId);
  const query = new URLSearchParams({ vs_currency: "usd", days: String(days) });
  return request(`/coins/${safeId}/market_chart?${query}`, signal);
}

export function getCoinRates(coinId, signal) {
  // Курс одной монеты сразу в USD, EUR и BTC нужен конвертеру
  const query = new URLSearchParams({
    ids: coinId,
    vs_currencies: "usd,eur,btc",
  });
  return request(`/simple/price?${query}`, signal);
}
