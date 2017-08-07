'use strict';
var http = require('http');
var https = require('https');
var Alexa = require('alexa-sdk');

var JSONPath = require('jsonpath-plus');
 

//Replace with your app ID (OPTIONAL).  You can find this value at the top of your skill's page on http://developer.amazon.com.  
//Make sure to enclose your value in quotes, like this: var APP_ID = "amzn1.ask.skill.bb4045e6-b3e8-4133-b650-72923c5980f1";
var APP_ID = "amzn1.ask.skill.bdcd7c4c-439f-4673-939c-235d30b6f193";

var SKILL_NAME = "Cheat River Float Trip";
var GET_FACT_MESSAGE = "Here's the river level in CFS: ";
var HELP_MESSAGE = "You can say what's the current river level, what's the current weather, what is the water temperature, should I take the trip or, you can say exit... What can I help you with?";
var HELP_REPROMPT = "What can I help you with?";
var STOP_MESSAGE = "Goodbye!";
var alexa;

exports.handler = function(event, context, callback) {
    alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        console.log("In LaunchRequest");
        this.emit('GetDischargeIntent');
    }, 
    'GetWeatherIntent': function () {
        //
        // USGS Water Information System REST API details
        //
        var options = {
            host: 'api.openweathermap.org',
            port: 80,
            path: '/data/2.5/weather?zip=26287,us&appid=ca54ac9876a10a706d1409e275337f27&units=imperial',
            method: 'GET'
        };
        httpGet(options, http, function (response) {
            // Parse the response into a JSON object ready to be formatted.
            var responseData = JSON.parse(response);

            var weatherDesc = JSONPath({json: responseData, path: '$.weather[0].description'});
            var weatherTemp = JSONPath({json: responseData, path: '$.main.temp'});
            
            // Check if we have correct data, If not create an error speech out to try again.
            if (responseData == null) {
                output = "There was a problem with getting data please try again";
            }
            
            var weatherText = 'Current weather for Parsons.  The temperature is ' + weatherTemp +  ' fahrenheit.  The conditions are ' + weatherDesc;

            alexa.emit(':tell', weatherText);
        });
    },
    'GetDischargeIntent': function () {
        //
        // USGS Water Information System REST API details
        //
        var options = {
            host: 'waterservices.usgs.gov',
            port: 443,
            path: '/nwis/iv/?site=03069500&format=json',
            method: 'GET'
        };
        httpGet(options, https, function (response) {
            // Parse the response into a JSON object ready to be formatted.
            var responseData = JSON.parse(response);

            var streamFlow = JSONPath({json: responseData, path: '$.value.timeSeries[?(@.variable.variableName=="Streamflow, ft&#179;/s")].values[0].value[0].value'});

            // Check if we have correct data, If not create an error speech out to try again.
            if (responseData == null) {
                output = "There was a problem with getting data please try again";
            }
            
            var dischargeText = 'Stream flow at Cheat River near Parsons is ' + streamFlow + " cubic feet per second";

            alexa.emit(':tell', dischargeText);
        });
    },
    'GetRecommendationIntent': function () {
        //
        // USGS Water Information System REST API details
        //
        var options = {
            host: 'waterservices.usgs.gov',
            port: 443,
            path: '/nwis/iv/?site=03069500&format=json',
            method: 'GET'
        };
        httpGet(options, https, function (response) {
            // Parse the response into a JSON object ready to be formatted.
            var responseData = JSON.parse(response);

	    var recText = "";

            var streamFlow = JSONPath({json: responseData, path: '$.value.timeSeries[?(@.variable.variableName=="Streamflow, ft&#179;/s")].values[0].value[0].value'});

            // Check if we have correct data, If not create an error speech out to try again.
            if (responseData == null) {
                output = "There was a problem with getting data please try again";
            }
            
	    if (streamFlow < 100)
		recText = "Water is too low for paddling";
	    else if (streamFlow > 100 && streamFlow < 250)
		recText = "Water is crystal clear and beautiful! Great for hot summer days when getting out of your boat is fun. It will be necessary to get out of the boat and drag through shallow areas – we recommend short trips. This water level is good for tubing.";
	    else if (streamFlow >= 250 && streamFlow < 500)
		recText = "At this level the river is still low and may require some dragging. The fish are biting in the deeper holes.";
	    else if (streamFlow >= 500 && streamFlow < 1000)
		recText = "This is A great water level. The potential still exists to get hung up on some rocks – learning to read the river really helps!";
	    else if (streamFlow >= 1000 && streamFlow < 5000)
		recText = "The river is moving more rapidly, meaning less paddling and more floating. Stay away from river banks to avoid tree limbs (strainers) and other hidden debris just under the surface of the water.";
	    else if (streamFlow >= 5000 && streamFlow < 8000)
		recText = "Water is moving fast. This level requires boating experience and knowledge of river safety.";
	    else if (streamFlow > 8000)
		recText = "Conditions for EXPERTS ONLY. Water moving at this level is extremely swift and requires expert knowledge and experience to negotiate. Do not overestimate your skill level and avoid putting your life in danger!"

	    var introText = "The stream flow is " + streamFlow + " cubic feet per second. The cheat river water trail website says ";

            alexa.emit(':tell', introText + recText);
        });
    },
    'GetTemperatureIntent': function () {
        //
        // USGS Water Information System REST API details
        //
        var options = {
            host: 'waterservices.usgs.gov',
            port: 443,
            path: '/nwis/iv/?site=03069500&format=json',
            method: 'GET'
        };
        httpGet(options, https, function (response) {
            // Parse the response into a JSON object ready to be formatted.
            var responseData = JSON.parse(response);

            var waterTemp = JSONPath({json: responseData, path: '$.value.timeSeries[?(@.variable.variableName=="Temperature, water, &#176;C")].values[0].value[0].value'});

            // Check if we have correct data, If not create an error speech out to try again.
            if (responseData == null) {
                output = "There was a problem with getting data please try again";
            }
            
            var tempText = 'Water temperature at Cheat River near Parsons is ' + waterTemp + " celsius";

            alexa.emit(':tell', tempText);
        });
    },
    'AMAZON.HelpIntent': function () {
        var speechOutput = HELP_MESSAGE;
        var reprompt = HELP_REPROMPT;
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', STOP_MESSAGE);
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', STOP_MESSAGE);
    },
    'Unhandled': function() {
        this.emit(':tell', "UnHandled intent this is an error");
    }
};

// Create a web request and handle the response.
function httpGet(options, protocol, callback) {
    


    var req = protocol.request(options, (res) => {

            var body = '';

            res.on('data', (d) => {
                body += d;
            });

            res.on('end', function () {
                callback(body);
            });

    });
    req.end();

    req.on('error', (e) => {
        console.log("In error state");
        console.error(e);
    });
}
