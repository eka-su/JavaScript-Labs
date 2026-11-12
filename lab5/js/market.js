import {
  createElement,
  createInput,
  createPageHeading,
  debounce,
  formatCurrency,
  formatPercent,
} from "./utils.js";

let viewIsCreated = false;

// При переходе на другую страницу разрешаем создать таблицу заново
export function resetMarketView() {
  viewIsCreated = false;
}

export function renderMarketPage(state, root, actions) {
  // Каркас создаём один раз, а при фильтрации заменяем только строки таблицы
  if (!viewIsCreated || !document.querySelector("#market-body")) {
    createMarketPage(state, root, actions);
    viewIsCreated = true;
  }

  renderUpdateStatus(state);
  renderSortIndicators(state);
  renderMarketRows(state);
}

function createMarketPage(state, root, actions) {
  // Создаём поля поиска, фильтры цены и заголовки сортируемой таблицы
  root.replaceChildren();

  const heading = createPageHeading(
    "Рынок криптовалют",
    "Топ-100 монет по рыночной капитализации",
  );
  heading.append(createElement("div", "update-status"));

  const filters = createElement("section", "filters panel");
  filters.setAttribute("aria-label", "Фильтры рынка");

  const search = createInput({
    id: "search",
    label: "Поиск",
    value: state.filters.search,
    placeholder: "Bitcoin или BTC",
  });
  const minPrice = createInput({
    id: "min-price",
    label: "Цена от, $",
    type: "number",
    value: state.filters.minPrice,
    min: "0",
    step: "any",
  });
  const maxPrice = createInput({
    id: "max-price",
    label: "Цена до, $",
    type: "number",
    value: state.filters.maxPrice,
    min: "0",
    step: "any",
  });
  const resetButton = createElement("button", "button button--secondary", "Сбросить");
  resetButton.type = "button";

  search.input.addEventListener(
    "input",
    debounce((event) => actions.changeFilters({ search: event.target.value }), 300),
  );
  // debounce запускает фильтрацию только после паузы в наборе текста
  minPrice.input.addEventListener(
    "input",
    debounce((event) => actions.changeFilters({ minPrice: event.target.value }), 300),
  );
  maxPrice.input.addEventListener(
    "input",
    debounce((event) => actions.changeFilters({ maxPrice: event.target.value }), 300),
  );
  resetButton.addEventListener("click", actions.resetFilters);
  filters.append(search.field, minPrice.field, maxPrice.field, resetButton);

  const tablePanel = createElement("section", "panel table-wrap");
  const table = createElement("table", "market-table");
  const caption = createElement("caption", "", "Топ-100 криптовалют");
  const thead = createElement("thead");
  const headerRow = createElement("tr");
  caption.hidden = true;

  const headers = [
    ["market_cap_rank", "Ранг"],
    ["name", "Название"],
    ["current_price", "Цена"],
    ["price_change_percentage_24h", "24 часа"],
    ["market_cap", "Капитализация"],
  ];

  headers.forEach(([key, label]) => {
    const th = createElement("th");
    const button = createElement("button", "sort-button", label);
    button.type = "button";
    button.dataset.sort = key;
    button.addEventListener("click", () => actions.changeSort(key));
    th.append(button);
    headerRow.append(th);
  });

  const tbody = createElement("tbody");
  tbody.id = "market-body";
  thead.append(headerRow);
  table.append(caption, thead, tbody);
  tablePanel.append(table);
  root.append(heading, filters, tablePanel);
}

