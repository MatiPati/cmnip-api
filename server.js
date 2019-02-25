const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const jsonfile = require('jsonfile');
const fs = require('fs');
const https = require('https');
const http = require('http');

const port = 11290; //11289 for http
const app = express();

app.use(morgan('combined'));
app.use(cors());

const privateKey = fs.readFileSync('ssl/server.key', 'utf8');
const certificate = fs.readFileSync('ssl/server.crt', 'utf8');
const credentials = {key: privateKey, cert: certificate};
const httpsServer = https.createServer(credentials, app);
const httpServer = http.createServer(app);

const file = jsonfile.readFileSync("Poland_names.json");

app.get('/names', (req, res) => {
    const start = parseInt(req.query.start);
    const limit = parseInt(req.query.limit);
    const year = parseInt(req.query.year);
    let skip = false;
    let years = true;
    if (isNaN(start) || isNaN(limit))
        skip = true;
    if (isNaN(year))
        years = false;
    let names = [];
    file.forEach((obj) => {
        if (names.indexOf(obj.Imie) === -1)
            if (years) {
                if (obj.Rok === year)
                    names.push(obj.Imie);
            } else
                names.push(obj.Imie);
        if (!skip && names.length > start + limit)
            return 0;
    });
    const response = skip ? names : names.slice(start, start + limit);
    res.json(response);
});

app.get('/name/:name', (req, res) => {
    const name = req.params.name.toUpperCase();
    let resp_name = "";
    let resp_sex = "";
    let resp_years = [];
    file.forEach((obj) => {
        if (obj.Imie == name) {
            resp_years.push('"' + obj.Rok + '":{"uses":"' + obj.Liczba + '"}');
            resp_name = obj.Imie;
            resp_sex = obj.Plec;
        }
    });
    if(resp_name=="")
        res.json("There is no name like yours in our database sorry :(");
    const response =JSON.parse('{"name":"' + resp_name + '","sex":"' + resp_sex + '", "years":{' + resp_years + '}}');

    res.json(response);
});

httpServer.listen(port - 1);
httpsServer.listen(port);
