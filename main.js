// main.js
// 德州撲克籌碼管理主程式

// ===== 多語系支援 =====
// 語言檔對應表，支援繁體中文與英文
const LANG_FILES = {
  'zh-TW': 'lang/zh-TW.json',
  'en': 'lang/en.json'
};
let lang = 'zh-TW'; // 當前語言
let langData = {};  // 當前語言資料

// 切換語言並更新所有UI（包含所有動態文字）
function setLang(newLang) {
  lang = newLang;
  
  // 定義語言資料（備用方案）
  const fallbackLangData = {
    'zh-TW': {
      title: '德州撲克籌碼管理',
      pot: '底池',
      player: '玩家',
      add_player: '新增玩家',
      fold: '棄牌',
      check: '過牌',
      call: '跟注',
      bet: '下注',
      raise: '加注',
      allin: 'All-in',
      clear: '清除',
      enter: '輸入',
      undo: '回上一步',
      random_bb: '隨機選BB',
      export_history: '匯出歷史',
      bb: '大盲',
      sb: '小盲',
      sit_out: '離席',
      sit_in: '回座',
      buy_in: '買入',
      blackout: '已出局',
      next_player: '下一位玩家',
      done: '完成',
      set_blind: '設定盲注',
      player_name: '玩家名稱',
      chips: '買入籌碼',
      sidepot: '邊池',
      max_players: '最少2人，最多21人',
      error_overbet: '下注金額超過可用籌碼！'
    },
    'en': {
      title: 'Poker Chip Manager',
      pot: 'Pot',
      player: 'Player',
      add_player: 'Add Player',
      fold: 'Fold',
      check: 'Check',
      call: 'Call',
      bet: 'Bet',
      raise: 'Raise',
      allin: 'All-in',
      clear: 'Clear',
      enter: 'Enter',
      undo: 'Undo',
      random_bb: 'Random BB',
      export_history: 'Export History',
      bb: 'Big Blind',
      sb: 'Small Blind',
      sit_out: 'Sit Out',
      sit_in: 'Sit In',
      buy_in: 'Buy-in',
      blackout: 'Out',
      next_player: 'Next Player',
      done: 'Done',
      set_blind: 'Set Blind',
      player_name: 'Player Name',
      chips: 'Chips',
      sidepot: 'Sidepot',
      max_players: 'Min 2, Max 21',
      error_overbet: 'Bet exceeds available chips!'
    }
  };
  
  // 嘗試載入外部JSON檔，如果失敗則使用內建資料
  return fetch(LANG_FILES[lang])
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      langData = data;
      updateUIAndRender();
      return data;
    })
    .catch(error => {
      // 使用內建的語言資料
      langData = fallbackLangData[lang] || fallbackLangData['zh-TW'];
      updateUIAndRender();
      return langData;
    });
}

// 抽取UI更新邏輯到單獨函數
function updateUIAndRender() {
  updateUIText(); // 更新所有UI文字
  renderPlayers(); // 重新渲染玩家
  updatePotDisplay(); // 更新底池顯示
  updateNumpadDisplay(); // 更新數字鍵盤顯示
  updateLanguageButtons(); // 更新語言按鈕樣式
}

// 更新語言按鈕的視覺狀態
function updateLanguageButtons() {
  document.querySelectorAll('#language-switcher button').forEach(btn => {
    const btnLang = btn.getAttribute('data-lang');
    if (btnLang === lang) {
      btn.style.backgroundColor = '#ffd700';
      btn.style.color = '#222';
      btn.style.fontWeight = 'bold';
    } else {
      btn.style.backgroundColor = '#444';
      btn.style.color = '#fff';
      btn.style.fontWeight = 'normal';
    }
  });
}

