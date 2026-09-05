```javascript
// ==========================================
// FINANCE QUEST
// ==========================================


// ДАННЫЕ
let operations = JSON.parse(
    localStorage.getItem("operations")
) || [];

let debts = JSON.parse(
    localStorage.getItem("debts")
) || [];


// ==========================================
// СТРАНИЦЫ
// ==========================================

function showPage(page) {

    document.querySelectorAll(".page").forEach(
        element => element.classList.add("hidden")
    );

    document
        .getElementById(page)
        .classList.remove("hidden");


    document.querySelectorAll(".nav-btn").forEach(
        button => button.classList.remove("active")
    );


    const buttons = document.querySelectorAll(".nav-btn");

    if (page === "dashboard") buttons[0].classList.add("active");
    if (page === "operations") buttons[1].classList.add("active");
    if (page === "debts") buttons[2].classList.add("active");
    if (page === "goals") buttons[3].classList.add("active");
}


// ==========================================
// МОДАЛКА
// ==========================================

function openModal() {
    document.getElementById("modal").classList.add("show");
}

function closeModal() {
    document.getElementById("modal").classList.remove("show");
}


function openDebtModal() {
    document.getElementById("debtModal").classList.add("show");
}

function closeDebtModal() {
    document.getElementById("debtModal").classList.remove("show");
}


// ==========================================
// ДОБАВЛЕНИЕ ОПЕРАЦИИ
// ==========================================

function addOperation() {

    const type =
        document.getElementById("operationType").value;

    const name =
        document.getElementById("operationName").value;

    const amount =
        Number(document.getElementById("operationAmount").value);


    if (!name || !amount || amount <= 0) {
        alert("Заполни название и сумму");
        return;
    }


    const operation = {

        id: Date.now(),

        type: type,

        name: name,

        amount: amount,

        date: new Date().toLocaleDateString("ru-RU")

    };


    operations.unshift(operation);


    saveData();

    closeModal();

    document.getElementById("operationName").value = "";
    document.getElementById("operationAmount").value = "";

    updateUI();
}


// ==========================================
// ДОБАВЛЕНИЕ ДОЛГА
// ==========================================

function addDebt() {

    const name =
        document.getElementById("debtName").value;

    const amount =
        Number(document.getElementById("debtAmount").value);


    if (!name || !amount || amount <= 0) {
        alert("Заполни название и сумму");
        return;
    }


    const debt = {

        id: Date.now(),

        name: name,

        amount: amount,

        originalAmount: amount

    };


    debts.push(debt);


    saveData();

    closeDebtModal();

    document.getElementById("debtName").value = "";
    document.getElementById("debtAmount").value = "";

    updateUI();
}


// ==========================================
// СОХРАНЕНИЕ
// ==========================================

function saveData() {

    localStorage.setItem(
        "operations",
        JSON.stringify(operations)
    );

    localStorage.setItem(
        "debts",
        JSON.stringify(debts)
    );
}


// ==========================================
// РАСЧЕТЫ
// ==========================================

function calculate() {

    let income = 0;

    let expense = 0;


    operations.forEach(operation => {

        if (operation.type === "income") {
            income += operation.amount;
        }

        if (operation.type === "expense") {
            expense += operation.amount;
        }

    });


    const money = income - expense;


    const debt = debts.reduce(
        (sum, item) => sum + item.amount,
        0
    );


    // Главная формула
    const balance = money - debt;


    return {
        income,
        expense,
        money,
        debt,
        balance
    };
}


// ==========================================
// ОБНОВЛЕНИЕ DASHBOARD
// ==========================================

function updateDashboard() {

    const data = calculate();


    document.getElementById("incomeTotal")
        .textContent = formatMoney(data.income);


    document.getElementById("expenseTotal")
        .textContent = formatMoney(data.expense);


    document.getElementById("debtTotal")
        .textContent = formatMoney(data.debt);


    document.getElementById("moneyTotal")
        .textContent = formatMoney(data.money);


    const balanceElement =
        document.getElementById("totalBalance");


    balanceElement.textContent =
        formatMoney(data.balance);


    const status =
        document.getElementById("balanceStatus");


    if (data.balance > 0) {

        status.textContent =
            "🟢 Ты в плюсе. Продолжай в том же духе!";

    } else if (data.balance < 0) {

        status.textContent =
            "🔴 Ты в минусе. Твоя цель — выйти в 0 ₸";

    } else {

        status.textContent =
            "🟡 Ты вышел ровно в 0 ₸";

    }


    document.getElementById("progressMoney")
        .textContent = formatMoney(data.balance);


    // Прогресс к нулю
    let progress = 0;

    if (data.balance >= 0) {

        progress = 100;

    } else if (data.debt > 0) {

        progress =
            Math.max(
                0,
                Math.min(
                    100,
                    ((data.money) / data.debt) * 100
                )
            );

    }


    document.getElementById("financialProgress")
        .style.width = progress + "%";


    document.getElementById("progressPercent")
        .textContent = Math.round(progress) + "%";


    document.getElementById("goalBalance")
        .textContent = formatMoney(data.balance);


    document.getElementById("goalProgress")
        .style.width = progress + "%";
}


// ==========================================
// ОПЕРАЦИИ
// ==========================================

function updateOperations() {

    const container =
        document.getElementById("operationsList");

    const recent =
        document.getElementById("recentOperations");


    if (operations.length === 0) {

        container.innerHTML =
            '<div class="empty">Пока нет операций</div>';

        recent.innerHTML =
            '<div class="empty">Пока нет операций</div>';

        return;
    }


    container.innerHTML =
        operations.map(operation => createOperationHTML(operation))
        .join("");


    recent.innerHTML =
        operations
            .slice(0, 5)
            .map(operation => createOperationHTML(operation))
            .join("");
}


function createOperationHTML(operation) {
    const income = operation.type === "income";
    return `
        <div class="operation">
            <div class="operation-left">
                <div class="operation-icon">
                    ${income ? "↗" : "↘"}
                </div>
                <div>
                    <div>
                        ${escapeHTML(operation.name)}
                    </div>
                    <div class="operation-date">
                        ${operation.date}
                    </div>
                </div>
            </div>
            <div class="${income ? "income-text" : "expense-text"}">
                ${income ? "+" : "-"}
                ${formatMoney(operation.amount)}
            </div>
        </div>
    `;
}


// ==========================================
// ДОЛГИ
// ==========================================

function updateDebts() {

    const container =
        document.getElementById("debtsList");


    if (debts.length === 0) {

        container.innerHTML =
            '<div class="empty">У тебя пока нет долгов 🎉</div>';

        return;
    }


    container.innerHTML = debts.map(debt => {

        return 
            <div class="debt">
                <div class="debt-top">
                    <div class="debt-name">
                        💳 ${escapeHTML(debt.name)}
                    </div>
                    <div class="debt-amount">
                        ${formatMoney(debt.amount)}
                    </div>
                </div>
                <button onclick="payDebt(${debt.id})">
                    💰 Погасить
                </button>
                <button onclick="deleteDebt(${debt.id})">
                    Удалить
                </button>
            </div>
        `;
    join("");


