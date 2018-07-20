function showTime () {
    var totalSeconds = Math.max(
        getSearchTimeInSeconds() - getNowTimeInSeconds(),
        0);
    var totalMinutes = totalSeconds / 60; 
    var hours = totalMinutes / 60;
    var minutes = totalMinutes % 60;
    var seconds = totalSeconds % 60;
    getEl('hour').innerHTML = lpad(hours);
    getEl('minute').innerHTML = lpad(minutes);
    getEl('second').innerHTML = lpad(seconds);
    
    var date = new Date();
    setTimeout(showTime, 1000 - date.getMilliseconds());
}

function getEl(name) {
    return document.getElementById(name);
}

function getNowTimeInSeconds() {
    var date = new Date();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    return hours * 3600 + minutes * 60 + seconds;
}

function getSearchTimeInSeconds () {
    var search = window.location.search.substr(1);
    var hours = parseInt(search.substr(0, 2));
    var minutes = parseInt(search.substr(3, 2));
    var seconds = parseInt(search.substr(6, 2));
    return hours * 3600 + minutes * 60 + seconds;
}

function lpad (x) {
    if (x < 10) {
        return `0${x.toFixed()}`;
    }
    return x.toFixed();
}
