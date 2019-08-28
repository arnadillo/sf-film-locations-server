const express = require('express');
const app = express()
const Papa = require('papaparse');
const _ = require('lodash');
const fs = require('fs');

const PORT = 3000;
const DATASET_LOCATION = './datasets/Film_Locations_in_San_Francisco.csv';

app.get('/status', (req, res) => res.send('OK'));

app.get('/locations', function(req, res) {
    fs.readFile(DATASET_LOCATION, 'utf8', function(err, contents) {
        
        // Parsing the CSV.
        let { data } = Papa.parse(contents, {
            header: true
        });

        // Formatting the data in CSV into an array of objects.
        let formattedData = _.chain(data)
            .groupBy('Title')
            .map((value, key) => ({
                 Title: key, 
                 Locations: _.map(value, 'Locations')
            }))
            .value();

        console.log('\n\n formattedData: ',  formattedData[0]);
        
        res.setHeader('Content-Type', 'application/json');
        res.send(formattedData);
    });
});

app.listen(PORT, () => console.log(`Application is listening on port ${PORT}!`)); 