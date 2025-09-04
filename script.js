const GameBoard = (()=> {
  let board = Array(9).fill("");
  const getBoard = () => [...board];
  const getCell = (i) => board[i];
  const setCell = (i, marker) => {
    if (i < 0 || i > 8) return false;
    if (board[i] === "") {
      board[i] = marker;
      return true;
    }
    return false;
  };
  const reset = () => { board = Array(9).fill(""); };
  const isFull = () => board.every(cell => cell !== "");
  const availableMoves = () => board.map((v, i) => v === "" ? i : -1).filter(i => i >= 0);
  return { getBoard, getCell, setCell, reset, isFull, availableMoves };
})();

const Player = (initialName, marker, isHuman = true) => {
  let name = initialName;
  let score = 0;
  return {
    getName : () => name,
    setName: (n) => { name = n || name; },
    marker, 
    isHuman,
    getScore: () => score,
    incrementScore: () => { score += 1; },
    resetScore: () => { score = 0; }
  };
};

const GameController = (() => {
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  let player1 = Player("Player 1", "X");
  let player2 = Player("Player 2", "O");
  let currentPlayer = player1;
  let gameOver = true;
  const listeners = {}; // ✅ fixed typo

  const on = (event, cb) => {
    listeners[event] = listeners[event] || [];
    listeners[event].push(cb);
  };
  const emit = (event, payload) => (listeners[event] || []).forEach(cb => cb(payload));

  const init = (p1, p2) => {
    player1 = p1;
    player2 = p2;
    currentPlayer = player1;
    gameOver = false;
    GameBoard.reset();
    emit("start", { currentPlayer });
  };

  const switchTurn = () => {
    currentPlayer = currentPlayer === player1 ? player2 : player1;
    emit("switch", { currentPlayer });
  };

  const checkWinner = () => {
    const b = GameBoard.getBoard();
    for (const pattern of winPatterns) {
      const [a, b1, c] = pattern;
      if (b[a] && b[a] === b[b1] && b[a] === b[c]) {
        return { winnerMarker: b[a], pattern };
      }
    }
    return null;
  };

  const playRound = (index) => {
    if (gameOver) return;
    if (!GameBoard.setCell(index, currentPlayer.marker)) {
      emit("invalid", { index }); // ✅ lowercase
      return;
    }
    emit("move", { index, marker: currentPlayer.marker, currentPlayer }); // ✅ lowercase

    const win = checkWinner();
    if (win) {
      const winner = (player1.marker === win.winnerMarker) ? player1 : player2;
      winner.incrementScore();
      gameOver = true;
      emit("win", { winner, pattern: win.pattern });
      return;
    }

    if (GameBoard.isFull()) {
      gameOver = true;
      emit("draw", {});
      return;
    }

    switchTurn();
  };

  const reset = (keepScores = true) => {
    GameBoard.reset();
    currentPlayer = player1;
    gameOver = false;
    if (!keepScores) {
      player1.resetScore();
      player2.resetScore();
    }
    emit("reset", { currentPlayer });
  };

  const getCurrentPlayer = () => currentPlayer;
  const getPlayers = () => ({ player1, player2 }); // ✅ fixed
  const endGame = () => { gameOver = true; };

  return { init, playRound, reset, on, getCurrentPlayer, getPlayers, endGame };
})();

const DisplayController = (() => {
  const cells = Array.from(document.querySelectorAll('.cell'));
  const startBtn = document.querySelector("#start-btn");
  const resetBtn = document.querySelector("#reset-btn");
  const status = document.querySelector("#status");
  const p1NameInput = document.querySelector("#player1-name");
  const p2NameInput = document.querySelector("#player2-name");
  const p1Score = document.querySelector("#p1-score");
  const p2Score = document.querySelector("#p2-score");

  const makePlayers = () => {
    const p1 = Player(p1NameInput.value || "Player 1", "X");
    const p2 = Player(p2NameInput.value || "Player 2", "O");
    return { p1, p2 };
  };

  const renderBoard = () => {
    const b = GameBoard.getBoard();
    cells.forEach((cell, i) => {
      cell.textContent = b[i];
      cell.classList.toggle("disabled", b[i] !== "");
      cell.classList.remove("win");
    });
  };
  const updateStatus = (text) => status.textContent = text;
  const updateScores = () => {
    const { player1, player2 } = GameController.getPlayers();
    p1Score.textContent = player1.getScore();
    p2Score.textContent = player2.getScore();
  };
  const highLightPattern = (pattern) => {
    pattern.forEach(idx => {
      cells[idx].classList.add("win");
    });
  };
  
  cells.forEach(cell => {
    cell.addEventListener("click", () => {
      const idx = Number(cell.dataset.index);
      GameController.playRound(idx);
    });
  });

  startBtn.addEventListener("click", () => {
    const { p1, p2 } = makePlayers();
    GameController.init(p1, p2);
    renderBoard();
    updateScores();
  });
  resetBtn.addEventListener("click", ()=> {
    GameController.reset(true);
    renderBoard();
    updateStatus("Game reset - click Start to play"); // ✅ fixed
    updateScores();
  });
  
  GameController.on("start", ({ currentPlayer }) => {
    renderBoard();
    updateStatus(`${currentPlayer.getName()}'s turn (${currentPlayer.marker})`);
    updateScores();
  });
  GameController.on("move", () => { // ✅ lowercase
    renderBoard();
    updateStatus(`${GameController.getCurrentPlayer().getName()}'s turn`);
  });
  GameController.on("switch", ({ currentPlayer }) => {
    updateStatus(`${currentPlayer.getName()}'s turn (${currentPlayer.marker})`);
  });
  GameController.on("win", ({ winner, pattern }) => {
    renderBoard();
    highLightPattern(pattern);
    updateStatus(`${winner.getName()} wins!`);
    updateScores(); // ✅ fixed
  });
  GameController.on("draw", () => {
    renderBoard();
    updateStatus("It's a draw!");
  });
  GameController.on("reset", () => {
    renderBoard();
    updateStatus("Board cleared");
  });
  GameController.on("invalid", () => { // ✅ lowercase
    updateStatus("Invalid move - cell already taken!");
  });

  renderBoard();
  updateStatus("Press Start");

  return {};
})();
