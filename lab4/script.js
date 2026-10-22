// Тексты, из которых формируются задания для печати
const catTexts = [
  "кот решил что он тигр и пошел охотиться на тапок но тапок победил и кот сделал вид что так и было задумано",
  "рыжий кот залез в коробку из под пиццы и теперь считает себя главным менеджером по доставке сна",
  "кот в три часа ночи устроил чемпионат по бегу по квартире а утром заявил что он вообще то очень спокойный",
  "пушистый кот сел на ноутбук чтобы помочь хозяину работать и случайно отправил начальнику двадцать букв жжжжж",
  "кот увидел огурец и отпрыгнул так далеко что сам удивился своим спортивным достижениям",
  "кот украл носок и спрятал его под диван потому что коллекция должна пополняться каждый день",
  "маленький котенок напал на собственный хвост и долго не мог понять почему враг всегда рядом",
  "кот сел перед пустой миской и смотрел на человека как будто тот забыл оплатить аренду квартиры",
  "кот решил похудеть но сначала проверил все пакеты с едой на случай если там лежит что то вкусное",
  "серый кот лег на клавиатуру и сообщил всему миру что пароль от вайфая теперь состоит из мяу",
  "кот принес хозяину игрушечную мышь и ждал похвалы за успешную охоту в пределах гостиной",
  "кот спрятался за шторой так что торчал весь хвост и был уверен что стал невидимым ниндзя",
  "кот увидел солнечный зайчик на стене и немедленно начал охоту хотя никто не обещал ему награду",
  "домашний кот решил что коробка из магазина теперь принадлежит ему и охранял ее до самого вечера",
  "кот пришел на кухню проверить завтрак затем проверил обед и на всякий случай остался ждать ужин",
  "кот внимательно наблюдал за стиральной машиной и подозревал что внутри кто то крутит его игрушки",
  "кот лег на книгу ровно на том месте где человек пытался прочитать самую интересную главу",
  "кот услышал шорох пакета и прибежал быстрее чем человек успел вспомнить зачем вообще пришел на кухню"
];

// Доступные значения для длительности теста или количества слов
const amounts = [10, 25, 50, 100];

const settings = document.querySelector("#settings");
const optionsEl = document.querySelector("#options");
const testArea = document.querySelector("#testArea");
const resultEl = document.querySelector("#result");
const textDisplay = document.querySelector("#textDisplay");
const typingInput = document.querySelector("#typingInput");
const progressEl = document.querySelector("#progress");
const timerEl = document.querySelector("#timer");

// Переменные, хранящие состояние текущего теста
let mode = "time";
let selectedAmount = 50;
let targetText = "";
let started = false;
let finished = false;
let startTime = 0;
let timerId = null;
let lastTextIndex = -1;
let lastTimeRemaining = selectedAmount;

// Выбираем случайный текст, стараясь не повторять предыдущий 
function randomCatText() {
  let index = Math.floor(Math.random() * catTexts.length);

  if (catTexts.length > 1 && index === lastTextIndex) {
    index = (index + 1) % catTexts.length;
  }

  lastTextIndex = index;
  return catTexts[index];
}

// Создаём большой текст, которого хватит для теста на время 
function buildTimeText() {
  const shuffledTexts = [...catTexts];
  const result = [];

  // Перемешиваем истории и добавляем их несколько раз,
  // чтобы пользователь не дошёл до конца текста раньше таймера
  for (let i = 0; i < 12; i++) {
    for (let j = shuffledTexts.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [shuffledTexts[j], shuffledTexts[k]] =
        [shuffledTexts[k], shuffledTexts[j]];
    }

    result.push(...shuffledTexts);
  }

  return result.join(" ");
}

// Формируем задание из выбранного количества случайных слов 
function buildWordsText() {
  const allWords = catTexts.join(" ").split(/\s+/);
  const words = [];

  while (words.length < selectedAmount) {
    const word = allWords[
      Math.floor(Math.random() * allWords.length)
    ];

    words.push(word);
  }

  return words.join(" ");
}

