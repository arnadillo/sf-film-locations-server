# veerum-challenge-data-server
Node application that processes the geo data for the Veerum technical challenge, submitted by Arnold Padillo on August 29, 2019.

## Problem statement
> Programming Challenge - San Francisco Movie Locations <br><br>
> Create an application that displays on a map the location of movies filmed in San Francisco. The user should be able to filter the map by searching. <br><br> The data is available at [DataSF:Film Locations](https://data.sfgov.org/Culture-and-Recreation/Film-Locations-in-San-Francisco/yitu-d5am) <br><br> The data service may be consumed directly or a simple backend can be used. <br><br> Please design, test and document your code as if it were going into production and share a link to the hosted repository (e.g. GitHub, BitBucket).


## High-level approach
For this challenge, I decided to load the .csv file in memory, reading it with `fs.readFile` instead of a stream, since the file was relatively small in size (688 KB). While keeping a front-end agnostic approach, I decided that it would be convenient to format the data in such a way that it is modelled in a title-to-locations grouping. <br><br> After extracting the contents of the file with [Papaparse](https://www.papaparse.com/), the data is then regrouped to be formatted in this fashion, where a movie title is paired with its collection of ambiguous addresses:

```
[
   ...
	{
		"Title": "180",
		"Locations": [
			"Epic Roasthouse (399 Embarcadero)",
			"Mason & California Streets (Nob Hill)",
			"Justin Herman Plaza",
			"200 block Market Street",
			"City Hall",
			"Polk & Larkin Streets",
			"Randall Museum",
			"555 Market St."
		]
	}
	...
]	
```

Now that the file is loaded, parsed and formatted, the application is now ready to listen for requests on a configured port. A `/locations` endpoint is available to receive requests, currently written in a way that expects a movie title `title` as a request query parameter.

The route handler fails fast and quickly aborts with an `HTTP 404` whenever the queried title is not found in the data. Otherwise, the corresponding object for the queried title is found, and the program then proceeds to geocode each address entry in the `Locations` array for that title, in order to supplement the response with geographical coordinates (lat, lng):

```
{
	"Title": "180",
	"Locations": [{
			"name": "Epic Roasthouse (399 Embarcadero)",
			"location": {
				"lat": 37.7904926,
				"lng": -122.3890417
			}
		},
		{
			"name": "Mason & California Streets (Nob Hill)",
			"location": {
				"lat": 37.7923897,
				"lng": -122.4104443
			}
		},
		{
			"name": "Justin Herman Plaza",
			"location": {
				"lat": 37.7951195,
				"lng": -122.3952007
			}
		},
		{
			"name": "200 block Market Street",
			"location": {
				"lat": 39.9570268,
				"lng": -75.2008568
			}
		},
		{
			"name": "City Hall",
			"location": {
				"lat": 53.2788195,
				"lng": -110.0065155
			}
		},
		{
			"name": "Polk & Larkin Streets",
			"location": {
				"lat": 37.7913505,
				"lng": -122.4208506
			}
		},
		{
			"name": "Randall Museum",
			"location": {
				"lat": 37.7644489,
				"lng": -122.4381707
			}
		},
		{
			"name": "555 Market St.",
			"location": {
				"lat": 37.7899845,
				"lng": -122.3998704
			}
		}
	]
}

```

The object is then complete and ready to be sent back to the requestor. This approach removes the processing load out of the front-end implementation, and keeps the computing weight on the server-side, where it ought to be.


## Known limitations
* The implementation relies heavily on Google Map APIs to geocode. Not all the location strings in the data set are straightforward and understood by the geocoding API, so it is evident that the addresses that are most complete and identifiable (e.g. "301 Rolph Street") will yield more accurate results when compared to ambiguous addresses (e.g. "Driving around Taylor/Pacific/Leavenworth"). To tackle this challenge further (and given more time), I would have explored an approach involving Natural Language Processing to arrive at more complete and accurate addresses to feed the geocoding API.

* The `/locations` query endpoint does not work on partial text matches. It expects exact string matches (although it is case insensitive).



## Technologies
Node v8.14.0, using the express framework.






