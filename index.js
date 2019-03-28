var express = require("express");
var fs = require('fs');
var app = express();

/* serves main page */
app.get("/", function (req, res) {
    res.sendfile('index.html')
});

app.get("/read", function (req, res) {
    res.sendfile('save.json')
});

app.post("/write", function (req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        fs.writeFile('save.json', body, 'utf8', () => {
            res.end('ok');
        });
    });
});

app.post("/read", function (req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        fs.writeFile('save.json', body, 'utf8', () => {
            res.end('ok');
        });
    });
});

/* serves all the static files */
app.get(/^(.+)$/, function (req, res) {
    console.log('static file request : ' + req.params);
    res.sendFile(__dirname + req.params[0]);
});

var port = process.env.PORT || 5000;
app.listen(port, function () {
    console.log("Listening on " + port);
});