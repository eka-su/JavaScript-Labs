// Задачи
let todos = [];

// При редактироавнии
let editingId = null;

/// Работа с localStorage

function saveTodos() {
    localStorage.setItem("todos",JSON.stringify(todos));
}

function loadTodos() {
    const data = localStorage.getItem("todos");

    if (data) {
        todos = JSON.parse(data);
    } else {
        todos = [];
    }
}

function openModal() {
    
    const modal = document.getElementById("modalScreen");
    
    const main = document.getElementById("mainScreen");

    main.style.display = "none";

    modal.style.display = "block";

    // очищаем поле при создании новой задачи
    if (editingId === null) {

        document.getElementById("taskInput").value = "";
    }
}


function closeModal() {

    const modal = document.getElementById("modalScreen");

    const main = document.getElementById("mainScreen");

    modal.style.display = "none";

    main.style.display = "block";

    document.getElementById("taskInput").value = "";

    editingId = null;
}


// +изменение
function createTask() {

    const input = document.getElementById("taskInput");

    const text = input.value.trim();

    if (text === "") {

        return;
    }

    // если редактируем задачу
    if (editingId !== null) {

        const task = todos.find(function(item) {

            return item.id === editingId;

        });

        if (task) {

            task.text = text;
        }

        editingId = null;
    }


    // если создаём новую задачу
    else {

        const newTask = {

            id: Date.now(),

            text: text,

            completed: false
        };

        todos.push(newTask);
    }

    saveTodos();

    input.value = "";

    // Обновляем
    renderTodoList();

    closeModal();
}


function deleteItem(id) {

    todos = todos.filter(function(item) {

        return item.id !== id;

    });

    saveTodos();

    renderTodoList();
}


// Отмечаем выполнено
function setDone(id) {

    const task = todos.find(function(item) {

        return item.id === id;

    });

    if (task) {
        task.completed = !task.completed;
    }

    saveTodos();

    renderTodoList();
}


function editTask(id) {

    const task = todos.find(function(item) {

        return item.id === id;

    });


    if (!task) {

        return;
    }

    editingId = id;

    const input = document.getElementById("taskInput");

    // вставляем старый текст в поле
    input.value = task.text;

    openModal();
}


// показываем список задач
function renderTodoList() {

    const list = document.getElementById("todoList");

    const emptyState = document.getElementById("emptyState");

    // очищаем список перед выводом
    list.innerHTML = "";

    // если задач нет, показываем пустой экран
    if (todos.length === 0) {

        emptyState.style.display = "block";

        return;
    }

    // скрываем пустой экран
    emptyState.style.display = "none";

    // перебираем все задачи
    todos.forEach(function(task) {

        // создаём карточку задачи
        const item = document.createElement("div");
        item.className = "todo-item";

        // создаём кнопку выполнения
        const doneButton = document.createElement("button");
        doneButton.className = "done-button";


        if (task.completed) { 
            doneButton.classList.add("done");

            // добавляем галочку
            const checkIcon = document.createElement("img");
            checkIcon.src = "icons/ic_check.svg";
            checkIcon.alt = "Выполнено";

            doneButton.appendChild(checkIcon);
        }

        doneButton.onclick = function() {

            setDone(task.id);
        };

        // создаём текст задачи
        const text = document.createElement("div");

        text.className = "task-text";


        if (task.completed) {

            text.classList.add("completed");
        }

        text.textContent = task.text;

        // создаём блок с кнопками

        const actions = document.createElement("div");

        actions.className = "task-actions";

        // создаём кнопку редактирования

        const editButton = document.createElement("button");

        editButton.className = "action-button edit-button";

        // добавляем иконку редактирования

        const editIcon = document.createElement("img");

        editIcon.src = "icons/ic_edit.svg";

        editIcon.alt = "Изменить";

        editButton.appendChild(editIcon);

        editButton.onclick = function() {

            editTask(task.id);
        };

        // создаём кнопку удаления

        const deleteButton = document.createElement("button");

        deleteButton.className = "action-button delete-button";

        // добавляем иконку удаления

        const deleteIcon = document.createElement("img");

        deleteIcon.src = "icons/ic_delete.svg";

        deleteIcon.alt = "Удалить";

        deleteButton.appendChild(deleteIcon);

        deleteButton.onclick = function() {

            deleteItem(task.id);
        };

        // добавляем кнопки в блок

        actions.appendChild(editButton);

        actions.appendChild(deleteButton);

        // добавляем элементы в карточку

        item.appendChild(doneButton);

        item.appendChild(text);

        item.appendChild(actions);

        // добавляем карточку в список

        list.appendChild(item);
    });
}

// запускаем приложение

loadTodos();

renderTodoList();