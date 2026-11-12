import {
  createElement,
  createInput,
  formatCurrency,
  formatNumber,
  formatPercent,
} from "./utils.js";

let chart = null;
let chartErrorWasShown = false;

// Перед созданием нового графика удаляем старый экземпляр Chart.js
export function destroyCoinChart() {
  chart?.destroy();
  chart = null;
}

export function renderCoinPage(state, root, actions) {
  // Страница монеты собирается из заголовка, графика и конвертера
  root.replaceChildren();
  const coin = state.market.find((item) => item.id === state.route.coinId) || null;

  const backLink = createElement("a", "back-link", "← Вернуться к рынку");
  backLink.href = "#home";

  const header = createCoinHeader(state, coin);
  const layout = createElement("div", "detail-grid");
  layout.append(createChartCard(state, coin, actions), createConverterCard(state, coin));
  root.append(backLink, header, layout);

  if (!state.coin.loading && state.coin.history.length) {
    requestAnimationFrame(() => drawChart(state, coin, actions.showError));
  }
}

function createCoinHeader(state, coin) {
  // Показываем название, символ, текущую цену и изменение за сутки
  const header = createElement("section", "coin-header");
  const title = createElement("div", "coin-title");

  if (coin?.image) {
    const image = createElement("img", "coin-logo");
    image.src = coin.image;
    image.alt = "";
    title.append(image);
  }

  const titleText = createElement("div");
  titleText.append(
    createElement("h1", "", coin?.name || state.route.coinId),
    createElement("p", "muted", coin ? coin.symbol.toUpperCase() : "Криптовалюта"),
  );
  title.append(titleText);

  const price = createElement("div", "coin-price");
  const changeClass = Number(coin?.price_change_percentage_24h) >= 0 ? "positive" : "negative";
  price.append(
    createElement("strong", "", coin ? formatCurrency(coin.current_price) : "—"),
    createElement(
      "span",
      changeClass,
      coin ? `${formatPercent(coin.price_change_percentage_24h)} за 24 ч` : "Нет рыночных данных",
    ),
  );

  header.append(title, price);
  return header;
}

function createChartCard(state, coin, actions) {
  // В зависимости от state показываем загрузку, пустое состояние или canvas
  const card = createElement("section", "panel chart-card");
  const heading = createElement("div", "card-heading");
  const container = createElement("div", "chart-container");
  heading.append(createElement("h2", "", "История цены"), createTimeframes(state, actions));

  if (state.coin.loading) {
    container.append(createElement("div", "loading-state", "Загружаем график…"));
  } else if (!state.coin.history.length) {
    container.append(createElement("div", "empty-state", "История цены пока недоступна."));
  } else {
    const canvas = createElement("canvas");
    canvas.id = "price-chart";
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", `График цены ${coin?.name || state.route.coinId}`);
    container.append(canvas);
  }

  card.append(heading, container);
  return card;
}

function createTimeframes(state, actions) {
  // Кнопки периода меняют только timeframe в state
  const timeframes = createElement("div", "timeframes");

  [[1, "1 день"], [7, "7 дней"], [30, "30 дней"], [365, "1 год"]].forEach(([days, label]) => {
    const className = state.coin.timeframe === days ? "timeframe is-active" : "timeframe";
    const button = createElement("button", className, label);
    button.type = "button";
    button.addEventListener("click", () => actions.changeTimeframe(days));
    timeframes.append(button);
  });

  return timeframes;
}

function drawChart(state, coin, showError) {
  // Chart.js получает подписи дат и массив исторических цен
  const canvas = document.querySelector("#price-chart");
  if (!canvas) return;

  if (!window.Chart) {
    if (!chartErrorWasShown) {
      chartErrorWasShown = true;
      showError(new Error("Библиотека графиков не загрузилась. Проверьте интернет-соединение."));
    }
    return;
  }

  destroyCoinChart();
  const dateFormat = state.coin.timeframe === 1
    ? { hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "short", year: state.coin.timeframe === 365 ? "2-digit" : undefined };
  const formatter = new Intl.DateTimeFormat("ru-RU", dateFormat);
  const labels = state.coin.history.map(([timestamp]) => formatter.format(new Date(timestamp)));
  const prices = state.coin.history.map(([, price]) => price);

  // Используем обычную линейную диаграмму без отдельного адаптера дат
  chart = new window.Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        data: prices,
        borderColor: "#15bb70",
        backgroundColor: "rgba(21, 187, 112, 0.1)",
        borderWidth: 2,
        fill: true,
        pointRadius: 0,
        pointHitRadius: 12,
        tension: 0.18,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: "index" },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (context) => formatCurrency(context.parsed.y) } },
      },
      scales: {
        x: {
          ticks: { autoSkip: true, maxTicksLimit: 7, maxRotation: 0 },
          grid: { display: false },
        },
        y: {
          position: "right",
          ticks: { callback: (value) => formatCurrency(value) },
          grid: { color: "#eef0f2" },
        },
      },
    },
  });
}

function createConverterCard(state, coin) {
  // Конвертер пересчитывает введённое количество по курсу из state
  const card = createElement("section", "panel converter-card");
  card.append(createElement("h2", "", "Конвертер"));

  const amount = createInput({
    id: "converter-amount",
    label: `Количество ${coin?.symbol?.toUpperCase() || "монет"}`,
    type: "number",
    value: "1",
    min: "0",
    step: "any",
  });
  const currencyField = createElement("div", "field");
  const label = createElement("label", "", "Получить в валюте");
  const select = createElement("select", "select");
  label.htmlFor = "converter-currency";
  select.id = "converter-currency";

  [["usd", "USD"], ["eur", "EUR"], ["btc", "BTC"]].forEach(([value, text]) => {
    const option = createElement("option", "", text);
    option.value = value;
    select.append(option);
  });
  currencyField.append(label, select);

  const result = createElement("p", "converter-result");
  const recalculate = () => {
    // Эта функция вызывается при изменении количества или валюты
    const amountValue = Number(amount.input.value) || 0;
    const currency = select.value;
    const rate = state.coin.rates?.[currency];
    result.textContent = rate == null
      ? "Курс недоступен"
      : currency === "btc"
        ? `${formatNumber(amountValue * rate, 8)} BTC`
        : formatCurrency(amountValue * rate, currency.toUpperCase());
  };

  amount.input.addEventListener("input", recalculate);
  select.addEventListener("change", recalculate);
  card.append(amount.field, currencyField, result);
  requestAnimationFrame(recalculate);
  return card;
}
