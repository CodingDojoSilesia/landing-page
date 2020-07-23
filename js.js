var $params = {};
var $svg = {width: 800, height: 100, pacmanMouthSpeed: 1, dotsCount: 10};
var $red = '#D82C31';
var $black = '#333';

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


function makeBoard() {
    const board = Board();
    return board;
}

function fillLastRow(board) {
}

function makePacman() {
    $svg.pacman = (
        $svg.main.append('path')
        .attr('d', computePacmanCords(1.0))
        .attr('fill', $red)
    );

    pacmanMouthLoop();
}

function makeDots() {
    var range = [];
    for (var i = 0; i <= $svg.dotsCount; i++) {
        range.push(i);
    }

    $svg.dots = range.map(makeDot);

    removeDotsLoop();
}

function makeDot(i) {
    return (
        $svg.main.append('circle')
        .attr('cx', getRoadByPercent(i / $svg.dotsCount))
        .attr('cy', $svg.height / 2)
        .attr('r', $svg.height / 10)
        .attr('data-i', i)
        .attr('fill', $black)
        .attr('fill-opacity', 1.0)
    );
}

function removeDotsLoop () {
    var time = getNowTimeInSeconds();
    var percent = (time - $params.start) / $params.diff;
    var removeCount = 0;
    $svg.dots = $svg.dots.filter(dot => {
        var i = dot.attr('data-i');
        var dotPercent = i / $svg.dotsCount;
        if (percent > dotPercent) {
            (
                dot.transition()
                .duration(2000 + 200 * removeCount)
                .attr('fill-opacity', 0)
                .attr('r', $svg.height / 8)
                .remove()
            );
            removeCount += 1;
            return false;
        }
        return true;
    });

    setTimeout(removeDotsLoop, 1000);
}


function pacmanMouthLoop () {
    var duration = 1000 / $svg.pacmanMouthSpeed;
    var ease = d3.easeLinear;
    (
        $svg.pacman
        .transition()
            .ease(ease)
            .duration(duration)
            .attr('d', computePacmanCords(0.01))
        .transition()
            .ease(ease)
            .duration(duration)
            .attr('d', computePacmanCords(1.0))
        .on('end', pacmanMouthLoop)
    );
}

function computePacmanCords (mouthSizeRatio) {
    var time = getNowTimeInSeconds();
    var percent = (time - $params.start) / $params.diff;
    percent = Math.max(Math.min(percent, 1.0), 0.0);
    var halfHeight = $svg.height / 2;
    var road = getRoadByPercent(percent);
    var doublePI = 2 * Math.PI;
    var mountSize = 0.125 * mouthSizeRatio;
    var halfMountSize = mountSize / 2;

    var firstAngle = doublePI * (1.0 - halfMountSize);
    var secondAngle = doublePI * (1.0 + halfMountSize);

    var x1 = Math.cos(firstAngle) * halfHeight + road;
    var y1 = (Math.sin(firstAngle) + 1) * halfHeight;

    var x2 = Math.cos(secondAngle) * halfHeight + road;
    var y2 = (Math.sin(secondAngle) + 1 ) * halfHeight;

    var d = [
        `M${road},${halfHeight}`,
        `L${x1},${y1}`,
        `A${halfHeight},${halfHeight},0,1,0,${x2},${y2}`,
    ];

    return d.join(' ');
}

function getRoadByPercent (percent) {
    return $svg.height / 2 + ($svg.width - $svg.height) * percent;
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