// 更新UI文字（標題、按鈕等）
function updateUIText() {
  // 標題與底池
  document.title = langData.title || 'Poker Chip Manager';
  document.querySelector('#pot-display').childNodes[0].textContent = `${langData.pot}：`;
  // 操作按鈕
  document.getElementById('fold-btn').textContent = langData.fold;
  document.getElementById('check-btn').textContent = langData.check;
  document.getElementById('call-btn').textContent = langData.call;
  document.getElementById('bet-btn').textContent = langData.bet;
  document.getElementById('raise-btn').textContent = langData.raise;
  document.getElementById('allin-btn').textContent = langData.allin;
  // 數字鍵盤
  document.getElementById('numpad-clear').textContent = langData.clear;
  document.getElementById('numpad-enter').textContent = langData.enter;
  // 遊戲設定
  document.getElementById('undo-btn').textContent = langData.undo;
  document.getElementById('random-bb-btn').textContent = langData.random_bb;
  document.getElementById('export-history-btn').textContent = langData.export_history;
  // 新增玩家按鈕
  const addPlayerBtn = document.getElementById('show-add-player-btn');
  if (addPlayerBtn) addPlayerBtn.textContent = langData.add_player || '新增玩家';
  // 創建或更新盲注設定按鈕
  createSetBlindButton();
  // 更新新增玩家跳出盒子的文字
  const modalTitle = document.querySelector('#add-player-modal h2');
  if (modalTitle) modalTitle.textContent = langData.add_player || '新增玩家';
  const nameLabel = document.querySelector('#add-player-modal label');
  if (nameLabel) nameLabel.childNodes[0].textContent = langData.player_name || '玩家名稱';
  const chipsLabel = document.querySelectorAll('#add-player-modal label')[1];
  if (chipsLabel) chipsLabel.childNodes[0].textContent = langData.chips || '買入籌碼';
  const nextBtn = document.getElementById('add-player-next');
  if (nextBtn) nextBtn.textContent = langData.next_player || '下一位玩家';
  const exitBtn = document.getElementById('add-player-exit');
  if (exitBtn) exitBtn.textContent = langData.done || '完成';
}

// ===== 玩家資料結構與管理 =====
const MAX_PLAYERS = 21; // 玩家上限
const MIN_PLAYERS = 2;  // 玩家下限
let players = []; // 玩家陣列
let playerIdSeed = 1; // 玩家ID自增

// 建立新玩家物件
// name: 玩家名稱, chips: 初始籌碼
function createPlayer(name, chips = 1000) {
  return {
    id: playerIdSeed++, // 唯一ID
    name: name || `${langData.player} ${playerIdSeed-1}`,
    chips: chips, // 籌碼數
    status: 'active', // active:在桌, sitout:離席, allin:全下, out:出局
    isBB: false,      // 是否大盲
    isSB: false,      // 是否小盲
    buyIns: 1         // 買入次數
  };
}

// 新增玩家（加到陣列尾端）
function addPlayer(name, chips) {
  if (players.length >= MAX_PLAYERS) {
    showError(langData.max_players); // 超過人數上限
    return;
  }
  players.push(createPlayer(name, chips));
  renderPlayers();
}

// 插入玩家（指定位置）
function insertPlayer(index, name, chips) {
  if (players.length >= MAX_PLAYERS) {
    showError(langData.max_players);
    return;
  }
  players.splice(index, 0, createPlayer(name, chips));
  renderPlayers();
}

// 移除玩家（指定index）
function removePlayer(index) {
  if (players.length <= MIN_PLAYERS) {
    showError(langData.max_players); // 低於人數下限
    return;
  }
  players.splice(index, 1);
  renderPlayers();
}

// 玩家離席（狀態設為sitout）
function sitOutPlayer(index) {
  players[index].status = 'sitout';
  renderPlayers();
}
// 玩家回座（狀態設為active）
function sitInPlayer(index) {
  players[index].status = 'active';
  renderPlayers();
}
// 玩家重買（補充籌碼，出局後可回到active）
function rebuyPlayer(index, chips) {
  players[index].chips += chips;
  players[index].buyIns++;
  if (players[index].status === 'out') players[index].status = 'active';
  renderPlayers();
}
// 顯示錯誤訊息（可改為自訂動畫提示）
function showError(msg) {
  alert(msg);
}

