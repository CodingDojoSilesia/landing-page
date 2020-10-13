class Puzzle {
    constructor(array, index, rotation) {
        this.array = array;
        this.index = index;
        this.rotation = rotation;
        this.crop();
        this.floorSpace = this.array[3].indexOf('#');
        //this.height = 3 - this.array.lastIndexOf('....');
        //this.width = Math.max.apply(null, this.array.map(col => col.lastIndexOf('#') + 1));
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
                const areaCell = area[y][x - this.floorSpace + 4];
                if(areaCell != '.' && puzzleCell != '.') {
                    return false;
                }
            }
        }

        /*
        for(let y = 0; y < 4 - this.height; y++) {
            for(let x = 0; x < this.width; x++) {
                const puzzleCell = puzzle[3][x];
                const areaCell = area[3][ - this.floorSpace + 4];
                if(areaCell == '.' && puzzleCell == '.') {
                    return false;
                }
            }
        }
        */
        return true;
    }

    isEquals(otherPuzzle) {
        return this.array.every((col, index) => col == otherPuzzle.array[index]);
    }

    generateCords(cellSize, borderSize) {
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
            const a = borderSize;
            const b = 1 - a;
            switch(d) {
                // 0b00 = down left
                case 0: p = [(xx + a) * cellSize, (yy + a) * cellSize]; break;
                // 0b01 = up left
                case 1: p = [(xx + b) * cellSize, (yy + a) * cellSize]; break;
                // b0 = down right
                case 2: p = [(xx + a) * cellSize, (yy + b) * cellSize]; break;
                // b1 = up right
                case 3: p = [(xx + b) * cellSize, (yy + b) * cellSize]; break;
            }
            polygons.push(p);
            //polygons.push([x * cellSize, y * cellSize]);
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

function generatePuzzleCords(cellSize, borderSize) {
    PUZZLES.forEach(p => { p.cords = p.generateCords(cellSize, borderSize); });
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
            newArray[y][x] = array[4 - x - 1][y];
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


class Board {
    constructor(width, height) {
        this.width = width || 60;
        this.height = height || 48;
        this.board = Array(this.height).fill('.').map(row => Array(this.width).fill('.'));
        this.lastRowIndex = this.board.length - 1;
        this.history = [];
        this.counter = Array(PUZZLES.length).fill(0);
    }

    fillLastRow() {
        const lastRow = this.board[this.lastRowIndex];
        const indexOf = (i) => lastRow.indexOf('.', i);
        const spans = this.findSpans();

        spans.sort((a, b) => {
            let aa = a.size;
            let bb = b.size;
            if (aa > bb) return -1;
            if (aa < bb) return +1;
            return 0;
        });

        spans.forEach(({start, end}) => {
            for (let index = start; index > -1 && index < end; index = indexOf(index)) {
                const puzzles = this.findAvailablePuzzles(index);
                const puzzle = this.choice(puzzles);
                if (!puzzle) {
                    console.warn('not fit! index:', index, 'rowIndex:', this.lastRowIndex);
                    index += 1;
                    continue;
                }
                this.putPuzzle(puzzle, this.lastRowIndex, index);
            }
        });

        this.lastRowIndex -= 1;
    }

    findSpans() {
        const spans = [];
        let state = 'EMPTY';
        let prevIndex = 0;
        let index = 0;

        const lastRow = this.board[this.lastRowIndex];
        const findEmpty = () => lastRow.indexOf('.', index + 1);
        const findFilled = () => {
            const i = lastRow.slice(index + 1).findIndex(x => x !== '.');
            return i === -1 ? -1 : i + index + 1;
        }
        const push = () => {
            const realIndex = index > -1 ? index : lastRow.length;
            const size = realIndex - prevIndex;
            spans.push({
                start: prevIndex,
                end: realIndex,
                size,
            });
        };

        while (index > -1) {
            prevIndex = index;
            if (state === 'EMPTY') {
                index = findFilled();
                push();
                state = 'FILL';
            } else {
                index = findEmpty();
                state = 'EMPTY';
            }
        }

        if (state === 'EMPTY') {
            push();
        }

        return spans;
    }

    findAvailablePuzzles(cellIndex=0) {
        const area = Array(4).fill('.').map(row => Array(8).fill('#'));
        const rowIndex = this.lastRowIndex - 3;
        const maxX = Math.min(cellIndex + 4, this.width) - cellIndex;
        const minX = Math.min(cellIndex - 4, 0);
        for(let x = minX; x < maxX; x++) {
            for(let y = 0; y < 4; y++) {
                area[y][x + 2] = this.board[rowIndex + y][cellIndex + x];
            }
        }
        return PUZZLES.filter(puzzle => puzzle.isMatching(area));
    }

    choice(puzzles) {
        if (puzzles.length == 0) return null;
        const index = Math.floor(Math.random() * puzzles.length);
        return puzzles[index];
    }

    putPuzzle(puzzle, rowIndex, cellIndex) {
        const index = rowIndex * 11 + cellIndex * 3;
        const alpha = String.fromCharCode(index % 12 + 65);
        const col = cellIndex - puzzle.floorSpace;

        this.history.push({
            puzzle: puzzle,
            row: rowIndex,
            col: col,
            alpha: alpha,
        });

        const maxX = Math.min(cellIndex + 4, this.width) - cellIndex;
        for(let x = 0; x < maxX; x++) {
            for(let y = 0; y < 4; y++) {
                if (puzzle.array[y][x] != '.') {
                    this.board[rowIndex - 3 + y][col + x] = alpha;
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
