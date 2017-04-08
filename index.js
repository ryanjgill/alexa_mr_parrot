'use strict';

const Alexa = require('alexa-sdk')
	, request = require('request')
	, APP_ID = 'amzn1.ask.skill.93334129-07bd-478c-bec0-6a32768d0a89'
	, SKILL_NAME = 'Sounder'
	;

function getSoundFromSoundy(term, callback) {
  const baseUrl = `https://www.soundy.top/api/sounds`;
  let searchUrl = term ? `${baseUrl}?q=${term}` : baseUrl;

  console.log('URL: ', searchUrl);

  return request(searchUrl, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      // parse the body and format for desired output
      let data = JSON.parse(body)[0]; // taking the first item in the returned results

      if (!data || !data.hasOwnProperty('url')) {
        return callback({
          type: 'no_results',
          term: term
        });
      }

      return callback(null, data.name, data.url, searchUrl);
    } else {
      console.log('ERROR: ', error);
      return callback({
        type: 'service_down',
        term: term
      });
    }
  });
}

exports.handler = function(event, context, callback) {
  let alexa = Alexa.handler(event, context);
  alexa.APP_ID = APP_ID;
  alexa.registerHandlers(handlers);
  alexa.execute();
};

let handlers = {
  'LaunchRequest': function() {
    this.emit('SearchForSound');
  },
  'SearchForSoundIntent': function() {
    this.emit('SearchForSound');
  },
  'SearchForSound': function() {
    let term =  this.event.request && this.event.request.intent && this.event.request.intent.slots && this.event.request.intent.slots.Term
      ? this.event.request.intent.slots.Term.value
      : '';


    getSoundFromSoundy(term, function(err, name, url, searchUrl) {
      // if no matching results, respond with search term.
      if (err && err.type === 'no_results') {
        let speechOutput = `I searched for term: ${err.term} but didn't find any matches.`;
        this.emit(':tellWithCard', speechOutput, 'No matching results', speechOutput);
        return;
      }

      // if api error, respond with message saying its down
      if (err && err.type === 'service_down') {
        let speechOutput = `The sound a. p. i. service appears to be down. Please try again later.`;
        this.emit(':tellWithCard', speechOutput, 'Search API is down', speechOutput);
        return;
      }

      // Play audio from url of matching clip
      let audioUrl = url.split('.mp3')[0] + '.mp3';
      let audioHtml = `<audio src='http:${audioUrl}' />`
      let response = {
        version: '1.0',
        response: {
            shouldEndSession: true,
            directives: [
                {
                    type: 'AudioPlayer.Play',
                    playBehavior: 'REPLACE_ALL',
                    audioItem: {
                        stream: {
                            url: `https:${audioUrl}`,
                            token: '0',
                            expectedPreviousToken: null,
                            offsetInMilliseconds: 0
                        }
                    }
                }
            ]
        }
    }

    this.context.succeed(response);

    }.bind(this));
  },
  'AMAZON.HelpIntent': function() {
    let reprompt = `What can I help you with?`
     , speechOutput = `You can ask me for a sound, or, you can say exit... ${reprompt}`
     ;

    this.emit(':ask', speechOutput, reprompt);
  },

  'AMAZON.CancelIntent': function() {
    this.emit(':tell', 'Goodbye!');
  },
  'AMAZON.StopIntent': function() {
    this.emit(':tell', 'Goodbye!');
  }, 
  'Unhandled': function() {
    this.emit(':ask', 'Sorry, something went wrong.');
  }
};