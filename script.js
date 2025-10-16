// ---------- Game State ----------
let currentPlayer = 'X';
let gameBoard = Array(9).fill('');
let gameActive = true;
let gameMode = 'pvp'; // 'pvp' | 'pvc'
let playerSymbol = 'X';
let aiSymbol = 'O';
const scores = { X: 0, O: 0, draws: 0 };

// ---------- DOM Elements ----------
const gameBoardElement = document.getElementById('game-board');
const gameInfoElement = document.getElementById('game-info');
const statusElement = document.getElementById('status');
const resetButton = document.getElementById('reset-btn');
const newGameButton = document.getElementById('new-game-btn');
const pvpModeButton = document.getElementById('pvp-mode');
const pvcModeButton = document.getElementById('pvc-mode');
const xScoreElement = document.getElementById('x-score');
const oScoreElement = document.getElementById('o-score');
const drawScoreElement = document.getElementById('draw-score');
const chooseArea = document.getElementById('choose-symbol-area');
const chooseXBtn = document.getElementById('choose-x');
const chooseOBtn = document.getElementById('choose-o');

const winningConditions = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

// ---------- Initialize ----------
function initGame() {
  gameBoardElement.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const btn = document.createElement('button');
    btn.className = 'cell';
    btn.setAttribute('data-index', i);
    btn.setAttribute('aria-label', `Cell ${i + 1}, empty`);
    btn.addEventListener('click', () => handleCellClick(i));
    gameBoardElement.appendChild(btn);
  }
  updateUI();
}

// ---------- Gameplay ----------
function handleCellClick(index) {
  if (!gameActive || gameBoard[index] !== '') return;

  gameBoard[index] = currentPlayer;
  renderCell(index);

  const winner = getWinner(gameBoard);
  if (winner) {
    finishRound(winner);
    return;
  }

  currentPlayer = (currentPlayer === 'X') ? 'O' : 'X';
  updateUI();

  if (gameMode === 'pvc' && gameActive && currentPlayer === aiSymbol) {
    setTimeout(() => {
      const move = findBestMove(gameBoard, aiSymbol);
      if (move != null) handleCellClick(move);
    }, 300);
  }
}

// ---------- Rendering ----------
function renderCell(index) {
  const cell = document.querySelector(`.cell[data-index="${index}"]`);
  if (!cell) return;
  
  cell.textContent = gameBoard[index];
  cell.className = `cell ${gameBoard[index].toLowerCase()}`;
  
  // Update aria-label for accessibility
  const cellStatus = gameBoard[index] ? `occupied by ${gameBoard[index]}` : 'empty';
  cell.setAttribute('aria-label', `Cell ${index + 1}, ${cellStatus}`);
}

function highlightWinningCells(cells) {
  for (const idx of cells) {
    const cell = document.querySelector(`.cell[data-index="${idx}"]`);
    if (cell) cell.classList.add('winning-cell');
  }
}

function clearHighlights() {
  document.querySelectorAll('.cell').forEach(c => c.classList.remove('winning-cell'));
}

// ---------- Win Check ----------
function getWinner(board) {
  for (const [a,b,c] of winningConditions) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  if (!board.includes('')) return 'tie';
  return null;
}

// ---------- Finish Round ----------
function finishRound(result) {
  gameActive = false;
  if (result === 'tie') {
    statusElement.textContent = "It's a draw!";
    scores.draws++;
    drawScoreElement.textContent = scores.draws;
  } else {
    statusElement.textContent = `Player ${result} wins!`;
    scores[result]++;
    if (result === 'X') xScoreElement.textContent = scores.X;
    else oScoreElement.textContent = scores.O;

    const pattern = winningConditions.find(cond =>
      gameBoard[cond[0]] === result && gameBoard[cond[1]] === result && gameBoard[cond[2]] === result
    );
    if (pattern) highlightWinningCells(pattern);
  }
  updateGameInfo();
}

