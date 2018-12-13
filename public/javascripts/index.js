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

var types = $("#type li");

for (var i = 0; i < types.length; i++) {
    types[i].onclick = function () {
        for (var j = 0; j < types.length; j++) {
            types[j].className = "";
        }
        this.className = "selected";
        draw.type = this.getAttribute("data-type");
    }
}

var xhr = new XMLHttpRequest();
var ac = new (window.AudioContext || window.webkitAudioContext)();
var gainNode = ac[ac.createGain ? "createGain" : "createGainNode"]();
gainNode.connect(ac.destination);

var analyser = ac.createAnalyser();
var size = 128;
analyser.fftSize = size * 2;
analyser.connect(gainNode);

var source = null;
var count = 0;

var box = $("#box")[0];
var height, width;
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
box.appendChild(canvas);

var Dots = [];

function random(m,n) {
    return Math.round(Math.random()*(n-m)+m);
}

function getDots() {
    Dots = [];
    for(var i = 0;i<size;i++){
        var x = random(0,width);
        var y = random(0,height);
        var color = "rgb("+random(0,255)+","+random(0,255)+","+random(0,255)+")";
        Dots.push({
            x:x,
            y:y,
            color: color
        });
    }
}

var line;
function resize() {
    height = box.clientHeight;
    width = box.clientWidth;
    canvas.height = height;
    canvas.width = width;
    line = ctx.createLinearGradient(0, 0, 0, height);
    line.addColorStop(0, "red");
    line.addColorStop(0.5, "yellow");
    line.addColorStop(1, "green");
    getDots();
}

resize();

window.onresize = resize;

function draw(arr) {
    ctx.clearRect(0, 0, width, height);
    var w = width / size;
    ctx.fillStyle = line;
    for (var i = 0; i < size; i++) {
        if(draw.type=="column"){
            var h = arr[i] / 256 * height;
            ctx.fillRect(w * i, height - h, w * 0.8, h);
        }else if(draw.type=="dot"){
            ctx.beginPath();
            var o = Dots[i];
            var r = arr[i]/256 * 50;
            ctx.arc(o.x,o.y,r,0,Math.PI*2,true);
            var g = ctx.createRadialGradient(o.x,o.y,0,o.x,o.y,r);
            g.addColorStop(0,"#fff");
            g.addColorStop(1,o.color);
            ctx.fillStyle = g;
            ctx.fill();
            // ctx.strokeStyle = "#fff";
            // ctx.stroke();
        }
    }
}
draw.type = "column";

function load(url) {
    count++;
    var n = count;
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
            bufferSource.connect(analyser);
            // bufferSource.connect(gainNode);
            // bufferSource.connect(ac.destination);
            bufferSource[bufferSource.start ? "start" : "noteOn"](0);
            source = bufferSource;
        }, function (err) {
            console.log(err);
        })
    }
    xhr.send();
}

function visualizer() {
    var arr = new Uint8Array(analyser.frequencyBinCount);
    var requestAnimationFrame = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.mzRequestAnimationFrame;
    function v() {
        analyser.getByteFrequencyData(arr);
        draw(arr);
        requestAnimationFrame(v);
    }
    requestAnimationFrame(v);
}

visualizer();

function changeVolume(percent) {
    gainNode.gain.value = percent * percent;
}

$("#volume")[0].onchange = function () {
    changeVolume(this.value / this.max);
}

$("#volume")[0].onchange();