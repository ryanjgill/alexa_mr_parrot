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
      return callback(data.name, data.url, searchUrl);
    } else {
      throw(new Error('Request failed!'));
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


    getSoundFromSoundy(term, function(name, url, searchUrl) {
      let audioUrl = url.split('.mp3')[0] + '.mp3';
      let audioHtml = `<audio src="http:${audioUrl}" />`
      let speechOutput = `I searched for term: ${term} and I found a sound matching the name: ${name}. ${audioHtml}`;
      let cardTitle = `Sound found!`;
      let cardContent = url;

      //this.emit(':tellWithCard', speechOutput, cardTitle, cardContent);

      let response = {
        version: "1.0",
        response: {
            shouldEndSession: true,
            directives: [
                {
                    type: "AudioPlayer.Play",
                    playBehavior: "REPLACE_ALL",
                    audioItem: {
                        stream: {
                            url: `https:${audioUrl}`,
                            token: "0",
                            expectedPreviousToken: null,
                            offsetInMilliseconds: 200
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