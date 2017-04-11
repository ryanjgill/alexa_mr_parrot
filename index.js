'use strict';

const Alexa = require('alexa-sdk')
  , request = require('request')
  , APP_ID = 'amzn1.ask.skill.93334129-07bd-478c-bec0-6a32768d0a89'
  , SKILL_NAME = 'Parrot'
  ;

function getSoundFromSoundy(term, cb) {
  const baseUrl = `https://www.soundy.top/api/sounds`;
  let searchUrl = term ? `${baseUrl}?q=${term}` : baseUrl;

  console.log('URL: ', searchUrl);

  return request(searchUrl, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      return cb(null, JSON.parse(body));
    } else {
      console.log('ERROR: ', error);
      return cb({
        type: 'service_down',
        term: term
      });
    }
  });
}

exports.handler = function (event, context, callback) {
  let alexa = Alexa.handler(event, context);
  alexa.APP_ID = APP_ID;
  alexa.registerHandlers(handlers);
  alexa.execute();
};

let handlers = {
  'LaunchRequest': function () {
    this.emit('SearchForSound');
  },
  'SearchForSoundIntent': function () {
    this.emit('SearchForSound');
  },
  'SearchForSound': function () {
    let term = this.event.request &&
      this.event.request.intent &&
      this.event.request.intent.slots &&
      this.event.request.intent.slots.Term
      ? this.event.request.intent.slots.Term.value
      : '';

    getSoundFromSoundy(term, function (err, results) {
      // if api error, respond with message saying its down
      if (err && err.type === 'service_down') {
        let speechOutput = `The sound a. p. i. service appears to be down. Please try again later.`;
        this.emit(':tellWithCard', speechOutput, 'Search API is down', speechOutput);
        return;
      }

      // if no matching results, respond with search term.
      if (results && results.length === 0) {
        let speechOutput = `I searched for term: ${term} but didn't find any matches.`;
        this.emit(':tellWithCard', speechOutput, 'No matching results', speechOutput);
        return;
      }

      if (results && results.length > 1) {
        this.emit('MultipleSearchResults', results);
        return;
      }

      // Play audio if only 1 result
      this.emit('PlayAudio', results[0]);
    }.bind(this));
  },
  'AMAZON.HelpIntent': function () {
    let reprompt = `What can I help you with?`
      , speechOutput = `You can ask me for a sound, or, you can say exit... ${reprompt}`
      ;

    this.emit(':ask', speechOutput, reprompt);
  },

  'AMAZON.CancelIntent': function () {
    this.emit(':tell', 'Goodbye!');
  },
  'AMAZON.StopIntent': function () {
    this.emit(':tell', 'Goodbye!');
  },
  'MultipleSearchResults': function (results) {
    let speechOutput = `I found a lot of answers, pick a number between 1 and ${results.length}.`
    let reprompt = `Pick a number between 1 and ${results.length}.`;

    this.attributes['searchResults'] = results;

    this.emit(':ask', speechOutput, reprompt);
  },
  'OutsideRange': function (index) {
    let totalResults = this.attributes.searchResults.length;
    let reprompt = `pick a number between 1 and ${this.attributes.searchResults.length}`;
    let speechOutput = `${index} is outside the range, Please ${reprompt}`;
    this.emit(':ask', speechOutput, reprompt);
  },
  'SelectResult': function () {
    let index = this.event.request &&
      this.event.request.intent &&
      this.event.request.intent.slots &&
      this.event.request.intent.slots.ResultIndex
      ? this.event.request.intent.slots.ResultIndex.value - 1
      : 0;

    if (index > this.attributes.searchResults.length - 1) {
      this.emit('OutsideRange', index);
      return;
    }

    this.emit('PlayAudio', this.attributes.searchResults[index]);
  },
  'PlayAudio': function (audio) {
    // Play audio from url of matching clip
    let audioUrl = audio.url.split('.mp3')[0] + '.mp3';
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
  }
};