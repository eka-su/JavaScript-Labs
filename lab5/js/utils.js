export function createElement(tag, className = "", text) {
  // Единый помощник для безопасного создания DOM-элементов
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

export function createInput({ id, label, type = "text", value = "", placeholder = "", min, step }) {
  // Создаёт подпись и поле ввода, чтобы формы выглядели одинаково
  const field = createElement("div", "field");
  const labelElement = createElement("label", "", label);
  const input = createElement("input", "input");

  labelElement.htmlFor = id;
  input.id = id;
  input.name = id;
  input.type = type;
  input.value = value;
  input.placeholder = placeholder;
  if (min !== undefined) input.min = min;
  if (step !== undefined) input.step = step;

  field.append(labelElement, input);
  return { field, input };
}

export function createPageHeading(title, description) {
  // Общий заголовок используется на всех трёх страницах приложения
  const heading = createElement("div", "page-heading");
  const text = createElement("div");
  text.append(createElement("h1", "", title), createElement("p", "", description));
  heading.append(text);
  return heading;
}

export function debounce(callback, delay = 300) {
  // Откладывает callback и отменяет предыдущий таймер при новом вводе
  let timerId;

  return (...args) => {
    window.clearTimeout(timerId);
    timerId = window.setTimeout(() => callback(...args), delay);
  };
}

export function formatCurrency(value, currency = "USD") {
  // Форматирует число по правилам русской локали и выбранной валюты
  if (!Number.isFinite(Number(value))) return "—";
  const number = Number(value);
  const maximumFractionDigits = Math.abs(number) < 1 ? 6 : 2;

  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits,
  }).format(number);
}

export function formatNumber(value, digits = 4) {
  if (!Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: digits }).format(Number(value));
}

export function formatPercent(value) {
  if (!Number.isFinite(Number(value))) return "—";
  const number = Number(value);
  return `${number > 0 ? "+" : ""}${number.toFixed(2)}%`;
}
