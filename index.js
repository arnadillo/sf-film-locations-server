const express = require('express');
const app = express();
const Papa = require('papaparse');
const _ = require('lodash');
const fs = require('fs');
const rp = require('request-promise');

const PORT = 3001;
const DATASET_LOCATION = './datasets/Film_Locations_in_San_Francisco.csv';

let formattedData;

main();

app.get('/status', (req, res) => res.send('OK'));

app.get('/locations', async function(req, res) {
    console.log('\n\n == Request query: ', req.query);

    let foundEntry = _.find(formattedData, { 'Title': _.lowerCase(decodeURIComponent(req.query.title)) });
    let locationData = await Promise.all(_.map(foundEntry.Locations, async (location) => {
        return {
            name: location,
            location: await geocodeAddress(location)
        };
    }));

    console.log('\n\n === locationData: ', locationData);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
        Title: foundEntry.Title,
        Locations: locationData
    }));
});

async function geocodeAddress(location){
    //TODO: Fix query string syntax for this.
    let options = {
        method: 'GET',
        uri: `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&region=ca&key=AIzaSyDNk7in3pRazdod4nels3lv_7ElxZTtzvo`,
        json: true
    };
    
    return rp(options).then((response) => {
        console.log('\n\n ==== Response: ', response);
        if (_.isEmpty(response.results)) {
            return;
        }

        return response.results[0].geometry.location;
    }).catch((err) => {
        console.log('\n\n === Error inside Geocoding: ', err);
    });
}

app.listen(PORT, () => console.log(`Application is listening on port ${PORT}!`)); 

function main() {
    fs.readFile(DATASET_LOCATION, 'utf8', function(err, contents) {
        
        // Parsing the CSV.
        let { data } = Papa.parse(contents, {
            header: true
        });

        // Formatting the data in CSV into an array of objects.
        formattedData = _.chain(data)
            .groupBy('Title')
            .map((value, key) => ({
                 Title: _.lowerCase(key), 
                 Locations: _.uniq(_.map(value, 'Locations'))
            }))
            .value();
    });
}