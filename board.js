const CELL_SIZE = 30;
class Puzzle {
    constructor(array, index, rotation) {
        this.array = array;
        this.index = index;
        this.rotation = rotation;
        this.crop();
        this.floorSpace = this.array[3].indexOf('#');
        this.cords = this.generateCords();
    }

    crop() {
        while(this.array[3] == '....') { // crop in Y
            this.array.pop();
            this.array.unshift('....');
        }

        while(this.array.every(col => col[0] == '.')) { // crop in X
            this.array = this.array.map(col => col.substr(1) + '.');
        }
    }

    isMatching(area) {
        const puzzle = this.array;
        for(let y = 0; y < 4; y++) {
            for(let x = 0; x < 4; x++) {
                const puzzleCell = puzzle[y][x];
                const areaCell = area[y][x];
                if(areaCell != '.' && puzzleCell != '.') {
                    return false;
                }
            }
        }
        for(let x = 0; x < this.floorSpace; x++) {
            const puzzleCell = puzzle[3][x];
            const areaCell = area[3][x];
            if(areaCell == '.' && puzzleCell == '.') {
                return false;
            }
        }
        return true;
    }

    isEquals(otherPuzzle) {
        return this.array.every((col, index) => col == otherPuzzle.array[index]);
    }

    generateCords() {
        const firstY = 3;
        const firstX = this.array[firstY].indexOf('#');

        const dir2cord = {
            0: [+0.5, +0.0, 3], // →
            1: [+0.0, -0.5, 0], // ↑
            2: [-0.5, +0.0, 1], // ←
            3: [-0.0, +0.5, 2], // ↓
        }

        let x = firstX, y = firstY, dir = 0, lastDir = 0;
        const polygons = [];

        function pushPolygon() {
            let p;
            const xx = Math.ceil(x);
            const yy = Math.ceil(y);
            const d = (xx - x > 0.1) | ((yy - y > 0.1) << 1);
            switch(d) {
                // 0b00 = down left
                case 0: p = [(xx + 0.9) * CELL_SIZE, (yy + 0.9) * CELL_SIZE]; break;
                // 0b01 = up left
                case 1: p = [(xx + 0.1) * CELL_SIZE, (yy + 0.9) * CELL_SIZE]; break;
                // 0b10 = down right
                case 2: p = [(xx + 0.9) * CELL_SIZE, (yy + 0.1) * CELL_SIZE]; break;
                // 0b11 = up right
                case 3: p = [(xx + 0.1) * CELL_SIZE, (yy + 0.1) * CELL_SIZE]; break;
            }
            polygons.push(p);
            //polygons.push([x * CELL_SIZE, y * CELL_SIZE]);
            /*
            const xx = Math.ceil(x);
            const yy = Math.ceil(y);
            polygons.push([['→', '↑', '←', '↓'][dir], xx, yy]);
            */
        }

        do {
            const [diffX, diffY, nextDir] = dir2cord[dir];
            const nextX = x + diffX;
            const nextY = y + diffY;
            const nextRow = this.array[Math.ceil(nextY)] || [];
            const nextCell = nextRow[Math.ceil(nextX)];
            if (nextCell != '#') {
                dir = (dir + 1) % 4;
            } else {
                if (lastDir != dir) {
                    lastDir = dir;
                    pushPolygon();
                }
                dir = nextDir;
                x = nextX;
                y = nextY;
            }
        } while(x != firstX || y != firstY || dir != 0);

        return polygons;
    }
}

function makePuzzles(array, index) {
    const r90 = rotate90(array);
    const r180 = rotate90(r90);
    const r270 = rotate90(r180);

    const origin = new Puzzle(array, index, 0);
    const puzzle90 = new Puzzle(r90, index, 1);
    const puzzle180 = new Puzzle(r180, index, 2);
    const puzzle270 = new Puzzle(r270, index, 3);
    const puzzles = [origin];

    if (!origin.isEquals(puzzle90))     puzzles.push(puzzle90);
    if (!origin.isEquals(puzzle180))    puzzles.push(puzzle180);
    if (!puzzle90.isEquals(puzzle270))  puzzles.push(puzzle270);

    // puzzles.forEach(p => { console.log(p.array.join('\n'), '\n'); });

    return puzzles;
}