// Выбираем способ генерации задания в зависимости от режима
function buildTargetText() {
  if (mode === "time") {
    return buildTimeText();
  }

  return buildWordsText();
}

// Создаём кнопки выбора количества и обновляет активные режимы 
function renderOptions() {
  optionsEl.innerHTML = "";

  amounts.forEach((amount) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className =
      "option-button" +
      (amount === selectedAmount ? " active" : "");
    button.textContent = amount;

    button.addEventListener("click", () => {
      if (started) return;

      selectedAmount = amount;
      renderOptions();
    });

    optionsEl.appendChild(button);
  });

  // Подсвечиваем выбранный режим: время или слова
  document.querySelectorAll(".mode-button").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.mode === mode
    );
  });
}


 //Определяем, какое слово и какой символ пользователь
 //вводит в данный момент (учитываем лишние символы)
function getTypingPosition(typed) {
  const targetWords = targetText.split(" ");
  const typedWords = typed.split(" ");

  const wordIndex = Math.min(
    typedWords.length - 1,
    targetWords.length - 1
  );

  const currentTypedWord = typedWords[wordIndex] || "";
  const currentTargetWord = targetWords[wordIndex] || "";

  return {
    wordIndex,
    charIndex: Math.min(
      currentTypedWord.length,
      currentTargetWord.length
    ),
    extraCount: Math.max(
      0,
      currentTypedWord.length - currentTargetWord.length
    )
  };
}

 // Отображаем текст посимвольно:
 // правильные символы, ошибки, лишние знаки и курсор
function renderText() {
  const typed = typingInput.value;
  const targetWords = targetText.split(" ");
  const typedWords = typed.split(" ");
  const typingPosition = getTypingPosition(typed);

  textDisplay.innerHTML = "";

  let targetPosition = 0;
  let cursorElement = null;

  targetWords.forEach((targetWord, wordIndex) => {
    const typedWord = typedWords[wordIndex] ?? "";
    const wordEl = document.createElement("span");

    wordEl.className = "word";

    let hasError = false;

    for (let i = 0; i < targetWord.length; i++) {
      // Устанавливаем курсор перед символом, который вводится сейчас
      if (
        started &&
        wordIndex === typingPosition.wordIndex &&
        i === typingPosition.charIndex
      ) {
        cursorElement = document.createElement("span");
        cursorElement.className = "char cursor";
        cursorElement.textContent = "\u200b";
        wordEl.appendChild(cursorElement);
      }

      const charEl = document.createElement("span");

      charEl.className = "char";
      charEl.textContent = targetWord[i];

      // Сравниваем введённый символ с исходным и задаём цвет
      if (i < typedWord.length) {
        if (typedWord[i] === targetWord[i]) {
          charEl.classList.add("correct");
        } else {
          charEl.classList.add("incorrect");
          hasError = true;
        }
      }

      wordEl.appendChild(charEl);
    }

    // Показываем лишние символы, если пользователь ввёл
    // больше символов, чем есть в исходном слове
    if (typedWord.length > targetWord.length) {
      hasError = true;

      for (
        let i = targetWord.length;
        i < typedWord.length;
        i++
      ) {
        const extra = document.createElement("span");

        extra.className = "char extra";
        extra.textContent = typedWord[i];
        wordEl.appendChild(extra);
      }

      if (
        started &&
        wordIndex === typingPosition.wordIndex
      ) {
        cursorElement = document.createElement("span");
        cursorElement.className = "char cursor";
        cursorElement.textContent = "\u200b";
        wordEl.appendChild(cursorElement);
      }
    }

    // Подчёркиваем ошибку после завершения ввода слова
    const wordFinished =
      wordIndex < typedWords.length - 1 ||
      finished;

    if (hasError && wordFinished) {
      wordEl.classList.add("word-error");
    }

    textDisplay.appendChild(wordEl);

    if (wordIndex < targetWords.length - 1) {
      const space = document.createElement("span");

      space.className = "char";
      space.textContent = " ";

      if (wordIndex < typedWords.length - 1) {
        space.classList.add(
          typedWords[wordIndex] === targetWord
            ? "correct"
            : "incorrect"
        );
      }

      // Отображаем курсор после слова, когда введён пробел
      if (
        started &&
        wordIndex === typingPosition.wordIndex &&
        typingPosition.charIndex === targetWord.length &&
        typedWord.length === targetWord.length
      ) {
        cursorElement = document.createElement("span");
        cursorElement.className = "char cursor";
        cursorElement.textContent = "\u200b";
        textDisplay.appendChild(cursorElement);
      }

      textDisplay.appendChild(space);
    }

    targetPosition += targetWord.length + 1;
  });

  // Если курсор ещё не создан, помещаем его в конец текста
  if (started && !cursorElement) {
    cursorElement = document.createElement("span");
    cursorElement.className = "char cursor";
    cursorElement.textContent = "\u200b";
    textDisplay.appendChild(cursorElement);
  }

  updateProgress();
  scrollToCursor(cursorElement);
}

