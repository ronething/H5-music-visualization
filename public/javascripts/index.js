function $(s) {
    return document.querySelectorAll(s);
}

var music_list = $("#list li");

for (var i = 0; i < music_list.length; i++) {
    music_list[i].onclick = function () {
        for (var j = 0; j < music_list.length; j++) {
            music_list[j].className = "";
        }
        this.className = "selected";
        load("/media/" + this.title);
    }
}

var xhr = new XMLHttpRequest();
var ac = new (window.AudioContext || window.webkitAudioContext)();
var gainNode = ac[ac.createGain ? "createGain" : "createGainNode"]();
gainNode.connect(ac.destination);

var source = null;
var count = 0;
function load(url) {
    count++;
    var n = count ;
    // 相当于 
    // var n = ++count;
    // console.log("n is ", n);
    // console.log("count is ", count);
    source && source[source.stop ? "stop" : "noteOff"]();
    xhr.abort();
    xhr.open("GET", url);
    xhr.responseType = "arraybuffer";
    xhr.onload = function () {
        if (n != count) return;
        ac.decodeAudioData(xhr.response, function (buffer) {
            if (n != count) return;
            var bufferSource = ac.createBufferSource();
            bufferSource.buffer = buffer;
            bufferSource.connect(gainNode);
            // bufferSource.connect(ac.destination);
            bufferSource[bufferSource.start ? "start" : "noteOn"](0);
            source = bufferSource;
        }, function (err) {
            console.log(err);
        })
    }
    xhr.send();
}

function changeVolume(precent) {
    gainNode.gain.value = precent * precent;
}

$("#volume")[0].onchange = function () {
    changeVolume(this.value / this.max);
}

$("#volume")[0].onchange();