// Начальное пустое состояние
const emptyState = {
  cash: 0,
  savings: 0,
  monthlyPayoffRate: 100000, // Динамика погашения по умолчанию
  debts: [],
  goals: [],
  history: [],
  chartHistory: [0]
};

// Загрузка состояния из памяти браузера
let appState = JSON.parse(localStorage.getItem('financeGameData')) || emptyState;

if (!appState.monthlyPayoffRate) {
  appState.monthlyPayoffRate = 100000;
}

function saveData() {
  localStorage.setItem('financeGameData', JSON.stringify(appState));
  updateUI();
}

// Пороговые значения уровней
const levels = [
  { level: 1, min: -Infinity, max: -1500000, labelMin: "−∞", labelMax: "−1.5M" },
  { level: 2, min: -1500000, max: -1000000, labelMin: "−1.5M", labelMax: "−1M" },
  { level: 3, min: -1000000, max: -500000, labelMin: "−1M", labelMax: "−500K" },
  { level: 4, min: -500000, max: 0, labelMin: "−500K", labelMax: "0 ₸" },
  { level: 5, min: 0, max: 500000, labelMin: "0 ₸", labelMax: "+500K" },
  { level: 6, min: 500000, max: Infinity, labelMin: "+500K", labelMax: "+∞" }
];

// Полный сброс всех данных
function resetAllData() {
  if (confirm("Вы уверены, что хотите полностью очистить все данные? Это действие нельзя отменить.")) {
    localStorage.removeItem('financeGameData');
    appState = JSON.parse(JSON.stringify(emptyState));
    saveData();
  }
}

// Изменение суммы динамики погашения пользователем
function changeMonthlyRate(value) {
  const rate = Number(value);
  if (rate >= 0) {
    appState.monthlyPayoffRate = rate;
    localStorage.setItem('financeGameData', JSON.stringify(appState));
    const totalDebts = appState.debts.reduce((sum, item) => sum + item.balance, 0);
    const totalAssets = appState.cash + appState.savings;
    renderForecast(totalAssets - totalDebts);
  }
}

// Обновление UI
function updateUI() {
  const totalDebts = appState.debts.reduce((sum, item) => sum + item.balance, 0);
  const totalAssets = appState.cash + appState.savings;
  const netBalance = totalAssets - totalDebts;

  // 1. Баланс
  const balanceEl = document.getElementById('net-balance');
  balanceEl.innerText = `${netBalance.toLocaleString('ru-RU')} ₸`;
  balanceEl.className = `balance-amount ${netBalance < 0 ? 'negative' : 'positive'}`;

  const distEl = document.getElementById('distance-to-zero');
  if (netBalance < 0) {
    distEl.innerText = `До финансового нуля: ${Math.abs(netBalance).toLocaleString('ru-RU')} ₸`;
  } else {
    distEl.innerText = `🏆 Вы в положительном балансе!`;
  }

  // 2. Уровень
  let currentLvl = levels[3];
  for (let l of levels) {
    if (netBalance >= l.min && netBalance < l.max) {
      currentLvl = l;
      break;
    }
  }

  document.getElementById('level-title').innerText = `УРОВЕНЬ ${currentLvl.level}`;
  document.getElementById('level-min').innerText = currentLvl.labelMin;
  document.getElementById('level-max').innerText = currentLvl.labelMax;

  let percent = 0;
  if (isFinite(currentLvl.min) && isFinite(currentLvl.max)) {
    const range = currentLvl.max - currentLvl.min;
    const progress = netBalance - currentLvl.min;
    percent = Math.min(Math.max(Math.round((progress / range) * 100), 0), 100);
  } else {
    percent = 100;
  }
  document.getElementById('level-percent').innerText = `${percent}%`;
  document.getElementById('level-progress-bar').style.width = `${percent}%`;

  // 3. Подсчет категорий долгов
  const credits = appState.debts.filter(d => d.type === 'credit').reduce((s, i) => s + i.balance, 0);
  const installments = appState.debts.filter(d => d.type === 'installment').reduce((s, i) => s + i.balance, 0);
  const people = appState.debts.filter(d => d.type === 'person').reduce((s, i) => s + i.balance, 0);

  document.getElementById('sum-credits').innerText = `${credits.toLocaleString('ru-RU')} ₸`;
  document.getElementById('sum-installments').innerText = `${installments.toLocaleString('ru-RU')} ₸`;
  document.getElementById('sum-people').innerText = `${people.toLocaleString('ru-RU')} ₸`;

  // 4. Активная цель
  if (appState.goals.length > 0) {
    const goal = appState.goals[0];
    const rem = goal.target - goal.current;
    document.getElementById('target-name').innerText = goal.name;
    document.getElementById('target-remaining').innerText = `Осталось ${rem.toLocaleString('ru-RU')} ₸`;
  } else {
    document.getElementById('target-name').innerText = "Нет активных целей";
    document.getElementById('target-remaining').innerText = "Добавьте цель во вкладке Цели";
  }

  // Обновление поля темпа гашения
  const rateInput = document.getElementById('monthly-rate-input');
  if (rateInput) rateInput.value = appState.monthlyPayoffRate;

  renderDebtsList();
  renderHistoryList();
  renderGoalsList();
  renderForecast(netBalance);
}

