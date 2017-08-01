'use strict';
var https = require('https');
var Alexa = require('alexa-sdk');

var JSONPath = require('JSONPath');
 

//Replace with your app ID (OPTIONAL).  You can find this value at the top of your skill's page on http://developer.amazon.com.  
//Make sure to enclose your value in quotes, like this: var APP_ID = "amzn1.ask.skill.bb4045e6-b3e8-4133-b650-72923c5980f1";
var APP_ID = "amzn1.ask.skill.bdcd7c4c-439f-4673-939c-235d30b6f193";

var SKILL_NAME = "Cheat River Float Trip";
var GET_FACT_MESSAGE = "Here's the river level in CFS: ";
var HELP_MESSAGE = "You can say what's the current river level, or, you can say exit... What can I help you with?";
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
    'GetDischargeIntent': function () {
        httpGet(function (response) {
            // Parse the response into a JSON object ready to be formatted.
            var responseData = JSON.parse(response);

            //var streamFlow = JSONPath({json: response, path: '$.value.timeSeries[?(@.variable.variableName=="Streamflow, ft&#179;/s")].values[0].value[0].value}'});
            var streamFlow = 650;
            // Check if we have correct data, If not create an error speech out to try again.
            if (responseData == null) {
                output = "There was a problem with getting data please try again";
            }
            
            var cardTitle = 'Stream flow at Cheat River near Parsons';

            alexa.emit(':tellWithCard', streamFlow, cardTitle, streamFlow);
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
function httpGet(callback) {
    
    //
    // USGS Water Information System REST API details
    //
    var options = {
        host: 'waterservices.usgs.gov',
        port: 443,
        path: '/nwis/iv/?site=03069500&format=json',
        method: 'GET'
    };

    var req = https.request(options, (res) => {

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