// ===== 玩家顯示於撲克桌周圍 =====
let selectedPlayer = null; // 目前被點擊的玩家index
// 依照玩家數量，將玩家分布於圓桌周圍
function renderPlayers() {
  const playersDiv = document.getElementById('players');
  playersDiv.innerHTML = '';
  const n = players.length;
  const centerX = 50, centerY = 50, radius = 48;
  players.forEach((p, i) => {
    // 計算座位圓周位置
    const angle = (2 * Math.PI * i) / n - Math.PI/2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    
    // 創建玩家元素
    const playerDiv = document.createElement('div');
    playerDiv.className = 'player-seat';
    playerDiv.style.position = 'absolute';
    playerDiv.style.left = x + '%';
    playerDiv.style.top = y + '%';
    playerDiv.style.transform = 'translate(-50%, -50%)';
    
    // 不再顯示圓形籌碼，改用方塊顯示資訊
    playerDiv.innerHTML = `
      <div class="block-player-info${i === currentPlayer ? ' block-current' : ''}">
        <div class="player-chipinfo-name">${p.name}</div>
        <div class="player-chipinfo-current">Current: ${p.lastBet || 0}</div>
        <div class="player-chipinfo-total">Total: ${p.chips}</div>
        ${p.isBB ? `<span class="player-bb">${langData.bb||'BB'}</span>` : ''}
        ${p.isSB ? `<span class="player-sb">${langData.sb||'SB'}</span>` : ''}
        ${p.status==='sitout'?`<span class="player-sitout">${langData.sit_out||'離席'}</span>`:''}
        ${p.status==='out'&&p.chips===0?`<span class="player-out">${langData.blackout||'已出局'}</span>`:''}
        ${p.status==='allin'?`<span class="player-allin">ALL-IN</span>`:''}
      </div>
      <div class="player-actions-inline" style="display:${selectedPlayer===i?'block':'none'}">
        <button onclick="removePlayer(${i})">-</button>
        <button onclick="sitOutPlayer(${i})">${langData.sit_out||'離席'}</button>
        <button onclick="sitInPlayer(${i})">${langData.sit_in||'回座'}</button>
        <button onclick="rebuyPlayer(${i}, 1000)">${langData.buy_in||'買入'}</button>
      </div>
    `;
    // 點擊玩家顯示操作（再次點擊取消）
    playerDiv.onclick = (e) => {
      e.stopPropagation(); // 阻止事件冒泡
      selectedPlayer = (selectedPlayer === i ? null : i); // 切換選取狀態
      renderPlayers(); // 重新渲染
    };
    playersDiv.appendChild(playerDiv);
  });
  updateActionButtonState(); // 更新操作按鈕狀態
}
// 點擊桌面空白處時取消選取
window.addEventListener('click', () => {
  if (selectedPlayer !== null) {
    selectedPlayer = null;
    renderPlayers();
  }
});

// ===== 操作流程與底池管理 =====
let pot = 0;
let currentBet = 0;
let currentPlayer = 0; // 目前輪到的玩家index
let betInput = '';

// ===== Sidepot（邊池）計算與顯示 =====
let sidepots = [];

function calculateSidepots() {
  // 取得所有all-in玩家的下注金額
  const allInPlayers = players.filter(p => p.status === 'out' && p.chips === 0);
  if (allInPlayers.length === 0) {
    sidepots = [];
    return;
  }
  // 取得所有下注金額（假設每位玩家下注金額已記錄在p.lastBet）
  let bets = players.map(p => p.lastBet || 0).filter(b => b > 0);
  bets = [...new Set(bets)].sort((a, b) => a - b);
  let pots = [];
  let prev = 0;
  bets.forEach((bet, i) => {
    const involved = players.filter(p => (p.lastBet || 0) >= bet);
    const potValue = (bet - prev) * involved.length;
    pots.push({ amount: potValue, players: involved.map(p => p.name) });
    prev = bet;
  });
  sidepots = pots;
}

