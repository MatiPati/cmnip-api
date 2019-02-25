const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const jsonfile = require('jsonfile');
const port = 11290;
const app = express();

app.use(morgan('combined'));
app.use(cors());

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

app.listen(port, () => {
    console.log("app listen on " + port);
});
