var audioCtx = new window.AudioContext();
var analyser = audioCtx.createAnalyser();
analyser.minDecibels = -60;
analyser.maxDecibels = -10;
analyser.smoothingTimeConstant = 0.5;
analyser.fftSize = 16384;

var frequencyArray = new Uint8Array(analyser.frequencyBinCount);
var timeArray = new Float32Array(analyser.fftSize);

const canvas = document.getElementById("canvas");

function resize() {
    canvas.width = window.innerWidth - 2 * canvas.offsetLeft;
}
resize();
window.addEventListener("resize", resize);

const canvasCtx = canvas.getContext('2d');

const fourierPitch = document.getElementById("fourierPitch");
const fourierNote = document.getElementById("fourierNote");
const fourierOff = document.getElementById("fourierOff");
const fourierResolution = document.getElementById("fourierResolution");

fourierResolution.innerText = audioCtx.sampleRate / analyser.fftSize;

if (!navigator.getUserMedia) {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
}

document.getElementById('button').addEventListener('click', function () {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(
        function (stream) {
            audioCtx.resume().then(() => { //chrome...
                var mic = audioCtx.createMediaStreamSource(stream);
                mic.connect(analyser);
                requestAnimationFrame(draw);
                document.getElementById('button').style = 'display: none;';
                document.getElementById('container').style = '';
            });
        },
        function () {
            alert('Error capturing audio.');
        });
});

function draw() {
    analyser.getByteFrequencyData(frequencyArray);

    canvasCtx.fillStyle = 'rgb(0, 0, 0)';
    canvasCtx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    var volume = frequencyArray.reduce((a, b) => a + b) / analyser.frequencyBinCount;
    var pureNoteBucket = null;
    var maxFreq = detectPitch(frequencyArray);

    if (volume > 0.4) {
        var note = noteFromPitch(maxFreq);
        pureNoteBucket = Math.round(notes[note[0]] / (audioCtx.sampleRate / analyser.fftSize));

        fourierPitch.innerText = maxFreq;
        fourierNote.innerText = note[0];
        fourierOff.innerText = `${note[1]}¢`;
    }

    for (let i = 0; i < analyser.frequencyBinCount; i++) {
        let frequency = i * audioCtx.sampleRate / analyser.fftSize;
        if (i == pureNoteBucket) { //this is probably what we're trying to tune to
            canvasCtx.fillStyle = 'rgb(255,120,120)';
        }
        else if (frequency > notes.C && frequency < 2 * notes.C) { //C4 to C5 brighter
            canvasCtx.fillStyle = 'rgb(200,7,7)';
        }
        else {
            canvasCtx.fillStyle = 'rgb(50,5,5)';
        }
        let barHeight = frequencyArray[i];
        canvasCtx.fillRect(2 * i, canvas.clientHeight - barHeight, 1, barHeight);
    }

    requestAnimationFrame(draw);
}

function detectPitch(frequencyArray) {
    let maxBucket = frequencyArray.indexOf(Math.max(...frequencyArray));

    return maxBucket * audioCtx.sampleRate / analyser.fftSize;
}

function noteFromPitch(frequency) {
    //frequency of a note in relation to c4 can be calculated as f = 2 ^ (n/12) * c4_frequnecy and hence follows:
    var noteNum = 12 * (Math.log2(frequency / notes.C));
    //how much off the correct frequnecy we are in cents
    var off = Math.round(100 * (noteNum - Math.round(noteNum)));
    noteNum = Math.round(noteNum) % 12;
    while (noteNum < 0) {
        noteNum += 12;
    }
    noteNum %= 12;
    return [Object.keys(notes)[noteNum], off];
}

const notes = (function () {
    var basicNotes = {
        C: 262,
        'C#': 0,
        D: 0,
        'D#': 0,
        E: 0,
        F: 0,
        'F#': 0,
        G: 0,
        'G#': 0,
        A: 440,
        'A#': 0,
        B: 0,
    }

    var noteNum = 0;

    for (var note in basicNotes) {
        basicNotes[note] = Math.round(Math.pow(2, noteNum / 12) * basicNotes.C);
        noteNum++;
    }
    return basicNotes;
})();

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then(reg => {
            // registration worked
            console.log('Registration succeeded. Scope is ' + reg.scope);
        }).catch(error => {
            // registration failed
            console.log('Registration failed with ' + error);
        });
}