function updatePotDisplay() {
  document.getElementById('pot-amount').textContent = pot;
  // 顯示sidepot
  let sidepotHtml = '';
  if (sidepots.length > 0) {
    sidepotHtml = sidepots.map((sp, i) => `<div class='sidepot'>${langData.sidepot||'邊池'}${i+1}: ${sp.amount}</div>`).join('');
  }
  if (!document.getElementById('sidepot-area')) {
    const potDisplay = document.getElementById('pot-display');
    const div = document.createElement('div');
    div.id = 'sidepot-area';
    potDisplay.appendChild(div);
  }
  document.getElementById('sidepot-area').innerHTML = sidepotHtml;
}

function setBetInput(val) {
  betInput = val;
  updateNumpadDisplay();
}

function appendBetInput(num) {
  if (betInput.length < 8) betInput += num;
  updateNumpadDisplay();
}

function clearBetInput() {
  betInput = '';
  updateNumpadDisplay();
}

function updateNumpadDisplay() {
  document.getElementById('numpad-display').textContent = betInput;
}

function enterBetInput() {
  // 目前只做下注/加注/All-in
  const amount = parseInt(betInput, 10);
  if (isNaN(amount) || amount <= 0) {
    showError(langData.error_overbet || '下注金額錯誤');
    return;
  }
  playerBet(currentPlayer, amount);
  betInput = '';
}

function nextPlayer() {
  if (players.length < 2) return;
  let tries = 0;
  do {
    currentPlayer = (currentPlayer + 1) % players.length;
    tries++;
  } while ((players[currentPlayer].status !== 'active') && tries < players.length);
  renderPlayers();
}

// ===== 撲克標準下注圈邏輯 =====
let bettingRoundActive = false;
let lastRaiser = null;
let lastToAct = null;
let firstToAct = null;

function startBettingRound() {
  bettingRoundActive = true;
  // 找到第一個有效玩家
  firstToAct = getFirstActivePlayer();
  lastRaiser = null;
  lastToAct = null;
  currentPlayer = firstToAct;
  renderPlayers();
}

function getFirstActivePlayer() {
  for (let i = 0; i < players.length; i++) {
    if (players[i].status === 'active' && players[i].chips > 0) return i;
  }
  return 0;
}

function getNextActivePlayer(from) {
  let n = players.length;
  let idx = from;
  do {
    idx = (idx + 1) % n;
    if (players[idx].status === 'active' && players[idx].chips > 0) return idx;
  } while (idx !== from);
  return from;
}

function isBettingRoundOver() {
  // 只剩一人有效玩家
  let activeCount = players.filter(p => p.status === 'active' && p.chips > 0).length;
  if (activeCount <= 1) return true;
  // 沒有加注，且已回到起始玩家
  if (lastRaiser === null && currentPlayer === firstToAct) return true;
  // 有加注，且已回到最後加注者的下一位
  if (lastRaiser !== null && currentPlayer === lastToAct) return true;
  return false;
}

function onBettingRoundEnd() {
  bettingRoundActive = false;
  // 若還有多於1位有效玩家，自動啟動新下注圈
  let activeCount = players.filter(p => p.status === 'active' && p.chips > 0).length;
  if (activeCount > 1) {
    setTimeout(() => startBettingRound(), 500);
  }
}

function nextPlayerBetting() {
  currentPlayer = getNextActivePlayer(currentPlayer);
  renderPlayers();
}

function getMaxBet() {
  return Math.max(...players.map(p => p.lastBet || 0));
}

