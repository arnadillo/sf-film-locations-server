const express = require('express');
const app = express();
const Papa = require('papaparse');
const _ = require('lodash');
const fs = require('fs');
const rp = require('request-promise');

const PORT = 3001;
const DATASET_LOCATION = './datasets/Film_Locations_in_San_Francisco.csv';

let formattedData;

loadDataInMemory();

app.get('/status', (req, res) => res.send('OK'));

app.get('/locations', async function(req, res) {
    let foundEntry = _.find(formattedData, { 'Title': _.lowerCase(decodeURIComponent(req.query.title)) });
    
    if (_.isNil(foundEntry)) {
        console.log(`\nNo entry found in data for ${req.query.title}`);
        res.sendStatus(404);
        
        return;
    }

    let locationData = await Promise.all(_.map(foundEntry.Locations, async (location) => {

        return {
            name: location,
            location: await geocodeAddress(location)
        };
    }));

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
        Title: foundEntry.Title,
        Locations: locationData
    }));
});

/**
 * Takes a textual address and converts it into geographical coordinates
 * if googleapis is able to find it, otherwise returns undefined.
 * 
 * @param {string} location - An ambiguous textual address (e.g. 'Golden Gate Bridge')
 */
async function geocodeAddress(location){

    let options = {
        method: 'GET',
        uri: `https://maps.googleapis.com/maps/api/geocode/json`,
        qs: {
            key: process.env.GOOGLE_API_KEY,
            address: location,
            region: 'CA'
        },
        json: true
    };
    
    return rp(options).then((response) => {
        // Addresses not geocoded will not have coordinates.
        if (_.isEmpty(response.results)) {
            return;
        }

        // Return the geocoded address lat and long.
        return response.results[0].geometry.location;
    }).catch((err) => {
        console.log(`\nError during geocoding process: ${err}`);
    });
}

app.listen(PORT, () => console.log(`Application is listening on port ${PORT}!`)); 

/**
 *  Reads the .csv, parses it and formats the data in preparation 
 *  for query and geocoding.
 */
function loadDataInMemory() {
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
        
        return;
    });
}

module.exports = {
    app,
    geocodeAddress
};
