// Поле, где отображается введённое число и результат
const display = document.getElementById("display");

let firstNumber = null;
let operation = null;
let memory = 0;
let newNumber = false;


// Получаем число с экрана калькулятора
function getNumber() {
    return parseFloat(display.value.replace(",", "."));
}


// Добавляем введённую цифру или запятую на экран
function addNumber(number) {

    // Если пользователь сначала ввёл минус, то следующая цифра добавляется после него
    if (display.value === "-" && number !== ",") {
        display.value += number;
        return;
    }

    // Если до этого была нажата математическая операция, вводоим новое число
    if (newNumber) {
        display.value = number === "," ? "0," : number;
        newNumber = false;
        return;
    }

    // Не разрешаем вводить больше одной запятой
    if (number === "," && display.value.includes(",")) {
        return;
    }

    // Если на экране только 0 и вводится цифра, заменяем 0 на эту цифру
    if (display.value === "0" && number !== ",") {
        display.value = number;
        return;
    }

    // Добавляем новую цифру в конец числа
    display.value += number;
}


// Очищаем калькулятор
function clearDisplay() {
    display.value = "0";

    firstNumber = null;
    operation = null;
    newNumber = false;
}


// Выбираем математическую операцию
function chooseOperation(selectedOperation) {

    // Если на экране 0 и ещё нет первого числа, а пользователь нажал минус, считаем минус началом отрицательного числа
    if (
        display.value === "0" &&
        firstNumber === null &&
        selectedOperation === "-"
    ) {
        display.value = "-";
        newNumber = false;
        return;
    }

    firstNumber = getNumber();

    operation = selectedOperation;

    newNumber = true;
}


// Выполняем математический расчёт
function calculate() {

    // Если операция или первое число отсутствуют, расчёт выполнять нельзя
    if (operation === null || firstNumber === null) {
        return;
    }

    const secondNumber = getNumber();

    let result;


    // В зависимости от выбранной операции выполняем нужное математическое действие
    switch (operation) {

        case "+":
            result = firstNumber + secondNumber;
            break;

        case "-":
            result = firstNumber - secondNumber;
            break;

        case "*":
            result = firstNumber * secondNumber;
            break;

        case "/":

            if (secondNumber === 0) {
                display.value = "Ошибка";

                firstNumber = null;
                operation = null;

                newNumber = true;

                return;
            }

            result = firstNumber / secondNumber;
            break;
    }


    // Округляем
    result = Number(result.toFixed(10));

    display.value = String(result).replace(".", ",");

    firstNumber = result;

    operation = null;

    newNumber = true;
}


// Функция процентов
function percent() {
    const number = getNumber();
    display.value = String(number / 100).replace(".", ",");
}


// Сохраняем текущее число в память
function memorySave() {
    memory = getNumber();
}


// Очищаем память
function memoryClear() {
    memory = 0;
}


// Получаем число из памяти
function memoryRead() {
    display.value = String(memory).replace(".", ",");
    newNumber = false;
}


// Прибавляем текущее число к памяти
function memoryAdd() {
    memory += getNumber();
}


// Вычитаем текущее число из памяти
function memorySubtract() {
    memory -= getNumber();
}