// Прокручиваем текст вслед за курсором во время печати 
function scrollToCursor(cursorElement) {
  if (!cursorElement) return;

  const lineHeight = parseFloat(
    getComputedStyle(textDisplay).lineHeight
  );

  const cursorTop = cursorElement.offsetTop;

  // Оставляем текущую строку в удобном для чтения положении
  const desiredScroll = Math.max(
    0,
    cursorTop - lineHeight
  );

  textDisplay.scrollTo({
    top: desiredScroll,
    behavior: "smooth"
  });
}

// Показываем таймер или количество введённых слов 
function updateProgress() {
  if (mode === "time") {
    progressEl.classList.add("hidden");
    timerEl.classList.remove("hidden");
    return;
  }

  timerEl.classList.add("hidden");
  progressEl.classList.remove("hidden");

  const typed = typingInput.value.trim();
  const count = typed ? typed.split(/\s+/).length : 0;

  progressEl.textContent =
    `${Math.min(count, selectedAmount)}/${selectedAmount}`;
}

// Запускаем обратный отсчёт только в режиме времени 
function startTimer() {
  clearInterval(timerId);

  if (mode !== "time") return;

  timerId = setInterval(() => {
    const elapsed = Math.floor(
      (Date.now() - startTime) / 1000
    );

    const remaining = Math.max(
      0,
      selectedAmount - elapsed
    );

    timerEl.textContent = remaining;
    lastTimeRemaining = remaining;

    if (remaining <= 0) {
      finishTest();
    }
  }, 100);
}

// Подготавливаем интерфейс и запускаем новый тест 
function beginTest() {
  clearInterval(timerId);

  targetText = buildTargetText();
  typingInput.value = "";
  typingInput.disabled = false;

  started = true;
  finished = false;
  startTime = Date.now();
  lastTimeRemaining = selectedAmount;

  settings.classList.add("hidden");
  resultEl.classList.add("hidden");
  testArea.classList.remove("hidden");

  textDisplay.scrollTop = 0;

  timerEl.classList.toggle("hidden", mode !== "time");
  progressEl.classList.toggle("hidden", mode !== "words");

  timerEl.textContent =
    mode === "time" ? selectedAmount : "";

  progressEl.textContent =
    mode === "words" ? `0/${selectedAmount}` : "";

  renderText();
  typingInput.focus();
  startTimer();
}

// Рассчитываем скорость печати, точность и количество ошибок 
function getStats() {
  const typed = typingInput.value;

  let correct = 0;
  let errors = 0;

  // Сравниваем каждый введённый символ с исходным текстом
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === targetText[i]) {
      correct++;
    } else {
      errors++;
    }
  }

  // Переводим продолжительность теста в минуты
  const elapsedMinutes = Math.max(
    (Date.now() - startTime) / 60000,
    1 / 60
  );

  return {
    errors,
    characters: typed.length,
    cpm: Math.round(correct / elapsedMinutes),
    accuracy: typed.length
      ? Math.round(correct / typed.length * 100)
      : 100
  };
}

