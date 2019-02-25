const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const jsonfile = require('jsonfile');
const port=11290;
const app = express();

app.use(morgan('combined'));
app.use(cors());

const file = jsonfile.readFileSync("Poland_names.json");

//console.log(json[1].Rok);

app.get('/names', (req, res) => {
    let names=[];
    file.forEach( (obj)=>{
        if(names.indexOf(obj.Imie)==-1)
            names.push(obj.Imie);
    });
    res.json(names);
});

app.listen(port, () => {
    console.log("app listen on "+port);
});
