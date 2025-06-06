let gameInterval; // Declare gameInterval at the top
let nextPieceType = 'T'; // Start with 'T', will be toggled before first use in playerReset

const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(20, 20);

const arena = createMatrix(12, 20);
const player = {
    pos: {x: 0, y: 0},
    matrix: createPiece('T'),
    score: 0
};

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type) {
    if (type === 'T') {
        return [
            [0, 0, 0],
            [1, 1, 1],
            [0, 1, 0]
        ];
    } else if (type === 'O') {
        return [
            [2, 2],
            [2, 2]
        ];
    }
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = 'red';
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function draw() {
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(arena, {x: 0, y: 0});
    drawMatrix(player.matrix, player.pos);
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });

    const clearedRows = [];
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        clearedRows.push(y);
        player.score += clearedRows.length * 10;
        player.pos.y -= clearedRows.length;
        arena.splice(y, clearedRows.length);
        arena.unshift(new Array(arena[y-1].length).fill(0));
        clearedRows.forEach(y => {
            const row = arena[y];
            setTimeout(() => {
                wobble(row, y, 'lightblue');
            }, y * 50);
        });
        setTimeout(() => {
            draw();
        }, clearedRows.length * 50 + 500);
    }
    updateScore();
    playerReset(); // Spawn a new piece
}

function playerReset() {
    nextPieceType = (nextPieceType === 'T') ? 'O' : 'T'; // Toggle for the next piece
    player.matrix = createPiece(nextPieceType);
    player.pos.y = 0;
    player.pos.x = Math.floor(arena[0].length / 2) - Math.floor(player.matrix[0].length / 2);

    if (collide(arena, player)) {
        // Game Over: If the new piece collides immediately, it means the arena is full at the top.
        endGame(); // endGame will alert the current score and reload
        return;     // Stop further execution in playerReset
    }
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] &&
                 arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function wobble(matrix, y, color) {
    context.fillStyle = color;
    matrix.forEach((value, x) => {
        if (value !== 0) {
            context.fillRect(x, y, 1, 1);
            setTimeout(() => {
                context.clearRect(x, y, 1, 1);
            }, 500);
        }
    });
}

function updateScore() {
    document.getElementById('score').innerText = `Score: ${player.score}`;
}

document.addEventListener('keydown', event => {
    if (event.keyCode === 37) {
        player.pos.x--;
        if (collide(arena, player)) {
            player.pos.x++;
        } else {
            draw();
        }
    } else if (event.keyCode === 39) {
        player.pos.x++;
        if (collide(arena, player)) {
            player.pos.x--;
        } else {
            draw();
        }
    } else if (event.keyCode === 40) {
        player.pos.y++;
        if (collide(arena, player)) {
            player.pos.y--;
            merge(arena, player);
        } else {
            draw();
        }
    } else if (event.keyCode === 81) {
        player.matrix = createPiece('O');
        player.pos.y = arena.length - player.matrix.length - 1;
        player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
        if (collide(arena, player)) {
            endGame();
        } else {
            draw();
        }
    } else if (event.keyCode === 32) {
        player.matrix = createPiece('T');
        player.pos.y = arena.length - player.matrix.length - 1;
        player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
        if (collide(arena, player)) {
            endGame();
        } else {
            draw();
        }
    }
});

function endGame() {
    alert(`Game Over! Your Score: ${player.score}`);
    document.location.reload();
}

function startGame() {
    // Reset score for a new game
    player.score = 0;
    updateScore();

    // Arena should be clear at the start of a new game.
    // This ensures that if a game ended and endGame didn't reload, starting a new game is clean.
    arena.forEach(row => row.fill(0));

    playerReset(); // Set up the first piece
    draw(); // Draw the initial state

    if (gameInterval) {
        clearInterval(gameInterval);
    }
    gameInterval = setInterval(() => {
        player.pos.y++;
        if (collide(arena, player)) {
            player.pos.y--;
            merge(arena, player);
            // playerReset() is now called within merge()
        } else {
            draw();
        }
    }, 1000);
}

document.getElementById('startButton').addEventListener('click', startGame);
