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
                if (obj.Rok == year)
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
    let current_year = file[0].Rok;
    let start_year = current_year;
    file.forEach((obj) => {
        if (obj.Rok > current_year) {
            if (resp_years.length < current_year - start_year)
                resp_years.push('"' + obj.Rok + '":{"uses":"0"}');
            current_year++;
        }
        if (obj.Imie == name) {
            resp_years.push('"' + obj.Rok + '":{"uses":"' + obj.Liczba + '"}');
            resp_name = obj.Imie;
            resp_sex = obj.Plec;
        }
    });
    if (resp_name == "")
        res.json("There is no name like yours in our database sorry :(");
    current_year++;
    if (resp_years.length < current_year - start_year)
        resp_years.push('"' + current_year + '":{"uses":"0"}');
    const response = JSON.parse('{"name":"' + resp_name + '","sex":"' + resp_sex + '", "years":{' + resp_years + '}}');

    res.json(response);
});

app.get('/search/:search', (req, res) => {
    const search = req.params.search.toUpperCase();
    let resp_obj = [];
    let limit = parseInt(req.query.limit);
    let skip_limit = false;
    if (isNaN(limit)) {
        skip_limit = true;
        limit = 0;
    }
    file.forEach((obj) => {
        if (obj.Imie.includes(search)) {
            let done = false;
            resp_obj.forEach((resp) => {
                if (resp.name == obj.Imie) {
                    resp.years += '"' + obj.Rok + '" : {"uses":"' + obj.Liczba + '"},';
                    done = true;
                }
            });
            if (!done && (limit > 0 || skip_limit)) {
                limit--;
                let obb = resp_obj.push({
                    name: obj.Imie,
                    sex: obj.Plec,
                    years: '{"' + obj.Rok + '" : {"uses":"' + obj.Liczba + '"},'
                });
            }
        }
    });
    resp_obj.forEach((obj) => {
        obj.years = JSON.parse(obj.years.slice(0, -1) + "}");
    });
    res.json(resp_obj);
});

app.get('/compare/:name1/:name2', (req, res) => {
    const name1 = req.params.name1.toUpperCase();
    const name2 = req.params.name2.toUpperCase();
    let uses1 = [];
    let uses2 = [];
    let year = file[0].Rok;
    let start_year = year;
    file.forEach((obj) => {
        if (obj.Rok > year + 1)
            year++;
        if (obj.Rok > year) {
            if (uses1.length <= year - start_year)
                uses1.push(0);
            if (uses2.length <= year - start_year)
                uses2.push(0);
        }
        if (obj.Imie == name1) {
            uses1.push(obj.Liczba);

        }
        if (obj.Imie == name2) {
            uses2.push(obj.Liczba);
        }
    });
    year++;
    if (uses1.length <= year - start_year)
        uses1.push(0);
    if (uses2.length <= year - start_year)
        uses2.push(0);
    let resp = {
        "name1": name1,
        "name2": name2,
        "sum1": 0,
        "sum2": 0
    };
    let years = "{";
    for (let i = start_year; i <= year; i++) {
        years += '"' + i + '":{"uses1":"' + uses1[i - start_year] + '","uses2":"' + uses2[i - start_year] + '",' +
            '"difference":"' + (uses1[i - start_year] - uses2[i - start_year]) + '","sum":"' + (parseInt(uses1[i - start_year]) + parseInt(uses2[i - start_year])) + '"},';
        resp.sum1 += parseInt(uses1[i - start_year]);
        resp.sum2 += parseInt(uses2[i - start_year]);
    }
    years = years.slice(0, -1) + "}";
    resp.years = JSON.parse(years);
    res.json(resp);
});

httpServer.listen(port - 1, () => {
    console.log("++++++++++++++CMIP-API++++++++++++++\n" +
        "+++++Created by Patryk Kozarski+++++\n" +
        "++++++++++++++++++++++++++++++++++++\n" +
        "Listening http at port " + (port - 1));
});
httpsServer.listen(port, () => {
    console.log("Listening https at port " + port);
});