function updateActionButtonState() {
  const p = players[currentPlayer];
  const disable = (p.status !== 'active');
  const isFirstToAct = (currentPlayer === firstToAct && lastRaiser === null && getMaxBet() === 0);
  const maxBet = getMaxBet();
  const playerBetAmt = p.lastBet || 0;
  // bet: 只有第一位有效玩家且maxBet=0
  document.getElementById('bet-btn').disabled = disable || !isFirstToAct;
  // raise: 只有maxBet>0且玩家有籌碼
  document.getElementById('raise-btn').disabled = disable || maxBet === 0;
  // call: 只有maxBet>0且玩家尚未補齊
  document.getElementById('call-btn').disabled = disable || maxBet === 0 || playerBetAmt >= maxBet;
  // check: 只有maxBet=0（非第一位）或已補齊下注
  document.getElementById('check-btn').disabled = disable || (!((maxBet === 0 && currentPlayer !== firstToAct) || (playerBetAmt === maxBet)));
  // fold: 只有maxBet=0或已補齊下注時可fold（不能call時才能fold）
  document.getElementById('fold-btn').disabled = disable || (maxBet > 0 && playerBetAmt < maxBet);
  document.getElementById('allin-btn').disabled = disable || p.chips === 0;
}

function playerBet(index, amount, isRaise = false) {
  const p = players[index];
  if (p.status !== 'active') return;
  const isFirstToAct = (index === firstToAct && lastRaiser === null && getMaxBet() === 0);
  const maxBet = getMaxBet();
  amount = parseInt(amount, 10);
  if (isNaN(amount) || amount <= 0) {
    showError('請輸入有效的下注金額');
    return;
  }
  if (!isFirstToAct && !isRaise && maxBet > 0) {
    // 不是第一位且不是raise，應該是call
    playerCall(index);
    return;
  }
  if (!isFirstToAct && !isRaise && maxBet === 0) {
    showError('只有第一位玩家能下注，其他只能加注');
    return;
  }
  if (amount > p.chips) {
    showError(langData.error_overbet || '下注金額超過可用籌碼！');
    return;
  }
  if (isRaise && amount <= maxBet) {
    showError('加注金額必須大於目前最高下注');
    return;
  }
  if (isFirstToAct && amount <= 0) {
    showError('下注金額需大於0');
    return;
  }
  p.chips -= amount;
  pot += amount;
  if (isRaise || isFirstToAct) {
    currentBet = amount;
    if (isRaise) {
      lastRaiser = index;
      lastToAct = getNextActivePlayer(index);
    }
  }
  p.lastBet = (p.lastBet || 0) + amount;
  renderPlayers();
  calculateSidepots();
  updatePotDisplay();
  afterAction();
  nextPlayerBetting();
  if (isBettingRoundOver()) {
    onBettingRoundEnd();
  }
}

function playerRaise(index, amount) {
  playerBet(index, amount, true);
}

function playerAllIn(index) {
  const p = players[index];
  if (p.status !== 'active') return;
  // All-in動畫
  const playersDiv = document.getElementById('players');
  const playerSeat = playersDiv.children[index]?.querySelector('.player-chip');
  if (playerSeat) {
    playerSeat.classList.add('allin-anim');
    setTimeout(() => playerSeat.classList.remove('allin-anim'), 700);
  }
  playerBet(index, p.chips);
  p.status = 'allin';
  renderPlayers();
  calculateSidepots();
  updatePotDisplay();
  afterAction();
  nextPlayerBetting();
  if (isBettingRoundOver()) {
    onBettingRoundEnd();
  }
}

function playerFold(index) {
  const p = players[index];
  if (p.status !== 'active') return;
  p.status = 'out';
  renderPlayers();
  afterAction();
  nextPlayerBetting();
  if (isBettingRoundOver()) {
    onBettingRoundEnd();
  }
}