function renderDebtsList() {
  const container = document.getElementById('debts-list-container');
  if (appState.debts.length === 0) {
    container.innerHTML = `<div style="text-align:center; color: var(--text-muted); font-size:13px; margin-top:20px;">У вас пока нет долгов</div>`;
    return;
  }
  container.innerHTML = appState.debts.map(d => `
    <div class="list-item">
      <div>
        <div class="item-title">${d.name}</div>
        <div class="item-sub">Первоначально: ${d.initial.toLocaleString()} ₸</div>
      </div>
      <div class="item-val" style="color: var(--accent-red);">${d.balance.toLocaleString()} ₸</div>
    </div>
  `).join('');
}

function renderHistoryList() {
  const container = document.getElementById('history-list-container');
  if (appState.history.length === 0) {
    container.innerHTML = `<div style="text-align:center; color: var(--text-muted); font-size:13px; margin-top:20px;">История пуста</div>`;
    return;
  }
  container.innerHTML = appState.history.slice().reverse().map(h => `
    <div class="list-item">
      <div>
        <div class="item-title">${h.title}</div>
        <div class="item-sub">${h.date}</div>
      </div>
      <div class="item-val" style="color: ${h.type === 'income' ? 'var(--accent-green)' : 'var(--text-main)'};">
        ${h.type === 'income' ? '+' : '−'}${h.amount.toLocaleString()} ₸
      </div>
    </div>
  `).join('');
}

function renderGoalsList() {
  const container = document.getElementById('goals-list-container');
  if (appState.goals.length === 0) {
    container.innerHTML = `<div style="text-align:center; color: var(--text-muted); font-size:13px; margin-top:20px;">Список целей пуст</div>`;
    return;
  }
  container.innerHTML = appState.goals.map(g => `
    <div class="list-item">
      <div>
        <div class="item-title">${g.name}</div>
        <div class="item-sub">Собрано: ${g.current.toLocaleString()} ₸ из ${g.target.toLocaleString()} ₸</div>
      </div>
      <div class="item-val" style="color: var(--accent-green);">${Math.round((g.current/g.target)*100)}%</div>
    </div>
  `).join('');
}

// Пересчет прогноза с использованием пользовательской суммы
function renderForecast(netBalance) {
  const el = document.getElementById('forecast-text');
  if (netBalance >= 0) {
    el.innerHTML = "🎉 <b>Вы в плюсе!</b> Формируйте накопления и инвестиции.";
  } else {
    const monthlyRate = appState.monthlyPayoffRate || 100000;
    if (monthlyRate <= 0) {
      el.innerHTML = "Укажите сумму гашения больше 0 ₸, чтобы рассчитать прогноз.";
      return;
    }
    const months = Math.ceil(Math.abs(netBalance) / monthlyRate);
    el.innerHTML = `При динамике гашения <b>${monthlyRate.toLocaleString('ru-RU')} ₸/мес</b> вы выйдете в <b>0 ₸</b> примерно через <b>${months} мес.</b>`;
  }
}

