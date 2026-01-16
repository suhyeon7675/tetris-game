const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');
const holdCanvas = document.getElementById('hold');
const holdContext = holdCanvas.getContext('2d');

context.scale(20, 20);
nextContext.scale(20, 20);
holdContext.scale(20, 20);

// Tetromino Definitions
function createPiece(type) {
    if (type === 'I') {
        return [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
        ];
    } else if (type === 'L') {
        return [
            [0, 2, 0],
            [0, 2, 0],
            [0, 2, 2],
        ];
    } else if (type === 'J') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [3, 3, 0],
        ];
    } else if (type === 'O') {
        return [
            [4, 4],
            [4, 4],
        ];
    } else if (type === 'Z') {
        return [
            [5, 5, 0],
            [0, 5, 5],
            [0, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
    } else if (type === 'T') {
        return [
            [0, 7, 0],
            [7, 7, 7],
            [0, 0, 0],
        ];
    }
}

// Colors: null, I-Cyan, L-Orange, J-Blue, O-Yellow, Z-Red, S-Green, T-Purple
const colors = [
    null,
    '#00FFFF', // I
    '#FFA500', // L
    '#0000FF', // J
    '#FFFF00', // O
    '#FF0000', // Z
    '#00FF00', // S
    '#800080', // T
];

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(arena, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.pos);
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x, y + offset.y, 1, 1);

                // Add retro border effect
                context.lineWidth = 0.05;
                context.strokeStyle = 'white';
                context.strokeRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                    matrix[y][x],
                    matrix[x][y],
                ];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerMove(offset) {
    player.pos.x += offset;
    if (collide(arena, player)) {
        player.pos.x -= offset;
    }
}

function playerReset() {
    const pieces = 'ILJOTSZ';
    if (player.next === null) {
        player.next = createPiece(pieces[pieces.length * Math.random() | 0]);
    }
    player.matrix = player.next;
    player.next = createPiece(pieces[pieces.length * Math.random() | 0]);

    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
        (player.matrix[0].length / 2 | 0);

    if (collide(arena, player)) {
        // Game Over
        arena.forEach(row => row.fill(0));
        player.score = 0;
        updateScore();
    }
    if (collide(arena, player)) {
        // Game Over
        arena.forEach(row => row.fill(0));
        player.score = 0;
        updateScore();
    }
    drawNext();
    drawHold();
    player.canHold = true;
}

function playerHold() {
    if (!player.canHold) {
        return;
    }

    if (player.hold === null) {
        player.hold = player.matrix;
        player.matrix = player.next;
        player.next = createPiece('ILJOTSZ'['ILJOTSZ'.length * Math.random() | 0]);
        drawNext();
    } else {
        const temp = player.matrix;
        player.matrix = player.hold;
        player.hold = temp;
    }

    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
        (player.matrix[0].length / 2 | 0);

    player.canHold = false;
    drawHold();
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }

        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        player.score += rowCount * 10;
        rowCount *= 2;

        // Trigger Flash Effect
        const gameContainer = document.getElementById('game-container');
        gameContainer.classList.add('flash');
        setTimeout(() => {
            gameContainer.classList.remove('flash');
        }, 200);
    }
}

function updateScore() {
    document.getElementById('score').innerText = player.score;
}

function drawNext() {
    nextContext.fillStyle = '#000';
    nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    // Center the piece in 4x4 grid (canvas is 80x80 = 4x4 units of 20px)
    // Most pieces are 3x3 or 4x4 (I, O)
    const offset = {
        x: (4 - player.next[0].length) / 2,
        y: (4 - player.next.length) / 2,
    };

    player.next.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                nextContext.fillStyle = colors[value];
                nextContext.fillRect(x + offset.x, y + offset.y, 1, 1);

                nextContext.lineWidth = 0.05;
                nextContext.strokeStyle = 'white';
                nextContext.strokeRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function drawHold() {
    holdContext.fillStyle = '#000';
    holdContext.fillRect(0, 0, holdCanvas.width, holdCanvas.height);

    if (!player.hold) return;

    const offset = {
        x: (4 - player.hold[0].length) / 2,
        y: (4 - player.hold.length) / 2,
    };

    player.hold.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                holdContext.fillStyle = colors[value];
                holdContext.fillRect(x + offset.x, y + offset.y, 1, 1);

                holdContext.lineWidth = 0.05;
                holdContext.strokeStyle = 'white';
                holdContext.strokeRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

const arena = createMatrix(10, 20);

const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    next: null,
    hold: null,
    canHold: true,
    score: 0,
};

document.addEventListener('keydown', event => {
    if (event.keyCode === 37) { // Left
        playerMove(-1);
    } else if (event.keyCode === 39) { // Right
        playerMove(1);
    } else if (event.keyCode === 40) { // Down
        playerDrop();
    } else if (event.keyCode === 38) { // Up
        playerRotate(1);
    } else if (event.keyCode === 32) { // Space (Hard Drop)
        // Hard drop implementation
        while (!collide(arena, player)) {
            player.pos.y++;
        }
        player.pos.y--; // Back up one step
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
        dropCounter = 0; // Reset drop timer
    } else if (event.keyCode === 16) { // Shift (Hold)
        playerHold();
    }
});

playerReset();
updateScore();
update();
