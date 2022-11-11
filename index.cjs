// const OBSWebSocket = require('obs-websocket-js').default;
// const obs = new OBSWebSocket();


// const { exec } = require("child_process");

// Use configuration file for configurations.
const config = require('./config.json');

const marker = require('./modules/obs-record-marker');

marker.connect(
    config.obswebsocket.url,
    config.obswebsocket.port,
    config.obswebsocket.password
);

const express = require('express');
const app = express();

app.get('/', function (req, res) {
    res.send('Hello World');
 })

app.get('/remote/addMarker/:comment/:duration', (req, res) => {
    marker.add({
        "comment": req.params.comment,
        "name": req.params.comment,
        "duration": parseFloat(req.params.duration),
        "type": "adhoc"
    })
    res.send("Marker added.")
});

 var server = app.listen(8081, function () {
    var host = server.address().address
    var port = server.address().port
    
    console.log("Example app listening at http://%s:%s", host, port)
 })