// Модальные окна
function openModal(id) {
  if(id === 'modal-add') {
    const select = document.getElementById('op-debt-id');
    if (appState.debts.length > 0) {
      select.innerHTML = appState.debts.map(d => `<option value="${d.id}">${d.name} (${d.balance.toLocaleString()} ₸)</option>`).join('');
    } else {
      select.innerHTML = `<option value="">Нет активных долгов</option>`;
    }
  }
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function toggleDebtSelector() {
  const type = document.getElementById('op-type').value;
  document.getElementById('debt-select-group').style.display = type === 'debt_payment' ? 'block' : 'none';
}

// Создание нового долга
function addNewDebt() {
  const name = document.getElementById('debt-name').value;
  const type = document.getElementById('debt-type').value;
  const amount = Number(document.getElementById('debt-amount').value);

  if (!name || !amount) return alert('Заполните все поля');

  appState.debts.push({
    id: "d_" + Date.now(),
    name: name,
    type: type,
    balance: amount,
    initial: amount
  });

  recalculateChartHistory();
  closeModal('modal-new-debt');
  saveData();
}

// Создание новой цели
function addNewGoal() {
  const name = document.getElementById('goal-name').value;
  const target = Number(document.getElementById('goal-target').value);

  if (!name || !target) return alert('Заполните все поля');

  appState.goals.push({
    id: "g_" + Date.now(),
    name: name,
    target: target,
    current: 0
  });

  closeModal('modal-new-goal');
  saveData();
}

// Пополнение / расход / погашение
function submitTransaction() {
  const type = document.getElementById('op-type').value;
  const amount = Number(document.getElementById('op-amount').value);
  const desc = document.getElementById('op-desc').value || 'Операция';

  if (!amount || amount <= 0) return alert('Введите корректную сумму');

  if (type === 'debt_payment') {
    const debtId = document.getElementById('op-debt-id').value;
    const debt = appState.debts.find(d => d.id === debtId);
    if (debt) debt.balance = Math.max(0, debt.balance - amount);
  } else if (type === 'income') {
    appState.cash += amount;
  } else if (type === 'expense') {
    appState.cash -= amount;
  }

  appState.history.push({
    date: new Date().toISOString().split('T')[0],
    type: type,
    title: desc,
    amount: amount
  });

  recalculateChartHistory();
  closeModal('modal-add');
  saveData();
}

function recalculateChartHistory() {
  const totalDebts = appState.debts.reduce((sum, item) => sum + item.balance, 0);
  const totalAssets = appState.cash + appState.savings;
  appState.chartHistory.push(totalAssets - totalDebts);
}

function switchTab(tabId, element) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
  
  document.getElementById(tabId).classList.add('active');
  element.classList.add('active');

  if(tabId === 'stats-tab') {
    renderChart();
  }
}

let chartInstance = null;
function renderChart() {
  if (chartInstance) chartInstance.destroy();

  const ctx = document.getElementById('financeChart').getContext('2d');
  
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: appState.chartHistory.map((_, i) => `${i + 1}`),
      datasets: [{
        label: 'Чистый баланс (₸)',
        data: appState.chartHistory,
        borderColor: '#2ecc71',
        borderWidth: 3,
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: '#2ecc71'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          grid: {
            color: (context) => context.tick.value === 0 ? '#ffffff' : '#262a34',
            lineWidth: (context) => context.tick.value === 0 ? 2 : 1
          },
          ticks: {
            color: '#8a8f99',
            callback: (value) => value.toLocaleString('ru-RU') + ' ₸'
          }
        },
        x: { grid: { display: false }, ticks: { color: '#8a8f99' } }
      },
      plugins: { legend: { display: false } }
    }
  });
}

updateUI();
