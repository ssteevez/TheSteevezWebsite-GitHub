// ============================================
// IMAGE RECONSTRUCTION MODULE
// A quiet sliding tile puzzle using portfolio images
// ============================================

const GRID_SIZE = 4;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;
let currentImage = '';
let tiles = [];
let emptyIndex = TOTAL_TILES - 1; // Bottom-right corner starts empty
let isSolved = false;

// ============================================
// INITIALIZATION
// ============================================

function init() {
    // Use the globally loaded portfolio image manifest
    const manifest = window.PORTFOLIO_IMAGES;

    // Randomly select one image
    const randomIndex = Math.floor(Math.random() * manifest.images.length);
    const imagePath = manifest.images[randomIndex];

    // Path is relative to v2/, we're in v2/apps/Reconstruction/
    // So we need to go up two levels: ../../
    currentImage = encodeURI('../../' + imagePath);

    console.log('Selected image:', currentImage);
    console.log('Full path would be:', window.location.href.replace('index.html', '') + currentImage);

    // Create the puzzle grid
    createPuzzle();

    // Shuffle tiles with a solvable permutation
    shuffleTiles();
}

// ============================================
// PUZZLE CREATION
// ============================================

function createPuzzle() {
    const grid = document.getElementById('puzzle-grid');
    grid.innerHTML = '';

    // Create 36 tiles (6x6 grid)
    for (let i = 0; i < TOTAL_TILES; i++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.dataset.index = i;
        tile.dataset.currentPos = i;

        // Calculate which part of the image this tile shows
        const row = Math.floor(i / GRID_SIZE);
        const col = i % GRID_SIZE;

        // Set background position to show the correct slice
        // For 4x4 grid with background-size 400%, each tile is 1/4 of the image
        // Position formula: (col * 33.33%) for X, (row * 33.33%) for Y
        // (100% / 3 steps = 33.33% per step, since 0% is first position)
        tile.style.backgroundImage = `url('${currentImage}')`;
        tile.style.backgroundPosition = `${col * 33.33}% ${row * 33.33}%`;

        // Last tile is empty
        if (i === TOTAL_TILES - 1) {
            tile.classList.add('empty');
            tile.style.backgroundImage = 'none';
        }

        // Click handler
        tile.addEventListener('click', () => handleTileClick(i));

        grid.appendChild(tile);
        tiles.push(tile);
    }
}

// ============================================
// SHUFFLING LOGIC
// ============================================

function shuffleTiles() {
    // Generate a solvable permutation by making random valid moves
    // This ensures the puzzle is always solvable
    const moves = 200; // Number of random moves to shuffle

    for (let i = 0; i < moves; i++) {
        const validMoves = getValidMoves(emptyIndex);
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        swapTiles(emptyIndex, randomMove, false); // false = don't check for completion during shuffle
    }
}

function getValidMoves(emptyPos) {
    const row = Math.floor(emptyPos / GRID_SIZE);
    const col = emptyPos % GRID_SIZE;
    const moves = [];

    // Check all four directions
    if (row > 0) moves.push(emptyPos - GRID_SIZE); // Up
    if (row < GRID_SIZE - 1) moves.push(emptyPos + GRID_SIZE); // Down
    if (col > 0) moves.push(emptyPos - 1); // Left
    if (col < GRID_SIZE - 1) moves.push(emptyPos + 1); // Right

    return moves;
}

// ============================================
// TILE MOVEMENT
// ============================================

function handleTileClick(clickedIndex) {
    if (isSolved) return;

    // Check if clicked tile is adjacent to empty space
    const validMoves = getValidMoves(emptyIndex);

    if (validMoves.includes(clickedIndex)) {
        swapTiles(emptyIndex, clickedIndex, true); // true = check for completion
    }
}

function swapTiles(pos1, pos2, checkCompletion) {
    // Swap the tiles in the DOM
    const tile1 = tiles[pos1];
    const tile2 = tiles[pos2];

    // Swap visual positions
    const tempClass = tile1.className;
    const tempBg = tile1.style.backgroundImage;
    const tempBgPos = tile1.style.backgroundPosition;

    tile1.className = tile2.className;
    tile1.style.backgroundImage = tile2.style.backgroundImage;
    tile1.style.backgroundPosition = tile2.style.backgroundPosition;

    tile2.className = tempClass;
    tile2.style.backgroundImage = tempBg;
    tile2.style.backgroundPosition = tempBgPos;

    // Update empty index
    emptyIndex = pos2;

    // Check if puzzle is solved
    if (checkCompletion) {
        checkSolved();
    }
}

// ============================================
// COMPLETION DETECTION
// ============================================

function checkSolved() {
    // Check if all tiles are in their correct positions
    // A tile is correct if its background-position matches its grid position

    let allCorrect = true;

    for (let i = 0; i < TOTAL_TILES - 1; i++) { // Exclude empty tile
        const tile = tiles[i];
        const row = Math.floor(i / GRID_SIZE);
        const col = i % GRID_SIZE;

        const expectedBgPos = `${col * 33.33}% ${row * 33.33}%`;

        if (tile.style.backgroundPosition !== expectedBgPos) {
            allCorrect = false;
            break;
        }
    }

    if (allCorrect) {
        handleCompletion();
    }
}

function handleCompletion() {
    isSolved = true;

    // Remove borders by adding 'solved' class to body
    document.body.classList.add('solved');

    // Make the empty tile visible to show complete image
    const emptyTile = tiles[TOTAL_TILES - 1];
    emptyTile.classList.remove('empty');
    emptyTile.style.backgroundImage = `url('${currentImage}')`;
    emptyTile.style.backgroundPosition = `${(GRID_SIZE - 1) * 33.33}% ${(GRID_SIZE - 1) * 33.33}%`;

    // No sound, no text, no celebration
    // Just the quiet completion
}

// ============================================
// START
// ============================================

init();
