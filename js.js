var $params = {};
var $rawParams = {
    start: '',
    end: '',
    time: '1',
    size: 15,
    cfg: 'logo',
};
var $svg = {};
var $board = null;
var $cellSize = 15;
var $borderSize = 0.96;
var $img = null;

function init () {
    parseQs();
    $params.start = parseTimeInSeconds($rawParams.start) || getNowTimeInSeconds();
    $params.time = (parseFloat($rawParams.time)) * 3600;
    $params.end = parseTimeInSeconds($rawParams.end) || ($params.start + $params.time);
    $params.cfg = $rawParams.cfg.replace(/[^a-zA-Z0-9_]/, '');
    $cellSize = parseInt($rawParams.size);

    if ($params.start > $params.end) {
        var dd = $params.start;
        $params.start = $params.end;
        $params.end = dd;
    }
    $params.diff = $params.end - $params.start;

    addJSONP();
    runGUI();
}

function runGUI() {
    const gui = new dat.GUI();

    const ctrl = {
        submit() {
            const oldUrl = window.location.href;
            const splits = oldUrl.split('?');
            const urlWithoutParams = splits[0];
            let url = splits[0];
            Object
                .entries($rawParams)
                .forEach(([key, value], i) => {
                    const op = i == 0 ? '?' : '&';
                    url += `${op}${key}=${encodeURI(value)}`;
                });
            window.location.href = url;
        },

        hide() {
            gui.hide();
        }
    }

    gui.add($rawParams, 'start');
    gui.add($rawParams, 'end');
    gui.add($rawParams, 'time');
    gui.add($rawParams, 'size');
    gui.add($rawParams, 'cfg');
    gui.add(ctrl, 'submit');
    gui.add(ctrl, 'hide');
}

function run(imgBase) {
    console.log("TETRIS START!");
    initImg(imgBase, () => {
        initText();
        makeAnimation();
        showTime();
    });
}

function addJSONP() {
    var script = document.createElement('script');
    script.src = `./cfg/run_${$params.cfg}.js`
    document.body.appendChild(script);
}

function initImg(imgBase, cb) {
    var img = new Image();
    img.onload = () => {
        $img = document.createElement('canvas');
        $img.width = img.width;
        $img.height = img.height;
        $img.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
        cb();
    }
    img.src = imgBase;

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
    generatePuzzleCords($cellSize, $borderSize);
    makeBoard();
    $svg.main = (
        d3.select('svg#animation')
        .attr('width', $board.width * $cellSize)
        .attr('height', $board.height * $cellSize)
    );
    startAnimation();
}


function makeBoard() {
    const width = Math.floor(window.screen.width / $cellSize * 0.5);
    const height = Math.floor(window.screen.height / $cellSize * 0.9);
    $board = new Board(width, height);
    while($board.lastRowIndex > 4) $board.fillLastRow();
}

function startAnimation() {
    const diff = $params.diff;
    const time = getNowTimeInSeconds() - $params.start;
    const doneRatio = Math.max(Math.min(time / diff, 1.0), 0.0);
    showPuzzle(doneRatio);
    computeAnimationSpeed();
    setTimeout(puzzleAnimation, Math.max(-time, 0) * 1000);
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
    const x = Math.floor(Math.random() * $board.width);
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

function drawPuzzle({ puzzle, alpha, row, col }, x, y) {
    const cords = puzzle.cords.map(o => o.join(',')).join(' ');
    const s = Math.min($img.width, $img.height);
    const imgX = Math.floor(col / $board.width * s);
    const imgY = Math.floor(row / $board.height * s);
    const color = $img.getContext('2d').getImageData(imgX, imgY, 1, 1).data;
    const style = `fill:rgb(${color[0]},${color[1]},${color[2]})`;
    const gEl = $svg.main.append('g');
    gEl.append('polygon')
        .attr('points', cords)
        .attr('style', style);
    translatePuzzle(gEl, x, y);
    return gEl;
}

function translatePuzzle(gEl, x, y) {
    const realX = x * $cellSize;
    const realY = (y - 3) * $cellSize;
    gEl.attr('transform', `translate(${realX}, ${realY})`);
}

function parseQs() {
    var search = window.location.search.substr(1);
    var items = search.split('&');
    items.forEach((item) => {
        [item, value] = item.split('=', 2);
        if (!value) return;
        $rawParams[item] = value;
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
