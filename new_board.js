// WARNING - print functions are very ugly!
// Import below is required to run each animation.
// const { execSync } = require("child_process");

class Board {
    constructor(width, height) {
        this.width = width || 10;
        this.height = height || 10;
        this.board = Array(this.height)  // Create the array of rows
            .fill('.') // Fill anything to avoid undefined value
            .map(row => Array(this.width).fill('.')); // Each row is an array of characters.
        this.rowIndex = this.height - 1;
        this.puzzleIndex = 0;
    }

    fillLastRow() {
        const gaps = this.findGaps();
        gaps.forEach(gap => this.fillGap(gap));
        this.rowIndex -= 1;
        // Return if is possible to fill another rows
        return this.rowIndex > 0;
    }

    findGaps() {
        const row = this.board[this.rowIndex];
        const gaps = [];
        let pointer = 0;

        let print = (label, start, end) => {
            return; // break to free the animation!
            console.clear();
            this.toColorConsole();
            const sp = start * 2;
            const ep = end * 2;
            const wp = (ep - sp);
            console.log("".padStart(wp, "↑").padStart(ep, " "));
            console.log(`${label}=${end - 1}`.padStart(ep, " "));
            gaps.forEach(([start, end]) => {
                console.log(`[${start}:${end}]`.padStart(ep, " "));
            });
            execSync("sleep 2");
        }

        while(pointer < this.width) {
            // Find next empty cell
            const start = row.findIndex((c, i) => i >= pointer && c == ".");
            if (start == -1) { // not found
                break;
            }
            print("start", start, start + 1);

            // Find next non-empty cell
            const end = row.findIndex((c, i) => i >= start && c != ".");
            if (end == -1) { // not found
                gaps.push([start, this.width - 1]);
                print("end", start, this.width);
                break;
            }
            gaps.push([start, end - 1]);
            print("end", start, end);
            pointer = end;
        }

        return gaps;
    }

    fillGap([start, end]) {
        let pointer = start;

        let print = () => {
            return; // break to free the animation!
            console.clear();
            this.toColorConsole();
            const p = (pointer + 1) * 2;
            console.log("↑↑".padStart(p, " "));
            console.log(`pointer=${pointer}`.padStart(p, " "));
            execSync("sleep 0.25");
        }

        print();

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
            print();
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

        let print = (puzzleX, puzzleY, state, wait) => {
            return; // break to free the animation!
            console.clear();
            let s = '';
            for(let y = -1 - startY + 3; y < this.height - 6; y++) {
                const boardY = startY + y - 3;
                const boardRow = this.board[boardY] || [];
                for(let x = -1 - startX; x < this.width + 1 - startX; x++) {
                    const boardX = startX + x - puzzle.lastRowStart;
                    const boardCell = boardRow[boardX] || "!";
                    const isInside = y >= 0 && x >= 0 && y < 4 && x < 4;
                    const collision = isInside ? puzzle.array[y][x] == "#" : false;
                    if (boardX == puzzleX && boardY == puzzleY) {
                        if (state == "NO MATCH") {
                            s += '\x1b[31m!!\x1b[0m';
                        } else {
                            s += '\x1b[34m??\x1b[0m';
                        }
                    } else {
                        const d = boardCell.charCodeAt() - 48;
                        let fg = 31;
                        if (boardCell == "!") fg = 31;
                        else if (boardCell == ".") fg = isInside ? 97 : 90;
                        else if (collision) fg = 97;
                        else fg = parseInt(d) + (d < 7 ? 31 : 91 - 7);
                        const bg = d >= 0 && d <= 9 ? parseInt(d) + (d < 7 ? 41 : 101 - 7) : 49;
                        const cell = collision ? "▒▒" : "..";
                        s += `\x1b[${fg}m\x1b[${bg}m${cell}\x1b[0m`;
                    }
                }
                s += '\n';
            }

            console.log(s, state);
            execSync("sleep 0.05");
            if (wait) {
                execSync("sleep 2");
            }
        }

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
                    print(boardX, boardY, "NO MATCH", true);
                    return false;
                } else {
                    print(boardX, boardY, "MATCHING", false);
                }
            }
        }

        // All cells are matching with board.
        print("?", "?", "MATCH", true);
        return true;
    }

    putPuzzle(puzzle, [startX, startY]) {
        // Assume a puzzle can be added to the board.
        // Otherwise it could "damage" the board.
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
        console.log( // Convert the array to string
            this.board.map(row => row.join('')).join('\n')
        );
    }

    toColorConsole() {
        console.log(
            this.board.map(
                row => row
                    .join('')
                    .replace(/\d/g, w => {
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
        this.lastRowWidth = this.lastRowStop - this.lastRowStart + 1;
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
    // Let's create an array of arrays.
    const newArray = Array(4).fill('.').map(() => ['.', '.', '.', '.']);
    for(let y=0; y < 4; y++) {
        for(let x=0; x < 4; x++) {
            const cell = array[y][x];
            const row = newArray[4 - x - 1];
            row[y] = cell;
        }
    }
    // Return to array of strings.
    return newArray.map(c => c.join(''));
}

function shiftToBottomLeft(array) {
    array = shiftToBottom(array);
    array = shiftToLeft(array);
    return array;
}

function shiftToBottom(array) {
    const newArray = [...array];
    // If the last row is empty
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
    // If the first column is empty
    // then for each row drop the first cell
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

const b = new Board(60, 40);
while(b.fillLastRow());
b.toColorConsole();
