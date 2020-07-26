var $params = {};
var $svg = {width: 800, height: 100, pacmanMouthSpeed: 1, dotsCount: 10};
var $red = '#D82C31';
var $black = '#333';
var $board = null;

function init () {
    parseQs();
    $params.start = parseTimeInSeconds($params.start || '') || getNowTimeInSeconds(); // default = now
    $params.time = (parseFloat($params.time || '') || 1) * 3600; // default = 1 hour
    $params.end = parseTimeInSeconds($params.end || '') || ($params.start + $params.time);

    if ($params.start > $params.end) {
        var dd = $params.start;
        $params.start = $params.end;
        $params.end = dd;
    }
    $params.diff = $params.end - $params.start;

    initText();
    makeAnimation();
    showTime();
}

function initText() {
    var el = getEl('text');
    el.innerText = window.localStorage.text || 'Insert dream here';
    el.addEventListener('input', onText);
}

function onText(ev) {
    var el = ev.target;
    var text = el.innerText || '';
    window.localStorage.text = text;
}

function makeAnimation() {
    makeBoard();
    $svg.main = (
        d3.select('svg#animation')
        .attr('width', $board.width * CELL_SIZE)
        .attr('height', $board.height * CELL_SIZE)
    );
    startAnimation();
}

const COLORS = {
    'A': '#D72A32',
    'B': '#ffd81b',
    'C': '#0e00e0',
    'D': '#793801',
    'E': '#5a5a5a',
    'F': '#7d3a3a',
    'G': '#a400af',
    'H': '#ff7373',
    'I': '#0076af',
    'J': '#d20000',
    'K': '#00d2b5',
    'L': '#500b0b',
};


function makeBoard() {
    $board = new Board();
    while($board.lastRowIndex > 4) $board.fillLastRow();
}

function startAnimation() {
    const diff = $params.diff;
    const time = getNowTimeInSeconds() - $params.start;
    const doneRatio = Math.min(time / diff, 1.0);
    showPuzzle(doneRatio);
    computeAnimationSpeed();
    setTimeout(puzzleAnimation, 1000);
}

function computeAnimationSpeed() {
    const totalSteps = $board.history.reduce((acc, obj) => acc + obj.row * 2, 0);
    const time = ($params.end - getNowTimeInSeconds()) * 1000;
    $timeStep = totalSteps > 0 ? Math.max(time, 0) / totalSteps : 0;
};

function puzzleAnimation() {
    const obj = $board.history.shift();
    if (!obj) return;

    const { row, col } = obj;
    const x = Math.round($board.width / 2);
    const y = 0;
    const pObj = {
        el: drawPuzzle(obj, x, y),
        x, y,
        row, col,
    }

    setTimeout(movePuzzle, $timeStep, pObj);
}

function movePuzzle(pObj) {
    const { y, col, row, el} = pObj;
    let x = pObj.x;
    pObj.y += 0.5;
    if (x > col) {
        pObj.x -= 1;
    } else if (x < col) {
        pObj.x += 1;
    }

    const ceilY = Math.ceil(y);
    if (ceilY != row)  {
        setTimeout(movePuzzle, $timeStep, pObj);
    } else {
        puzzleAnimation();
        x = col;
    }

    translatePuzzle(el, x, ceilY);
}

function showPuzzle(doneRatio) {
    const alreadyInAreaPuzzlesCount = Math.ceil(doneRatio * $board.history.length);

    for(let i = 0; i < alreadyInAreaPuzzlesCount; i++) {
        const obj = $board.history[i];
        const { row, col } = obj;
        const gEl = drawPuzzle(obj, row, col);
        translatePuzzle(gEl, col, row);
    }

    $board.history = $board.history.slice(alreadyInAreaPuzzlesCount);
}

function drawPuzzle({ puzzle, alpha }, x, y) {
    const cords = puzzle.cords.map(o => o.join(',')).join(' ');
    const style = `fill:${COLORS[alpha]}`;
    const gEl = $svg.main.append('g');
    gEl.append('polygon')
        .attr('points', cords)
        .attr('style', style);
    translatePuzzle(gEl, x, y);
    return gEl;
}

function translatePuzzle(gEl, x, y) {
    const realX = x * CELL_SIZE;
    const realY = (y - 2.9) * CELL_SIZE;
    gEl.attr('transform', `translate(${realX}, ${realY})`);
}

function parseQs() {
    var search = window.location.search.substr(1);
    var items = search.split('&');
    items.forEach((item) => {
        [item, value] = item.split('=', 2);
        $params[item] = value;
    });
}

function getNowTimeInSeconds() {
    var date = new Date();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    return hours * 3600 + minutes * 60 + seconds;
}

function showTime () {
    var totalSeconds = Math.min(
        Math.max(
            $params.end - getNowTimeInSeconds(),
            0
        ),
        $params.diff
    );

    var totalMinutes = Math.floor(totalSeconds / 60);
    var hours = Math.floor(totalMinutes / 60);
    var minutes = totalMinutes % 60;
    var seconds = totalSeconds % 60;

    getEl('hour').innerHTML = lpad(hours);
    getEl('minute').innerHTML = lpad(minutes);
    getEl('second').innerHTML = lpad(seconds);

    var miliseconds = 1000 - (new Date()).getMilliseconds();

    // avoid race condition with timeout
    setTimeout(showTime, miliseconds + 30);
}

function getEl(name) {
    return document.getElementById(name);
}

function parseTimeInSeconds(value) {
    var [hours, minutes, seconds] = (
        value
        .split(':', 3)
        .map(x => parseInt(x))
    );
    hours = Math.max(Math.min(hours || 0, 24), 0)
    minutes = Math.max(Math.min(minutes || 0, 60), 0)
    seconds = Math.max(Math.min(seconds || 0, 60), 0)
    return hours * 3600 + minutes * 60 + seconds;
}

function lpad (x) {
    if (x < 10) {
        return `0${x.toFixed()}`;
    }
    return x.toFixed();
}
