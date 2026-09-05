// Начальное состояние приложения по умолчанию
const initialState = {
  cash: 150000,
  savings: 50000,
  debts: [
    { id: "d1", name: "Кредит", type: "credit", balance: 950000, initial: 1000000 },
    { id: "d2", name: "Рассрочка", type: "installment", balance: 197500, initial: 197500 },
    { id: "d3", name: "Долг человеку", type: "person", balance: 100000, initial: 100000 }
  ],
  goals: [
    { id: "g1", name: "Погасить рассрочку", target: 197500, current: 150000 }
  ],
  history: [
    { date: "2026-09-01", type: "income", title: "Зарплата", amount: 300000 },
    { date: "2026-09-02", type: "debt_payment", title: "Частичный платёж долга", amount: 50000 }
  ],
  chartHistory: [-1800000, -1500000, -1247500]
};

// Загрузка или инициализация состояния
let appState = JSON.parse(localStorage.getItem('financeGameData')) || initialState;

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

// Главный пересчёт и обновление интерфейса
function updateUI() {
  const totalDebts = appState.debts.reduce((sum, item) => sum + item.balance, 0);
  const totalAssets = appState.cash + appState.savings;
  const netBalance = totalAssets - totalDebts;

  // 1. Отображение баланса
  const balanceEl = document.getElementById('net-balance');
  balanceEl.innerText = `${netBalance.toLocaleString('ru-RU')} ₸`;
  balanceEl.className = `balance-amount ${netBalance < 0 ? 'negative' : 'positive'}`;

  const distEl = document.getElementById('distance-to-zero');
  if (netBalance < 0) {
    distEl.innerText = `До финансового нуля: ${Math.abs(netBalance).toLocaleString('ru-RU')} ₸`;
  } else {
    distEl.innerText = `🏆 Вы в положительном балансе!`;
  }

  // 2. Расчет уровня
  let currentLvl = levels[2]; // по умолчанию ур.3
  for (let l of levels) {
    if (netBalance >= l.min && netBalance < l.max) {
      currentLvl = l;
      break;
    }
  }

  document.getElementById('level-title').innerText = `УРОВЕНЬ ${currentLvl.level}`;
  document.getElementById('level-min').innerText = currentLvl.labelMin;
  document.getElementById('level-max').innerText = currentLvl.labelMax;

  // Процент внутри уровня
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

  // 3. Подведение итогов по категориям
  const credits = appState.debts.filter(d => d.type === 'credit').reduce((s, i) => s + i.balance, 0);
  const installments = appState.debts.filter(d => d.type === 'installment').reduce((s, i) => s + i.balance, 0);
  const people = appState.debts.filter(d => d.type === 'person').reduce((s, i) => s + i.balance, 0);

  document.getElementById('sum-credits').innerText = `${credits.toLocaleString('ru-RU')} ₸`;
  document.getElementById('sum-installments').innerText = `${installments.toLocaleString('ru-RU')} ₸`;
  document.getElementById('sum-people').innerText = `${people.toLocaleString('ru-RU')} ₸`;

  // 4. Обновление текущей цели
  if (appState.goals.length > 0) {
    const goal = appState.goals[0];
    const rem = goal.target - goal.current;
    document.getElementById('target-name').innerText = goal.name;
    document.getElementById('target-remaining').innerText = `Осталось ${rem.toLocaleString('ru-RU')} ₸`;
  }

  // 5. Обновление списков
  renderDebtsList();
  renderHistoryList();
  renderGoalsList();
  renderForecast(netBalance);
}

// Отрисовка списков
function renderDebtsList() {
  const container = document.getElementById('debts-list-container');
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

function renderForecast(netBalance) {
  const el = document.getElementById('forecast-text');
  if (netBalance >= 0) {
    el.innerHTML = "🎉 <b>Вы достигли положительного баланса!</b> Продолжайте инвестировать.";
  } else {
    const monthlyRate = 100000; // Примерный ежемесячный темп гашения
    const months = Math.ceil(Math.abs(netBalance) / monthlyRate);
    el.innerHTML = `При сохранении динамики гашения ~100 000 ₸/мес вы выйдете в <b>0 ₸</b> примерно через <b>${months} мес.</b>`;
  }
}

// Управление модальным окном
function openModal() {
  const select = document.getElementById('op-debt-id');
  select.innerHTML = appState.debts.map(d => `<option value="${d.id}">${d.name} (остаток: ${d.balance.toLocaleString()} ₸)</option>`).join('');
  document.getElementById('modal-add').classList.add('open');
  toggleDebtSelector();
}

function closeModal() {
  document.getElementById('modal-add').classList.remove('open');
}

function toggleDebtSelector() {
  const type = document.getElementById('op-type').value;
  document.getElementById('debt-select-group').style.display = type === 'debt_payment' ? 'block' : 'none';
}

// Добавление новой транзакции
function submitTransaction() {
  const type = document.getElementById('op-type').value;
  const amount = Number(document.getElementById('op-amount').value);
  const desc = document.getElementById('op-desc').value || 'Операция';

  if (!amount || amount <= 0) return alert('Введите корректную сумму');

  if (type === 'debt_payment') {
    const debtId = document.getElementById('op-debt-id').value;
    const debt = appState.debts.find(d => d.id === debtId);
    if (debt) {
      debt.balance = Math.max(0, debt.balance - amount);
    }
  } else if (type === 'income') {
    appState.cash += amount;
  } else if (type === 'expense') {
    appState.cash -= amount;
  }

  // Фиксация в истории
  appState.history.push({
    date: new Date().toISOString().split('T')[0],
    type: type,
    title: desc,
    amount: amount
  });

  // Расчет нового баланса для графика
  const totalDebts = appState.debts.reduce((sum, item) => sum + item.balance, 0);
  const totalAssets = appState.cash + appState.savings;
  appState.chartHistory.push(totalAssets - totalDebts);

  closeModal();
  saveData();
}

// Переключение вкладок
function switchTab(tabId, element) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
  
  document.getElementById(tabId).classList.add('active');
  element.classList.add('active');

  if(tabId === 'stats-tab') {
    renderChart();
  }
}

// Отрисовка графика Chart.js с нулевой линией посередине
let chartInstance = null;
function renderChart() {
  if (chartInstance) chartInstance.destroy();

  const ctx = document.getElementById('financeChart').getContext('2d');
  
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: appState.chartHistory.map((_, i) => `Шаг ${i + 1}`),
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

// Инициализация при запуске
updateUI();
