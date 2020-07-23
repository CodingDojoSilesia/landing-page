class Puzzle {
    constructor(array, index, rotation) {
        this.array = array;
        this.index = index;
        this.rotation = rotation;
        this.crop();
        this.floorSpace = this.array[3].indexOf('#');
        // this.floorSize = this.array[3].indexOf('.', this.floorSpace);
        // if (this.floorSize < 0) this.floorSize = 4;
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
}

function makePuzzles(array, index) {
    const r90 = rotate90(array);
    const r180 = rotate90(r90);
    const r270 = rotate90(r180);

    const origin = new Puzzle(array, index, 0);
    const puzzles = [ // todo - only uniqes
        new Puzzle(r90, index, 1),
        new Puzzle(r180, index, 2),
        new Puzzle(r270, index, 3),
    ].filter(p => !p.isEquals(origin));
    puzzles.push(origin);

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
        this.width = 10;
        this.height = 20;
        this.board = Array(this.height).fill('.').map(row => Array(this.width).fill('.'));
        this.lastRowIndex = this.board.length - 1;
        this.history = [];
    }

    fillLastRow() {
        const lastRow = this.board[this.lastRowIndex];
        let index = lastRow.indexOf('.');
        while (index > -1) {
            const puzzles = this.findAvailablePuzzles(index);
            const puzzle = choice(puzzles);
            if (puzzle === undefined) {
                console.warn('not fit! index:', index, 'rowIndex:', this.lastRowIndex);
                break;
            }

            this.putPuzzle(puzzle, this.lastRowIndex, index);
            index = lastRow.indexOf('.', index);
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
        this.history.push({
            puzzle: puzzle,
            row: rowIndex,
            col: cellIndex,
        });
        const maxX = Math.min(cellIndex + 4, this.width) - cellIndex;
        for(let x = 0; x < maxX; x++) {
            for(let y = 0; y < 4; y++) {
                if (puzzle.array[y][x] != '.') {
                    this.board[rowIndex - 3 + y][cellIndex + x] = '' + puzzle.index;
                }
            }
        }
    }

}

const b = new Board();
for(let i=0; i < 10; i++) b.fillLastRow();
console.log(b.board.map(f => f.join('')).join('\n'));
