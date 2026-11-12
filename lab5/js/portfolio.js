import {
  createElement,
  createInput,
  createPageHeading,
  formatCurrency,
  formatNumber,
  formatPercent,
} from "./utils.js";

export function renderPortfolioPage(state, root, actions) {
  // Портфель состоит из формы добавления и блока расчётов
  root.replaceChildren();
  const heading = createPageHeading(
    "Инвестиционный портфель",
    "Все покупки сохраняются в вашем браузере",
  );
  const layout = createElement("div", "portfolio-layout");
  layout.append(createTransactionForm(state, actions), createPortfolioSummary(state, actions));
  root.append(heading, layout);
}

function createTransactionForm(state, actions) {
  // Форма не отправляет страницу: submit передаёт новую операцию в app.js
  const card = createElement("section", "panel form-card");
  const form = createElement("form", "transaction-form");
  card.append(createElement("h2", "", "Добавить покупку"));

  const coinField = createElement("div", "field");
  const coinLabel = createElement("label", "", "Монета");
  const coinPicker = createElement("div", "coin-picker");
  const coinButton = createElement(
    "button",
    "coin-picker__button",
    state.market.length ? "Выберите монету" : "Монеты ещё загружаются",
  );
  const coinMenu = createElement("div", "coin-picker__menu");
  let selectedCoinId = "";

  coinLabel.htmlFor = "transaction-coin";
  coinButton.id = "transaction-coin";
  coinButton.type = "button";
  coinButton.setAttribute("aria-haspopup", "listbox");
  coinButton.setAttribute("aria-expanded", "false");
  coinButton.disabled = !state.market.length;
  coinMenu.id = "transaction-coin-menu";
  coinMenu.setAttribute("role", "listbox");
  coinMenu.hidden = true;
  coinButton.setAttribute("aria-controls", coinMenu.id);

  state.market.forEach((coin) => {
    const option = createElement(
      "button",
      "coin-picker__option",
      `${coin.name} (${coin.symbol.toUpperCase()})`,
    );
    option.type = "button";
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", "false");
    option.addEventListener("click", () => {
      selectedCoinId = coin.id;
      coinButton.textContent = `${coin.name} (${coin.symbol.toUpperCase()})`;
      coinButton.classList.add("is-selected");
      coinButton.setAttribute("aria-expanded", "false");
      coinMenu.hidden = true;
      if (coin.current_price != null) price.input.value = coin.current_price;
    });
    coinMenu.append(option);
  });
  coinButton.addEventListener("click", () => {
    const willOpen = coinMenu.hidden;
    coinMenu.hidden = !willOpen;
    coinButton.setAttribute("aria-expanded", String(willOpen));
  });
  coinPicker.append(coinButton, coinMenu);
  coinField.append(coinLabel, coinPicker);

  const quantity = createInput({
    id: "transaction-quantity",
    label: "Количество",
    type: "number",
    placeholder: "Например, 0.5",
    min: "0.00000001",
    step: "any",
  });
  const price = createInput({
    id: "transaction-price",
    label: "Цена покупки, $",
    type: "number",
    placeholder: "Например, 50000",
    min: "0.00000001",
    step: "any",
  });
  quantity.input.required = true;
  price.input.required = true;

  const submitButton = createElement("button", "button", "Добавить");
  submitButton.type = "submit";
  form.append(coinField, quantity.field, price.field, submitButton);
  form.addEventListener("submit", (event) => {
    // Отменяем стандартную перезагрузку браузера при отправке формы
    event.preventDefault();
    const coin = state.market.find((item) => item.id === selectedCoinId);
    const quantityValue = Number(quantity.input.value);
    const priceValue = Number(price.input.value);
    if (!coin || quantityValue <= 0 || priceValue <= 0) return;

    actions.addTransaction({
      id: window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      coinId: coin.id,
      coinName: coin.name,
      symbol: coin.symbol,
      quantity: quantityValue,
      purchasePrice: priceValue,
      createdAt: new Date().toISOString(),
    });
  });

  card.append(form);
  return card;
}

function createPortfolioSummary(state, actions) {
  // Сводка пересчитывается при каждом render на основании актуального state
  const card = createElement("section", "panel summary-card");
  const totals = calculateTotals(state);
  const pnl = totals.current - totals.invested;
  const pnlPercent = totals.invested ? (pnl / totals.invested) * 100 : 0;
  const summary = createElement("div", "summary-grid");
  card.append(createElement("h2", "", "Сводка"));

  [
    ["Вложено", formatCurrency(totals.invested), ""],
    ["Текущая стоимость", formatCurrency(totals.current), ""],
    ["Прибыль / убыток", `${formatCurrency(pnl)} (${formatPercent(pnlPercent)})`, pnl >= 0 ? "positive" : "negative"],
  ].forEach(([label, value, className]) => {
    const item = createElement("div", "summary-item");
    item.append(createElement("span", "", label), createElement("strong", className, value));
    summary.append(item);
  });
  card.append(summary);

  if (!state.portfolio.length) {
    card.append(createElement("div", "empty-state", "Портфель пока пуст. Добавьте первую покупку."));
    return card;
  }

  const list = createElement("ul", "transactions");
  state.portfolio.forEach((transaction) => {
    list.append(createTransactionItem(state, transaction, actions));
  });
  card.append(list);
  return card;
}

function calculateTotals(state) {
  // PnL считается для каждой покупки отдельно по актуальной цене монеты
  return state.portfolio.reduce((totals, transaction) => {
    const coin = state.market.find((item) => item.id === transaction.coinId);
    const invested = transaction.quantity * transaction.purchasePrice;
    const current = transaction.quantity * (coin?.current_price ?? transaction.purchasePrice);
    totals.invested += invested;
    totals.current += current;
    return totals;
  }, { invested: 0, current: 0 });
}

function createTransactionItem(state, transaction, actions) {
  // Одна строка показывает покупку, её текущую стоимость и кнопку удаления
  const coin = state.market.find((item) => item.id === transaction.coinId);
  const currentValue = transaction.quantity * (coin?.current_price ?? transaction.purchasePrice);
  const item = createElement("li", "transaction");
  const info = createElement("div");
  const removeButton = createElement("button", "delete-button", "×");

  info.append(
    createElement(
      "div",
      "transaction__name",
      `${transaction.coinName} · ${formatNumber(transaction.quantity, 8)} ${transaction.symbol.toUpperCase()}`,
    ),
    createElement("small", "", `Покупка по ${formatCurrency(transaction.purchasePrice)}`),
  );
  removeButton.type = "button";
  removeButton.title = "Удалить транзакцию";
  removeButton.setAttribute("aria-label", `Удалить транзакцию ${transaction.coinName}`);
  removeButton.addEventListener("click", () => actions.removeTransaction(transaction.id));

  item.append(info, createElement("div", "transaction__value", formatCurrency(currentValue)), removeButton);
  return item;
}
