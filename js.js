var $params = {};
var $svg = {width: 800, height: 100};
var $red = '#D82C31';

function init () {
    parseQs();
    $params.start = parseTimeInSeconds($params.start);
    $params.end = parseTimeInSeconds($params.end);
    $params.diff = $params.end - $params.start;
    $params.diffPercent = $params.diff / $params.end;
    
    makeAnimation();
    showTime();
}

function makeAnimation () {
    $svg.main = (
        d3.select('svg#animation')
        .attr('width', $svg.width)
        .attr('height', $svg.height)
    );
    $svg.pacman = (
        $svg.main.append('path')
        .attr('d', computePacmanCords())
        .attr('fill', $red)
    );
}

function computePacmanCords () {
    var percent = (getNowTimeInSeconds() - $params.start) / $params.diff;
    percent = Math.min(percent, 1.0);
    var halfHeight = $svg.height / 2;
    var road = halfHeight + ($svg.width - $svg.height) * percent;
    var doublePI = 2 * Math.PI;
    var mountSize = 0.08 * (Math.sin(doublePI * percent * 5) + 1) + 0.01;
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

    (
        $svg.pacman
        .transition() // slow :/
        .ease(d3.easeLinear)
        .duration(miliseconds)
        .attr('d', computePacmanCords())
    );

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
    return hours * 3600 + minutes * 60 + seconds;
}

function lpad (x) {
    if (x < 10) {
        return `0${x.toFixed()}`;
    }
    return x.toFixed();
}
