var $params = {};

function init () {
    parseQs();
    $params.start = parseTimeInSeconds($params.start);
    $params.end = parseTimeInSeconds($params.end);
    $params.diff = $params.end - $params.start;

    showTime();
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
    
    var date = new Date();
    // 1030, not 1000 because sometimes function lost one second
    setTimeout(showTime, 1030 - date.getMilliseconds());
}

function getEl(name) {
    return document.getElementById(name);
}

function parseTimeInSeconds(value) {
    var hours = parseInt(value.substr(0, 2));
    var minutes = parseInt(value.substr(3, 2));
    var seconds = parseInt(value.substr(6, 2));
    return hours * 3600 + minutes * 60 + seconds;
}

function lpad (x) {
    if (x < 10) {
        return `0${x.toFixed()}`;
    }
    return x.toFixed();
}