function playerCheck(index) {
  const p = players[index];
  const maxBet = getMaxBet();
  if ((p.lastBet || 0) < maxBet) {
    showError('不能過牌，請跟注或加注');
    return;
  }
  nextPlayerBetting();
  if (isBettingRoundOver()) {
    onBettingRoundEnd();
  }
}

function playerCall(index) {
  const p = players[index];
  if (p.status !== 'active') return;
  const maxBet = getMaxBet();
  const playerLastBet = p.lastBet || 0;
  const callAmount = maxBet - playerLastBet;
  if (callAmount <= 0) {
    playerCheck(index);
    return;
  }
  if (callAmount > p.chips) {
    playerAllIn(index);
    return;
  }
  playerBet(index, callAmount);
}

// 修改下注/加注/raise按鈕綁定
function bindActionButtons() {
  document.getElementById('fold-btn').onclick = () => playerFold(currentPlayer);
  document.getElementById('check-btn').onclick = () => playerCheck(currentPlayer);
  document.getElementById('call-btn').onclick = () => playerCall(currentPlayer);
  document.getElementById('bet-btn').onclick = () => playerBet(currentPlayer, parseInt(betInput, 10));
  document.getElementById('raise-btn').onclick = () => playerRaise(currentPlayer, parseInt(betInput, 10));
  document.getElementById('allin-btn').onclick = () => playerAllIn(currentPlayer);
}

