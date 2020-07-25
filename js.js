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
    el.innerText = window.localStorage.text || '';
    el.addEventListener('input', onText);
}

function onText(ev) {
    var el = ev.target;
    var text = el.innerText || '';
    window.localStorage.text = text;
}

function makeAnimation() {
    $svg.main = (
        d3.select('svg#animation')
        .attr('width', $svg.width)
        .attr('height', $svg.height)
    );

    makeBoard();
}

const COLORS = {
    'A': '#F00',
    'B': '#F11',
    'C': '#F22',
    'D': '#F33',
    'E': '#F44',
    'F': '#F55',
    'G': '#F66',
    'H': '#F77',
    'I': '#F88',
    'J': '#F99',
    'K': '#FAA',
    'L': '#FBB',
};


function makeBoard() {
    $board = new Board();
    for(let i=0; i < 15; i++) $board.fillLastRow();
    showPuzzle(0);
}

function showPuzzle(i) {
    const obj = $board.history[i];
    if (!obj) return;

    const { puzzle, row, col, alpha } = obj;
    const gEl = $svg.main.append('g')
        .attr(
            'transform',
            `translate(${col * CELL_SIZE}, ${row * CELL_SIZE})`);

    const cords = puzzle.cords.map(o => o.join(',')).join(' ');
    gEl.append('polygon')
        .attr('points', cords)
        .attr('style', `fill:${COLORS[alpha]}`);

    setTimeout(showPuzzle, 100, i + 1);
}

function parseQs () {
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