function getFilteredMarket(state) {
  // Поиск и диапазон цены применяются к данным state без нового запроса к API
  const search = state.filters.search.trim().toLocaleLowerCase("ru");
  const min = state.filters.minPrice === "" ? -Infinity : Number(state.filters.minPrice);
  const max = state.filters.maxPrice === "" ? Infinity : Number(state.filters.maxPrice);

  return state.market
    .filter((coin) => {
      const matchesSearch = !search
        || coin.name.toLocaleLowerCase("ru").includes(search)
        || coin.symbol.toLocaleLowerCase("ru").includes(search);
      const price = Number(coin.current_price);
      return matchesSearch && price >= min && price <= max;
    })
    .sort((first, second) => {
      const key = state.filters.sortBy;
      const firstValue = key === "name" ? first[key].toLocaleLowerCase("ru") : (first[key] ?? -Infinity);
      const secondValue = key === "name" ? second[key].toLocaleLowerCase("ru") : (second[key] ?? -Infinity);
      const result = typeof firstValue === "string"
        ? firstValue.localeCompare(secondValue, "ru")
        : Number(firstValue) - Number(secondValue);
      return state.filters.sortDirection === "asc" ? result : -result;
    });
}

function renderUpdateStatus(state) {
  // В шапке страницы показываем загрузку, spinner или время последнего обновления
  const status = document.querySelector(".update-status");
  if (!status) return;
  status.replaceChildren();

  if (state.updating) {
    status.append(createElement("span", "spinner"), document.createTextNode("Обновляем цены…"));
  } else if (state.lastUpdated) {
    const time = state.lastUpdated.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
    status.textContent = `Обновлено в ${time}`;
  } else {
    status.textContent = "Загрузка данных…";
  }
}

function renderSortIndicators(state) {
  // Добавляем стрелку к активному столбцу, чтобы направление было видно
  const labels = {
    market_cap_rank: "Ранг",
    name: "Название",
    current_price: "Цена",
    price_change_percentage_24h: "24 часа",
    market_cap: "Капитализация",
  };

  document.querySelectorAll("[data-sort]").forEach((button) => {
    const isCurrent = button.dataset.sort === state.filters.sortBy;
    const arrow = state.filters.sortDirection === "asc" ? " ↑" : " ↓";
    button.textContent = `${labels[button.dataset.sort]}${isCurrent ? arrow : ""}`;
  });
}

function renderMarketRows(state) {
  // Меняем только tbody, поэтому положение страницы не сбрасывается
  const body = document.querySelector("#market-body");
  if (!body) return;
  body.replaceChildren();

  if (state.loading && !state.market.length) {
    appendMessageRow(body, "Загружаем данные рынка…", "loading-state");
    return;
  }

  const coins = getFilteredMarket(state);
  if (!coins.length) {
    appendMessageRow(body, "По заданным фильтрам монеты не найдены.", "empty-state");
    return;
  }

  const fragment = document.createDocumentFragment();
  coins.forEach((coin) => fragment.append(createCoinRow(coin)));
  body.append(fragment);
}

function appendMessageRow(body, text, className) {
  const row = createElement("tr");
  const cell = createElement("td");
  cell.colSpan = 5;
  cell.append(createElement("div", className, text));
  row.append(cell);
  body.append(row);
}

function createCoinRow(coin) {
  // Все значения из API вставляются через textContent для защиты от XSS
  const row = createElement("tr");
  row.append(createElement("td", "", coin.market_cap_rank ?? "—"));

  const nameCell = createElement("td");
  const coinCell = createElement("div", "coin-cell");
  if (coin.image) {
    const image = createElement("img");
    image.src = coin.image;
    image.alt = "";
    image.loading = "lazy";
    coinCell.append(image);
  }

  const link = createElement("a", "", coin.name);
  link.href = `#coin?id=${encodeURIComponent(coin.id)}`;
  coinCell.append(link, createElement("span", "symbol", coin.symbol));
  nameCell.append(coinCell);

  const changeClass = Number(coin.price_change_percentage_24h) >= 0 ? "positive" : "negative";
  row.append(
    nameCell,
    createElement("td", "", formatCurrency(coin.current_price)),
    createElement("td", changeClass, formatPercent(coin.price_change_percentage_24h)),
    createElement("td", "", formatCurrency(coin.market_cap)),
  );
  return row;
}