// ---------- AI Logic (Minimax) ----------
function findBestMove(board, ai) {
  const human = ai === 'X' ? 'O' : 'X';
  if (board.every(c => c === '')) return 4;

  let bestScore = -Infinity;
  let bestMove = null;
  for (let i = 0; i < 9; i++) {
    if (board[i] === '') {
      board[i] = ai;
      const score = minimax(board, 0, false, ai, human);
      board[i] = '';
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }
  return bestMove;
}

function minimax(board, depth, isMaximizing, ai, human) {
  const result = getWinner(board);
  if (result !== null) {
    if (result === 'tie') return 0;
    return (result === ai) ? 10 - depth : depth - 10;
  }

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        board[i] = ai;
        const val = minimax(board, depth + 1, false, ai, human);
        board[i] = '';
        best = Math.max(best, val);
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        board[i] = human;
        const val = minimax(board, depth + 1, true, ai, human);
        board[i] = '';
        best = Math.min(best, val);
      }
    }
    return best;
  }
}

// ---------- UI & Controls ----------
function updateGameInfo() {
  if (!gameActive) {
    // Don't update turn info when game is over
    return;
  }
  
  if (gameMode === 'pvp') {
    gameInfoElement.textContent = `Player ${currentPlayer}'s Turn`;
  } else {
    if (currentPlayer === playerSymbol) {
      gameInfoElement.textContent = `Your Turn (${playerSymbol})`;
    } else {
      gameInfoElement.textContent = `Computer's Turn (${aiSymbol})`;
    }
  }
}

function updateUI() {
  for (let i = 0; i < 9; i++) renderCell(i);
  updateGameInfo();
  statusElement.textContent = '';
  clearHighlights();
}

function resetRound() {
  gameBoard = Array(9).fill('');
  currentPlayer = 'X';
  gameActive = true;
  clearHighlights();
  statusElement.textContent = '';
  
  // Update UI first
  updateUI();
  
  // Then handle AI first move if needed
  if (gameMode === 'pvc' && aiSymbol === 'X') {
    setTimeout(() => {
      if (gameActive && currentPlayer === 'X') {
        const move = findBestMove(gameBoard, aiSymbol);
        if (move != null) handleCellClick(move);
      }
    }, 350);
  }
}

function newGame() {
  scores.X = 0; scores.O = 0; scores.draws = 0;
  xScoreElement.textContent = '0';
  oScoreElement.textContent = '0';
  drawScoreElement.textContent = '0';
  resetRound();
}

function switchMode(mode) {
  gameMode = mode;
  if (mode === 'pvp') {
    pvpModeButton.classList.add('active');
    pvcModeButton.classList.remove('active');
  } else {
    pvpModeButton.classList.remove('active');
    pvcModeButton.classList.add('active');
  }

  //Show choose-symbol area for both modes
  chooseArea.style.display = 'flex';
  resetRound();
}

// ---------- Symbol Selection ----------
chooseXBtn.addEventListener('click', () => {
  chooseXBtn.classList.add('selected');
  chooseOBtn.classList.remove('selected');
  playerSymbol = 'X';
  aiSymbol = 'O';
  currentPlayer = 'X'; // Human starts first when choosing X
  resetRound();

});

chooseOBtn.addEventListener('click', () => {
  chooseOBtn.classList.add('selected');
  chooseXBtn.classList.remove('selected');
  playerSymbol = 'O';
  aiSymbol = 'X';
  currentPlayer = '0'; // AI (X) starts first when human chooses O
  resetRound();
  
  // If in PVC mode and AI should start, make the first move
  if (gameMode === 'pvc') {
    setTimeout(() => {
      if (gameActive && currentPlayer === 'X') {
        const move = findBestMove(gameBoard, aiSymbol);
        if (move != null) handleCellClick(move);
      }
    }, 350);
  }

});

// ---------- Events ----------
resetButton.addEventListener('click', resetRound);
newGameButton.addEventListener('click', newGame);
pvpModeButton.addEventListener('click', () => switchMode('pvp'));
pvcModeButton.addEventListener('click', () => switchMode('pvc'));

// Keyboard support
document.addEventListener('keydown', (e) => {
  if (!gameActive) return;
  if (/^[1-9]$/.test(e.key)) {
    const idx = Number(e.key) - 1;
    if (gameBoard[idx] === '') handleCellClick(idx);
  }
});

// ---------- Boot ----------
initGame();
chooseXBtn.classList.add('selected');
chooseArea.style.display = 'none';