function rotate90(array) {
    const newArray = Array(4).fill('.').map(f => Array(4).fill('.'));
    for(let y = 0; y < 4; y++) {
        for(let x = 0; x < 4; x++) {
            newArray[y][x] = array[x][y];
        }
    }
    return newArray.map(f => f.join(''));
}

const PUZZLES = [
    [
        '....',
        '....',
        '##..',
        '##..',
    ],
    [
        '....',
        '....',
        '.##.',
        '##..',
    ],
    [
        '....',
        '....',
        '##..',
        '.##.',
    ],
    [
        '....',
        '....',
        '.#..',
        '###.',
    ],
    [
        '....',
        '....',
        '....',
        '####',
    ],
    [
        '....',
        '....',
        '#...',
        '###.',
    ],
    [
        '....',
        '....',
        '..#.',
        '###.',
    ],
].map(makePuzzles).flat();

function choice(items) {
    const index = Math.floor(Math.random() * items.length);
    return items[index];
}

class Board {
    constructor() {
        this.width = 20;
        this.height = 20;
        this.board = Array(this.height).fill('.').map(row => Array(this.width).fill('.'));
        this.lastRowIndex = this.board.length - 1;
        this.history = [];
    }

    fillLastRow() {
        const lastRow = this.board[this.lastRowIndex];
        const indexOf = (i) => lastRow.indexOf('.', i || 0);

        for (let index = indexOf(); index > -1; index = indexOf(index)) {
            const puzzles = this.findAvailablePuzzles(index);
            const puzzle = choice(puzzles);
            if (puzzle === undefined) {
                console.warn('not fit! index:', index, 'rowIndex:', this.lastRowIndex);
                index += 1;
                continue;
            }

            this.putPuzzle(puzzle, this.lastRowIndex, index);
        }

        this.lastRowIndex -= 1;
    }

    findAvailablePuzzles(cellIndex=0) {
        const area = Array(4).fill('.').map(row => Array(4).fill('#'));
        const rowIndex = this.lastRowIndex - 3;
        const maxX = Math.min(cellIndex + 4, this.width) - cellIndex;
        for(let x = 0; x < maxX; x++) {
            for(let y = 0; y < 4; y++) {
                area[y][x] = this.board[rowIndex + y][cellIndex + x];
            }
        }
        return PUZZLES.filter(puzzle => puzzle.isMatching(area));
    }

    putPuzzle(puzzle, rowIndex, cellIndex) {
        const index = rowIndex * 11 + cellIndex * 3;
        const alpha = String.fromCharCode(index % 12 + 65);

        this.history.push({
            puzzle: puzzle,
            row: rowIndex,
            col: cellIndex,
            alpha: alpha,
        });

        const maxX = Math.min(cellIndex + 4, this.width) - cellIndex;
        for(let x = 0; x < maxX; x++) {
            for(let y = 0; y < 4; y++) {
                if (puzzle.array[y][x] != '.') {
                    this.board[rowIndex - 3 + y][cellIndex + x] = alpha;
                }
            }
        }
    }

    toConsole() {
        console.log(
            this.board.map(
                row => row
                    .join('')
                    .replace(/\w/g, w => {
                        const d = w.charCodeAt() - 65;
                        const fg = parseInt(d) + (d < 7 ? 31 : 91 - 7);
                        const bg = parseInt(d) + (d < 7 ? 41 : 101 - 7);
                        return `\x1b[${fg}m\x1b[${bg}m${w + w}\x1b[0m`;
                    })
                    .replace(/\./g, '..')
            ).join('\n')

        );
    }
}

/*
const b = new Board();
for(let i=0; i < 10; i++) b.fillLastRow();
b.toConsole();

PUZZLES.forEach(p => {
    console.log(p.array.join('\n'), p.cords.length, p.cords);
    console.log();
});
*/