// Останавливаем тест и выводим итоговую статистику 
function finishTest() {
  if (finished) return;

  finished = true;
  started = false;

  clearInterval(timerId);
  typingInput.disabled = true;

  const stats = getStats();

  document.querySelector("#cpm").textContent = stats.cpm;
  document.querySelector("#accuracy").textContent =
    `${stats.accuracy}%`;
  document.querySelector("#characters").textContent =
    stats.characters;
  document.querySelector("#errors").textContent = stats.errors;

  document.querySelector("#resultMode").textContent =
    mode === "time"
      ? `${selectedAmount} сек`
      : `${selectedAmount} слов`;

  renderText();

  testArea.classList.add("hidden");
  resultEl.classList.remove("hidden");
}

//Возвращаем пользователя к выбору режима 
function showHome() {
  clearInterval(timerId);

  started = false;
  finished = false;

  typingInput.disabled = true;
  typingInput.value = "";

  settings.classList.remove("hidden");
  testArea.classList.add("hidden");
  resultEl.classList.add("hidden");

  textDisplay.innerHTML = "";
  textDisplay.scrollTop = 0;

  renderOptions();
}

// Перезапускаем тест с теми же настройками
function restartSameTest() {
  beginTest();
}

// Обработчики кнопок интерфейса 

// Кнопка с логотипом возвращает на главный экран
document.querySelector("#homeButton").addEventListener(
  "click",
  showHome
);

// Переключение между режимами времени и количества слов
document.querySelectorAll(".mode-button").forEach((button) => {
  button.addEventListener("click", () => {
    if (started) return;

    mode = button.dataset.mode;
    selectedAmount = 50;

    renderOptions();
  });
});

document.querySelector("#startButton").addEventListener(
  "click",
  beginTest
);

document.querySelector("#restartButton").addEventListener(
  "click",
  restartSameTest
);

document.querySelector("#resultRestart").addEventListener(
  "click",
  restartSameTest
);

document.querySelector("#resultNext").addEventListener(
  "click",
  showHome
);

// Управление пробелом и Enter во время набора текста 
typingInput.addEventListener("keydown", (event) => {
  if (!started || finished) return;

  if (event.key === " " || event.code === "Space") {
    const value = typingInput.value;
    const currentWord = value.split(" ").pop() || "";

    // Не разрешаем вводить несколько пробелов подряд
    if (!currentWord.length) {
      event.preventDefault();
      return;
    }

    // После последнего слова завершаем тест без дополнительного пробела
    if (
      mode === "words" &&
      value.trim().split(/\s+/).length >= selectedAmount
    ) {
      event.preventDefault();
      finishTest();
    }
  }

  // Не допускаем переноса строки клавишей Enter
  if (event.key === "Enter") {
    event.preventDefault();
  }
});

// Обновляем подсветку после каждого изменения введённого текста 
typingInput.addEventListener("input", () => {
  if (!started || finished) return;

  // Заменяем несколько последовательных пробелов одним
  typingInput.value = typingInput.value.replace(/ {2,}/g, " ");

  renderText();

  if (mode === "words") {
    const typed = typingInput.value;
    const trimmed = typed.trim();
    const words = trimmed ? trimmed.split(/\s+/) : [];

    // Проверяем, введено ли последнее слово задания полностью
    if (
      words.length >= selectedAmount &&
      trimmed.length >= targetText.length
    ) {
      finishTest();
    }
  }
});

// Позволяем выйти из теста клавишей Escape 
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && started) {
    showHome();
  }
});

// При первом открытии страницы отображаем настройки теста
renderOptions();

// Завершаем тест, если пользователь переключился на другую вкладку 
document.addEventListener("visibilitychange", () => {
  if (document.hidden && started && !finished) {
    finishTest();
  }
});
