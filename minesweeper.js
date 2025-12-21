/**
 * Minesweeper Game Module
 * 
 * Logic:
 * 1.  Grid Generation: Create a 9x9 grid.
 * 2.  Mine Placement: Randomly place 10 mines.
 * 3.  Number Calculation: For each safe cell, count adjacent mines.
 * 4.  Interaction: Left click to reveal, Right click to flag.
 * 5.  Win/Loss: Click mine = Loss. Reveal all safe = Win.
 */

class Minesweeper {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.rows = 9;
        this.cols = 9;
        this.mineCount = 10;
        this.gameOver = false;
        this.grid = []; // 2D array storing cell data
        this.revealedCount = 0;
        this.flagsLeft = this.mineCount;

        this.init();
    }

    // Initialize/Reset the game
    init() {
        this.grid = [];
        this.gameOver = false;
        this.revealedCount = 0;
        this.flagsLeft = this.mineCount;
        this.container.innerHTML = ''; // Clear previous game if any

        // Create Header (Status Bar)
        const header = document.createElement('div');
        header.className = 'ms-header';

        this.flagCounter = document.createElement('div');
        this.flagCounter.className = 'ms-counter';
        this.flagCounter.innerText = this.pad(this.flagsLeft);

        const faceBtn = document.createElement('div');
        faceBtn.className = 'ms-face-btn';
        faceBtn.innerText = '🙂';
        faceBtn.onclick = () => this.init(); // Reset on click
        this.faceBtn = faceBtn;

        const timeCounter = document.createElement('div');
        timeCounter.className = 'ms-counter';
        timeCounter.innerText = '000'; // Static for now, could animate

        header.appendChild(this.flagCounter);
        header.appendChild(faceBtn);
        header.appendChild(timeCounter);
        this.container.appendChild(header);

        // Create Board Container
        const board = document.createElement('div');
        board.className = 'ms-board';
        board.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
        this.container.appendChild(board);
        this.boardElement = board;

        // 1. Generate Empty Grid
        for (let r = 0; r < this.rows; r++) {
            const row = [];
            for (let c = 0; c < this.cols; c++) {
                // Data structure for each cell
                const cellData = {
                    r, c,
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborMines: 0,
                    element: null // Reference to DOM element
                };

                // create DOM element
                const el = document.createElement('div');
                el.className = 'ms-cell';
                el.dataset.r = r;
                el.dataset.c = c;

                // Left Click (Reveal)
                el.addEventListener('click', (e) => {
                    this.handleClick(r, c);
                });

                // Right Click (Flag)
                el.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.handleRightClick(r, c);
                });

                board.appendChild(el);
                cellData.element = el;
                row.push(cellData);
            }
            this.grid.push(row);
        }

        // 2. Place Mines
        let minesPlaced = 0;
        while (minesPlaced < this.mineCount) {
            const r = Math.floor(Math.random() * this.rows);
            const c = Math.floor(Math.random() * this.cols);

            if (!this.grid[r][c].isMine) {
                this.grid[r][c].isMine = true;
                minesPlaced++;
            }
        }

        // 3. Calculate Neighbors
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!this.grid[r][c].isMine) {
                    this.grid[r][c].neighborMines = this.countMines(r, c);
                }
            }
        }
    }

    // Helper: Count adjacent mines (8 directions)
    countMines(r, c) {
        let count = 0;
        // Check all surrounding cells
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const nr = r + i;
                const nc = c + j;
                // Boundary check
                if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                    if (this.grid[nr][nc].isMine) count++;
                }
            }
        }
        return count;
    }

    handleClick(r, c) {
        if (this.gameOver) return;
        const cell = this.grid[r][c];
        if (cell.isFlagged || cell.isRevealed) return;

        if (cell.isMine) {
            this.explode(cell);
        } else {
            this.reveal(cell);
            // Check Win Condition
            const totalCells = this.rows * this.cols;
            if (this.revealedCount === totalCells - this.mineCount) {
                this.victory();
            }
        }
    }

    handleRightClick(r, c) {
        if (this.gameOver) return;
        const cell = this.grid[r][c];
        if (cell.isRevealed) return;

        cell.isFlagged = !cell.isFlagged;
        cell.element.classList.toggle('flagged');
        cell.element.innerText = cell.isFlagged ? '🚩' : '';

        // Update Counter
        this.flagsLeft += cell.isFlagged ? -1 : 1;
        this.flagCounter.innerText = this.pad(this.flagsLeft);
    }

    reveal(cell) {
        if (cell.isRevealed || cell.isFlagged) return;

        cell.isRevealed = true;
        cell.element.classList.add('revealed');
        this.revealedCount++;

        if (cell.neighborMines > 0) {
            cell.element.innerText = cell.neighborMines;
            cell.element.dataset.num = cell.neighborMines; // For coloring via CSS
        } else {
            // Flood Fill: If 0, reveal all neighbors
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const nr = cell.r + i;
                    const nc = cell.c + j;
                    if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                        this.reveal(this.grid[nr][nc]);
                    }
                }
            }
        }

        // Play subtle tick sound if available
        if (typeof playSystemSound === 'function') {
            // Reuse an existing short sound or mute if annoying
            // playSystemSound('open'); // reusing open for click feedback
        }
    }

    explode(triggerCell) {
        this.gameOver = true;
        this.faceBtn.innerText = '😵';
        triggerCell.element.classList.add('mine-hit');
        triggerCell.element.innerText = '💣';

        // Reveal all mines is standard behavior
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.grid[r][c];
                if (cell.isMine) {
                    cell.element.innerText = '💣';
                    if (!cell.isFlagged) cell.element.classList.add('revealed');
                }
            }
        }

        // Error Sound
        // if (typeof playSystemSound === 'function') playSystemSound('error'); 
    }

    victory() {
        this.gameOver = true;
        this.faceBtn.innerText = '😎';
        // Win Sound?
    }

    pad(num) {
        return num.toString().padStart(3, '0');
    }
}

// Global Function to Create Window
function createMinesweeperWindow() {
    // Generate unique ID for this instance
    const gameContainerId = 'minesweeper-' + Date.now();

    // HTML structure
    const content = `
        <div id="${gameContainerId}" class="ms-wrapper" oncontextmenu="return false;">
            <!-- Game injected here -->
        </div>
    `;

    // Create standard window (300x380 fits 9x9 well)
    const win = createWindow('Minesweeper', content, 280, 360);

    // Initialize Game Logic
    // Timeout ensuring DOM is ready inside window content
    setTimeout(() => {
        new Minesweeper(gameContainerId);
    }, 100);
}
