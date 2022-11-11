const OBSWebSocket = require('obs-websocket-js').default;
const obs = new OBSWebSocket();
const { exec } = require("child_process");
const Timecode = require('smpte-timecode');

var url;
var port;
var password;

var startTime = "";
var stopTime = "";
var markers = [];
var currentMarker;

module.exports = {
    "constructor": () => {

    },
    "connect": async (url, port, password) => {
        this.url;
        this.port;
        this.password;
    
        obs.connect(`ws://${url}:${port}`, password).then( async () => {
            //Get the current scene;
        });
    
        obs.on('ConnectionOpened', async function () {
            console.log('--------OBS MARKERS--------');     
          });
    
        obs.on('CurrentProgramSceneChanged', async function (data) {
            var t = new Timecode(new Date());
            t.subtract(startTime);
            console.log(t.toString(), `SCENE: "${data.sceneName}"`);
            let now = new Date();
            let startNewTime = (now - startTime) / 1000;
            stopMarker();
            addMarker(data.sceneName,data.sceneName, startNewTime, 0, "scene");
          
        });
    
        obs.on('RecordStateChanged', async (data) => {
            switch(data.outputState) {
                case "OBS_WEBSOCKET_OUTPUT_STARTED":
                    startTime = new Date();
                    var t = new Timecode(startTime);
                    console.log("00:00:00:00", "RECORD START");
                    const {currentProgramSceneName} = await obs.call('GetCurrentProgramScene');
                    addMarker(currentProgramSceneName, currentProgramSceneName, 0, 0, "scene");
                    break;
                case "OBS_WEBSOCKET_OUTPUT_STOPPED":
                    let now = new Date();
                    var t = new Timecode(new Date());

                    t.subtract(startTime);
                    console.log(t.toString(), "RECORD STOP");
                    setTimeout(function(){
                        stopTime = new Date();
                        stopMarker();
                  let diff = recordTime();
                  
                    let command = `exiftool -overwrite_original `; 
                    markers.forEach((marker) => {
                        command += `-tracksmarkers+="{Comment='', Type=Segmentation, StartTime=${marker.startTime}, Duration=${marker.duration}, Name=${marker.name}}" `
                    });
                    command += `"${data.outputPath}"`;
    
                    exec(command, (error, stdout, stderr) => {
                        if (error) {
                            console.log(`error: ${error.message}`);
                            return;
                        }
                        if (stderr) {
                            console.log(`stderr: ${stderr}`);
                            return;
                        }
                        console.log(`stdout: ${stdout}`);
                    });
    
                    reset();
                  
                },2000);
                break; 
            }
        });
    },
    "add": async (params) => {
        let now = new Date();
        var t = new Timecode(now);
        t.subtract(startTime);
        console.log(t.toString(), `MARKER: "${params.comment}"`);
        let startNewTime = (now - startTime) / 1000;
        addMarker(params.comment, params.name, startNewTime, params.duration, params.type);
    },
    
}

function addMarker(comment, name, startTime, duration, type ) {
    markers.push({
        "name": name,
        "comment": comment,
        "startTime": startTime,
        "duration": duration,
        "type": type
    })
}

function stopMarker() {
    let now = new Date();
    //console.log("Start", markers[markers.length-1].startTime);
    //console.log("Stop", ((now-startTime)/1000));
    let diff = ((now-startTime) - markers[markers.length-1].startTime) / 1000;
    if(markers[markers.length-1].type == "scene") {
        markers[markers.length-1].duration = diff-markers[markers.length-1].startTime;
    }
    
}

// reset() is used to reset the numbers after a recording is complete.
function reset() {
    startTime = "";
    stopTime = "";
    markers = [];
}

function recordTime() {
    let diff = (stopTime - startTime) / 1000;
    return diff;
}