// ==========================================
// ПОГАШЕНИЕ ДОЛГА
// ==========================================

function payDebt(id) {

    const debt =
        debts.find(item => item.id === id);


    if (!debt) return;


    const payment =
        Number(
            prompt(
                `Сколько погашаешь из ${formatMoney(debt.amount)}?`
            )
        );


    if (!payment || payment <= 0) return;


    if (payment >= debt.amount) {

        debts =
            debts.filter(item => item.id !== id);

    } else {

        debt.amount -= payment;

    }


    // Добавляем расход
    operations.unshift({

        id: Date.now(),

        type: "expense",

        name: `Погашение: ${debt.name}`,

        amount: payment,

        date: new Date().toLocaleDateString("ru-RU")

    });


    saveData();

    updateUI();
}


// ==========================================
// УДАЛЕНИЕ ДОЛГА
// ==========================================

function deleteDebt(id) {

    if (!confirm("Удалить этот долг?")) return;


    debts =
        debts.filter(item => item.id !== id);


    saveData();

    updateUI();
}


// ==========================================
// УРОВЕНЬ
// ==========================================

function updateLevel() {

    const data = calculate();


    let level;


    if (data.balance < -1000000) {
        level = 1;
    } else if (data.balance < -500000) {
        level = 2;
    } else if (data.balance < -250000) {
        level = 3;
    } else if (data.balance < 0) {
        level = 4;
    } else if (data.balance < 100000) {
        level = 5;
    } else if (data.balance < 500000) {
        level = 6;
    } else if (data.balance < 1000000) {
        level = 7;
    } else if (data.balance < 5000000) {
        level = 8;
    } else {
        level = 10;
    }


    const names = {

        1: "Финансовая жопа",
        2: "Выживание",
        3: "Борьба с долгами",
        4: "Почти в нуле",
        5: "Первые деньги",
        6: "Стабильность",
        7: "Финансовая подушка",
        8: "Капитал",
        10: "Финансовый босс"

    };


    document.getElementById("level")
        .textContent = level;


    document.getElementById("levelName")
        .textContent = names[level];


    const xp = Math.min(
        100,
        Math.max(
            0,
            ((data.balance % 100000) + 100000) / 1000
        )
    );


    document.getElementById("xpBar")
        .style.width = xp + "%";


    document.getElementById("xpText")
        .textContent =
        Math.round(xp) + " / 100 XP";
}


// ==========================================
// ФОРМАТ ДЕНЕГ
// ==========================================

function formatMoney(number) {

    return new Intl.NumberFormat(
        "ru-RU"
    ).format(Math.round(number)) + " ₸";
}


// ==========================================
// ЗАЩИТА ТЕКСТА
// ==========================================

function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


// ==========================================
// ОБНОВЛЕНИЕ ВСЕГО
// ==========================================

function updateUI() {

    updateDashboard();

    updateOperations();

    updateDebts();

    updateLevel();
}


// ==========================================
// СТАРТ
// ==========================================

updateUI();
