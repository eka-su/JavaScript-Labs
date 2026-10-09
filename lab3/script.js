// API, из которого загружаются курсы валют
const API_URL = 'https://www.cbr-xml-daily.ru/daily_json.js';


// Состояние приложения
let currencies = []; //Все доступыне валюты

let fromCurrency = 'RUB';
let toCurrency = 'USD';

let fromAmountValue = '0';
let toAmountValue = '0';

let activeField = 'from'; // Активное поле: from или to


// Символы валют
const currencySymbols = {
    RUB: '₽',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CNY: '¥',

    CHF: 'Fr',
    CAD: 'C$',
    AUD: 'A$',
    NZD: 'NZ$',

    SEK: 'kr',
    NOK: 'kr',
    DKK: 'kr',

    PLN: 'zł',
    CZK: 'Kč',
    HUF: 'Ft',

    TRY: '₺',
    INR: '₹',
    KRW: '₩',

    BRL: 'R$',
    ZAR: 'R',

    AED: 'د.إ',
    SAR: '﷼',

    HKD: 'HK$',
    SGD: 'S$',
    MXN: '$',

    THB: '฿',
    ILS: '₪',
    UAH: '₴',
    KZT: '₸'
};

// Возвращает символ валюты или её код
function getCurrencySymbol(code) {
    return currencySymbols[code] || code;
}


// HTML-элементы
const converterScreen = document.getElementById('converterScreen');
const currencyScreen = document.getElementById('currencyScreen');

const fromCurrencyCard = document.getElementById('fromCurrencyCard');
const toCurrencyCard = document.getElementById('toCurrencyCard');

const fromCode = document.getElementById('fromCode');
const fromName = document.getElementById('fromName');

const toCode = document.getElementById('toCode');
const toName = document.getElementById('toName');

const fromAmount = document.getElementById('fromAmount');
const toAmount = document.getElementById('toAmount');

const clearButton = document.getElementById('clearButton');
const deleteButton = document.getElementById('deleteButton');

const numberButtons = document.querySelectorAll('.number-button');
const zeroButton = document.querySelector('.zero-button');

const backButton = document.getElementById('backButton');

const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');

const currencyList = document.getElementById('currencyList');


// Загрузка валют
async function loadCurrencies() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        currencies = Object.values(data.Valute);

        // Добавляем рубль, которого нет в списке валют
        currencies.push({
            CharCode: 'RUB',
            ID: 'R01014F',
            Name: 'Российский рубль',
            Nominal: 1,
            NumCode: '643',
            Value: 1,
            Previous: 1
        });

        // Настраиваем курсы для money.js
        fx.base = 'RUB';
        fx.rates = {};

        currencies.forEach(function(currency) {
            fx.rates[currency.CharCode] =
                currency.Nominal / currency.Value;
        });

        renderConverter();

    } catch (error) {
        console.error('Ошибка загрузки валют:', error);

        // Сохраняем начальное состояние при ошибке
        fromCurrency = 'RUB';
        toCurrency = 'USD';

        fromAmountValue = '0';
        toAmountValue = '0';

        activeField = 'from';
    }
}


// Поиск валюты по коду
function getCurrency(code) {
    return currencies.find(function(currency) {
        return currency.CharCode === code;
    });
}


// Отрисовка конвертора
function renderConverter() {
    const from = getCurrency(fromCurrency);
    const to = getCurrency(toCurrency);

    if (!from || !to) return;

    fromCode.textContent = from.CharCode;
    fromName.textContent = from.Name;

    toCode.textContent = to.CharCode;
    toName.textContent = to.Name;

    // Показываем суммы и символы валют
    fromAmount.innerHTML = `
        <span class="amount-value">
            ${formatAmount(fromAmountValue)}
        </span>
        <span class="currency-symbol">
            ${getCurrencySymbol(fromCurrency)}
        </span>
    `;

    toAmount.innerHTML = `
        <span class="amount-value">
            ${formatAmount(toAmountValue)}
        </span>
        <span class="currency-symbol">
            ${getCurrencySymbol(toCurrency)}
        </span>
    `;

    updateActiveCard();
}


// Форматируем суммы
function formatAmount(value) {
    if (value === '') {
        return '0';
    }

    return value.replace('.', ',');
}


// Конвертация
function calculate() {
    let number;

    if (activeField === 'from') {
        // Конвертируем первую сумму во вторую
        number = parseFloat(
            fromAmountValue.replace(',', '.')
        );

        if (isNaN(number)) {
            toAmountValue = '0';
            renderConverter();
            return;
        }

        try {
            const result = fx(number)
                .from(fromCurrency)
                .to(toCurrency);

            toAmountValue = formatResult(result);

        } catch (error) {
            console.error(error);
        }

    } else {
        // Конвертируем вторую сумму в первую
        number = parseFloat(
            toAmountValue.replace(',', '.')
        );

        if (isNaN(number)) {
            fromAmountValue = '0';
            renderConverter();
            return;
        }

        try {
            const result = fx(number)
                .from(toCurrency)
                .to(fromCurrency);

            fromAmountValue = formatResult(result);

        } catch (error) {
            console.error(error);
        }
    }

    renderConverter();
}


