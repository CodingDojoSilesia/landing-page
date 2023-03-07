class Board {
    constructor(width, height) {
        this.width = width || 10;
        this.height = height || 10;
        this.board = Array(this.height)  // Create array of rows
            .fill('.') // Fill anything to avoid undefined value
            .map(row => Array(this.width).fill('.')); // each row is array of characters.
        this.rowIndex = this.height - 1;
        this.puzzleIndex = 0;
    }

    fillLastRow() {
        const gaps = this.findGaps();
        gaps.forEach(gap => this.fillGap(gap));
        this.rowIndex -= 1;
        // return if is possible to fill another rows
        return this.rowIndex > 0;
    }

    findGaps() {
        const row = this.board[this.rowIndex];
        const gaps = [];
        let pointer = 0;
        while(pointer < this.width) {
            // Find next empty cell
            const start = row.findIndex((c, i) => i >= pointer && c == ".");
            if (start == -1) { // not found
                break;
            }
            // Find next non-empty cell
            const end = row.findIndex((c, i) => i >= start && c != ".");
            if (end == -1) { // not found
                gaps.push([start, this.width - 1]);
                break;
            }
            gaps.push([start, end - 1]);
            pointer = end;
        }
        return gaps;
    }

    fillGap([start, end]) {
        let pointer = start;
        while(pointer <= end) {
            const coords = [pointer, this.rowIndex];
            const puzzle = this.pickRandomPuzzle(coords);
            if (puzzle === null) {
                // Let's try with another place.
                pointer += 1;
                continue;
            }
            this.putPuzzle(puzzle, coords);
            pointer += puzzle.lastRowWidth;
        }
    }

    pickRandomPuzzle(coords) {
        const validPuzzles = PUZZLES
            .filter(puzzle => this.isPuzzleMatching(puzzle, coords));

        if (validPuzzles.length == 0) {
            // Any puzzle is not valid.
            return null;
        }

        const index = Math.floor(Math.random() * validPuzzles.length);
        return validPuzzles[index];
    }

    isPuzzleMatching(puzzle, [startX, startY]) {
        // The main idea is to check board cell with puzzle cell.
        // So we have to check 4x4 area.
        for(let y = 0; y < 4; y++) {
            for(let x = 0; x < 4; x++) {
                const puzzleCell = puzzle.array[y][x];
                // Assume start of puzzle coordination
                // is first left bottom non-empty cell.
                const boardX = startX + x - puzzle.lastRowStart;
                const boardY = startY + y - 3;
                // boardX/Y could be a negative / above size of board.
                // so we need to check if row and cell exists.
                // If coords are above size of board then
                // we can treat cell as "solid".
                const boardRow = this.board[boardY] || [];
                const boardCell = boardRow[boardX] || "#";
                if (boardCell != "." && puzzleCell != ".") {
                    // Collision between board and puzzle,
                    // so puzzle can't fit in the board.
                    return false;
                }
            }
        }
        // All cells are matching to board.
        return true;
    }

    putPuzzle(puzzle, [startX, startY]) {
        // Assume a puzzle can be added to the board.
        // Otherwise could "damage" the board.
        for(let y = 0; y < 4; y++) {
            for(let x = 0; x < 4; x++) {
                const puzzleCell = puzzle.array[y][x];
                if (puzzleCell == ".") {
                    continue;
                }
                // Assume start of puzzle coordination
                // is first left bottom non-empty cell.
                const boardX = startX + x - puzzle.lastRowStart;
                const boardY = startY + y - 3;
                if ( // check if cell on the board exists.
                    boardX >= 0
                    && boardX < this.width
                    && boardY >= 0
                    && boardY < this.height) {
                    const ascii = 48 + this.puzzleIndex % 10;
                    const char = String.fromCharCode(ascii);
                    this.board[boardY][boardX] = char;
                }
            }
        }
        this.puzzleIndex += 1;
    }

    toConsole() {
        console.log( // Convert array to string
            this.board.map(row => row.join('')).join('\n')
        );
    }

    toColorConsole() {
        console.log(
            this.board.map(
                row => row
                    .join('')
                    .replace(/\w/g, w => {
                        const d = w.charCodeAt() - 48;
                        const fg = parseInt(d) + (d < 7 ? 31 : 91 - 7);
                        const bg = parseInt(d) + (d < 7 ? 41 : 101 - 7);
                        return `\x1b[${fg}m\x1b[${bg}m${w + w}\x1b[0m`;
                    })
                    .replace(/\./g, '..')
            ).join('\n')
        );
    }

}

class Puzzle {
    constructor(array) {
        this.array = array;
        const lastRow = array[3];
        this.lastRowStart = lastRow.indexOf("#");
        this.lastRowStop = lastRow.lastIndexOf("#");
        this.lastRowWidth = this.lastRowStop - this.lastRowStart;
    }
}

function makePuzzleWithRotating(puzzle) {
    const rotations = [puzzle];
    let rot = puzzle;
    for(let i=0; i < 4; i++) {
        const newRot = shiftToBottomLeft(rotate90(rot));
        const isAnyEqual = rotations.some(r => isArrayEquals(r, newRot));
        if (!isAnyEqual) {
            rotations.push(newRot);
        }
        rot = newRot;
    }
    return rotations.map(p => new Puzzle(p));
}

function rotate90(array) {
    // lets create an array of arrays
    const newArray = Array(4).fill('.').map(() => ['.', '.', '.', '.']);
    for(let y=0; y < 4; y++) {
        for(let x=0; x < 4; x++) {
            const cell = array[y][x];
            const row = newArray[4 - x - 1];
            row[y] = cell;
        }
    }
    // return to array of strings
    return newArray.map(c => c.join(''));
}

function shiftToBottomLeft(array) {
    array = shiftToBottom(array);
    array = shiftToLeft(array);
    return array;
}

function shiftToBottom(array) {
    const newArray = [...array];
    // If last row is empty
    // then drop him
    // and put on the top.
    while(newArray[3] == '....') {
        const row = newArray.pop();
        newArray.unshift(row);
    }
    return newArray;
}

function shiftToLeft(array) {
    let newArray = [...array];
    // If first column is empty
    // then for each row drop first cell
    // and put empty cell on the end of row.
    while(newArray.every(col => col[0] == '.')) {
        newArray = newArray.map(col => col.substr(1) + '.');
    }
    return newArray;
}

function isArrayEquals(a, b) {
    // Checks each cell.
    for(let y=0; y < 4; y++) {
        for(let x=0; x < 4; x++) {
            if (a[y][x] != b[y][x]) {
                return false;
            }
        }
    }
    return true;
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
        '##..',
        '.##.',
    ],
    [
        '#...',
        '#...',
        '#...',
        '#...',
    ],
    [
        '....',
        '....',
        '.##.',
        '##..',
    ],
    [
        '....',
        '#...',
        '#...',
        '##..',
    ],
    [
        '....',
        '.#..',
        '.#..',
        '##..',
    ],
    [
        '....',
        '....',
        '.#..',
        '###.',
    ],
].map(makePuzzleWithRotating).flat();

const b = new Board(10, 10);
while(b.fillLastRow());
b.toColorConsole();