function bindNumpad() {
  document.querySelectorAll('#numpad button').forEach(btn => {
    if (btn.id === 'numpad-clear') {
      btn.onclick = () => { clearBetInput(); };
    } else if (btn.id === 'numpad-enter') {
      btn.onclick = () => { enterBetInput(); };
    } else {
      btn.onclick = () => { appendBetInput(btn.textContent); };
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  // 設定語言切換按鈕事件監聽器
  const langButtons = document.querySelectorAll('#language-switcher button');
  
  langButtons.forEach((btn) => {
    btn.addEventListener('click', e => {
      e.preventDefault(); // 防止預設行為
      setLang(btn.getAttribute('data-lang'));
    });
  });
  
  // 初始化語言系統並等待載入完成
  setLang('zh-TW').then(() => {
    // 語言載入完成後再添加預設玩家
    addPlayer('Alice', 10000);
    addPlayer('Bob', 10000);
    addPlayer('Charlie', 10000);
    
    // 初始化其他功能
    updatePotDisplay();
    bindActionButtons();
    bindNumpad();
    updateNumpadDisplay();
    startBettingRound();
    
    // 綁定其他按鈕事件
    document.getElementById('random-bb-btn').onclick = randomizeBB;
    document.getElementById('undo-btn').onclick = undo;
    document.getElementById('export-history-btn').onclick = exportHistory;
  });
  
  // ...existing code...
  // ===== 新增玩家跳出盒子互動（修正版，保證DOM已渲染） =====
  const showAddPlayerBtn = document.getElementById('show-add-player-btn');
  const addPlayerModal = document.getElementById('add-player-modal');
  const addPlayerNameInput = document.getElementById('add-player-name');
  const addPlayerChipsInput = document.getElementById('add-player-chips');
  const addPlayerNextBtn = document.getElementById('add-player-next');
  const addPlayerExitBtn = document.getElementById('add-player-exit');
  if (!showAddPlayerBtn || !addPlayerModal || !addPlayerNameInput || !addPlayerChipsInput || !addPlayerNextBtn || !addPlayerExitBtn) {
    alert('新增玩家元件載入失敗，請檢查index.html id設置');
    return;
  }
  showAddPlayerBtn.onclick = () => {
    addPlayerModal.style.display = 'flex';
    addPlayerNameInput.value = '';
    addPlayerChipsInput.value = 10000;
    addPlayerNameInput.focus();
    addPlayerNextBtn.disabled = false;
  };
  addPlayerNextBtn.onclick = () => {
    if (players.length >= MAX_PLAYERS) {
      alert('玩家人數已達上限！');
      addPlayerModal.style.display = 'none';
      return;
    }
    const name = addPlayerNameInput.value.trim() || `Player${players.length+1}`;
    const chips = parseInt(addPlayerChipsInput.value, 10) || 10000;
    addPlayer(name, chips);
    if (players.length >= MAX_PLAYERS) {
      alert('玩家人數已達上限！');
      addPlayerModal.style.display = 'none';
      return;
    }
    addPlayerNameInput.value = '';
    addPlayerChipsInput.value = 10000;
    addPlayerNameInput.focus();
  };
  addPlayerExitBtn.onclick = () => {
    addPlayerModal.style.display = 'none';
  };
  addPlayerModal.onclick = (e) => {
    if (e.target === addPlayerModal) addPlayerModal.style.display = 'none';
  };
});

// ===== BB/SB 隨機選擇與盲注/買入設定 =====
let bbAmount = 100;
let sbAmount = 50;

function setBlindAmounts(bb, sb) {
  bbAmount = bb;
  sbAmount = sb;
  renderPlayers();
}

function randomizeBB() {
  if (players.length < 2) return;
  // 先清除所有BB/SB
  players.forEach(p => { p.isBB = false; p.isSB = false; });
  // 隨機選一個BB
  const bbIndex = Math.floor(Math.random() * players.length);
  players[bbIndex].isBB = true;
  // SB為BB的下一位
  const sbIndex = (bbIndex + 1) % players.length;
  players[sbIndex].isSB = true;
  renderPlayers();
}

// 創建設定盲注按鈕
function createSetBlindButton() {
  // 先檢查按鈕是否已存在，避免重複創建
  if (!document.getElementById('set-blind-btn')) {
    document.getElementById('undo-btn').insertAdjacentHTML('beforebegin', `<button id="set-blind-btn">${langData.set_blind||'設定盲注'}</button>`);
    document.getElementById('set-blind-btn').onclick = setBlindPrompt;
  } else {
    // 如果按鈕已存在，只更新文字
    document.getElementById('set-blind-btn').textContent = langData.set_blind || '設定盲注';
  }
}

// 盲注/買入設定UI（簡單prompt，可改為彈窗或表單）
function setBlindPrompt() {
  const bb = parseInt(prompt(langData.set_blind || '設定大盲金額', bbAmount), 10);
  const sb = parseInt(prompt(langData.set_blind || '設定小盲金額', sbAmount), 10);
  if (!isNaN(bb) && !isNaN(sb) && bb > 0 && sb > 0) {
    setBlindAmounts(bb, sb);
  }
}

// ===== 歷史紀錄、回復、匯出 =====
let history = [];
let undoStack = [];

function saveHistory() {
  // 儲存快照（只保留最近20步）
  const snapshot = {
    players: JSON.parse(JSON.stringify(players)),
    pot,
    currentBet,
    sidepots: JSON.parse(JSON.stringify(sidepots))
  };
  history.push(snapshot);
  if (history.length > 20) history.shift();
  // 只保留最近兩步可undo
  undoStack.push(snapshot);
  if (undoStack.length > 2) undoStack.shift();
}

function undo() {
  if (undoStack.length < 2) return;
  undoStack.pop(); // 移除當前狀態
  const prev = undoStack[undoStack.length - 1];
  if (!prev) return;
  players = JSON.parse(JSON.stringify(prev.players));
  pot = prev.pot;
  currentBet = prev.currentBet;
  sidepots = JSON.parse(JSON.stringify(prev.sidepots));
  renderPlayers();
  updatePotDisplay();
}

function exportHistory() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", "poker_history.json");
  document.body.appendChild(dlAnchor);
  dlAnchor.click();
  dlAnchor.remove();
}

// 在每次重要操作後自動存歷史
function afterAction() {
  saveHistory();
}

// ===== 之後會在這裡加入操作流程、底池、sidepot等功能 ===== 