// Для отображения в едином стиле
function formatResult(value) {
    if (!isFinite(value)) {
        return '0';
    }

    return Number(value)
        .toFixed(2)
        .replace('.', ',');
}


// Активная карточка
function updateActiveCard() {
    fromCurrencyCard.classList.remove('active');
    toCurrencyCard.classList.remove('active');

    // Подсвечиваем выбранное поле
    if (activeField === 'from') {
        fromCurrencyCard.classList.add('active');
    } else {
        toCurrencyCard.classList.add('active');
    }
}


// Выбираем поле
fromCurrencyCard.addEventListener('click', function() {
    activeField = 'from';

    updateActiveCard();
    openCurrencyScreen();
});

toCurrencyCard.addEventListener('click', function() {
    activeField = 'to';

    updateActiveCard();
    openCurrencyScreen();
});


// Открытие списка валют
function openCurrencyScreen() {
    converterScreen.classList.add('hidden');
    currencyScreen.classList.remove('hidden');

    searchInput.value = '';
    renderCurrencyList(currencies);
}


// Возврат к конвектору
backButton.addEventListener('click', function() {
    currencyScreen.classList.add('hidden');
    converterScreen.classList.remove('hidden');

    renderConverter();
});


// Список валют
function renderCurrencyList(list) {
    currencyList.innerHTML = '';

    list.forEach(function(currency) {
        const item = document.createElement('button');
        item.classList.add('currency-item');

        // Галочка появляется у выбранной валюты
        item.innerHTML = `
            <div class="currency-item-code">
                ${currency.CharCode}
            </div>

            <div class="currency-item-name">
                ${currency.Name}
            </div>

            ${
                isSelected(currency.CharCode)
                    ? '<div class="currency-check">✓</div>'
                    : ''
            }
        `;

        item.addEventListener('click', function() {
            selectCurrency(currency.CharCode);
        });

        currencyList.appendChild(item);
    });
}


// Проверка выбранной валюты
function isSelected(code) {
    if (activeField === 'from') {
        return code === fromCurrency;
    } else {
        return code === toCurrency;
    }
}


// Выбор валюты
function selectCurrency(code) {
    // Меняем валюту активного поля
    if (activeField === 'from') {
        fromCurrency = code;
    } else {
        toCurrency = code;
    }

    currencyScreen.classList.add('hidden');
    converterScreen.classList.remove('hidden');

    calculate();
}


// Поиск валют
searchInput.addEventListener('change', function(event) {
    const searchText = event.target.value
        .trim()
        .toLowerCase();

    const filteredCurrencies = currencies.filter(function(currency) {
        const code = currency.CharCode.toLowerCase();
        const name = currency.Name.toLowerCase();

        // Ищем совпадения в коде и названии
        return (
            code.includes(searchText) ||
            name.includes(searchText)
        );
    });

    renderCurrencyList(filteredCurrencies);
});


// Очистка поиска
clearSearch.addEventListener('click', function() {
    searchInput.value = '';
    renderCurrencyList(currencies);
});


// Кнопки
numberButtons.forEach(function(button) {
    button.addEventListener('click', function() {
        addCharacter(button.textContent);
    });
});

zeroButton.addEventListener('click', function() {
    addCharacter('0');
});


// Ввод
function addCharacter(character) {
    if (activeField === 'from') {
        if (fromAmountValue === '0' && character !== ',') {
            fromAmountValue = character;
        } else {
            // Не допускаем несколько запятых
            if (
                character === ',' &&
                fromAmountValue.includes(',')
            ) {
                return;
            }

            fromAmountValue += character;
        }

    } else {
        if (toAmountValue === '0' && character !== ',') {
            toAmountValue = character;
        } else {
            // Не допускаем несколько запятых
            if (
                character === ',' &&
                toAmountValue.includes(',')
            ) {
                return;
            }

            toAmountValue += character;
        }
    }

    calculate();
}


// Очистка сумм
clearButton.addEventListener('click', function() {
    fromAmountValue = '0';
    toAmountValue = '0';

    renderConverter();
});


// Удаление 1 символа
deleteButton.addEventListener('click', function() {
    if (activeField === 'from') {
        fromAmountValue = fromAmountValue.length > 1
            ? fromAmountValue.slice(0, -1)
            : '0';

    } else {
        toAmountValue = toAmountValue.length > 1
            ? toAmountValue.slice(0, -1)
            : '0';
    }

    calculate();
});


// Запуск
loadCurrencies();

