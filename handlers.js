const buildResponseWithNames = require('./utils/buildResponseWithNames.js')
  , getSoundFromSoundy = require('./utils/getSoundFromSoundy.js')
  , scrubName = require('./utils/scrubName.js');

module.exports = {
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
      this.event.request.intent.slots.Term &&
      this.event.request.intent.slots.Term.hasOwnProperty('value')
      ? this.event.request.intent.slots.Term.value
      : '';

    getSoundFromSoundy(term, (err, results) => {
      // if api error, respond with message saying its down
      if (err) {
        console.log(err);
        let speechOutput = `The sound <say-as interpret-as="spell-out">api</say-as> is down at this time. Please try again later.`;
        this.emit(':tellWithCard', speechOutput, 'Search API is down', 'API is down. Please try again later.');
        return;
      }

      // if no matching results, respond with search term.
      if (!results || (results && results.length === 0)) {
        let speechOutput = `I searched for term: ${term} but didn't find any matches.`;
        this.emit(':tellWithCard', speechOutput, 'No matching results', speechOutput);
        return;
      }

      if (results && results.length > 1) {
        // check if first result name matches term
        if (scrubName(results[0].name) === scrubName(term)) {
          this.emit('PlayAudio', results[0]);
          return;
        }

        this.emit('MultipleSearchResults', results);
        return;
      }

      // Play audio if only 1 result
      this.emit('PlayAudio', results[0]);
    });
  },
  'AMAZON.HelpIntent': function () {
    let reprompt = `ask me to mimic something?`
      , speechOutput = `You can ask me for a sound, or, you can say exit... ${reprompt}`
      ;

    this.emit(':ask', speechOutput, reprompt);
  },
  'AMAZON.CancelIntent': function () {
    this.emit(':tell', 'Goodbye!');
  },
  'AMAZON.StopIntent': function () {
    this.emit('ClearAudioAndExit');
  },
  'AMAZON.PauseIntent': function () {
    this.emit('ClearAudioAndExit');
  },
  'ClearAudioAndExit': function () {
    let response = {
      version: '1.0',
      response: {
        shouldEndSession: true,
        directives: [
          {
            type: 'AudioPlayer.ClearQueue',
            clearBehavior: 'CLEAR_ALL'
          }
        ]
      }
    };

    this.context.succeed(response);
  },
  'MultipleSearchResults': function (results) {
    this.attributes['searchResults'] = results.slice(0,3);

    let reprompt = `Pick a number between 1 and ${this.attributes['searchResults'].length}.`;

    let topThreeResponses = buildResponseWithNames(this.attributes['searchResults']);

    let listResponse = `Here is a few matches. ${topThreeResponses}. ${reprompt}`;

    this.emit(':ask', listResponse, reprompt);
  },
  'OutsideRange': function (index) {
    let totalResults = this.attributes.searchResults.length;
    let reprompt = `pick a number between 1 and ${this.attributes.searchResults.length}`;
    let speechOutput = `${index} is outside the range, Please ${reprompt}`;
    this.emit(':ask', speechOutput, reprompt);
  },
  'NotANumber': function () {
    let count = this.attributes.searchResults.length;
    let reprompt = `Try saying a number between 1 and ${count}.`
    let speechOutput = `Sorry, I didn\'t get that. ${reprompt}`
    this.emit(':ask', speechOutput, reprompt);
  },
  'SelectResult': function () {
    let index = this.event.request &&
      this.event.request.intent &&
      this.event.request.intent.slots &&
      this.event.request.intent.slots.ResultIndex
      ? parseInt(this.event.request.intent.slots.ResultIndex.value)
      : 0;

    let max = this.attributes &&
      this.attributes.searchResults &&
      this.attributes.searchResults.length > 0
      ? this.attributes.searchResults.length
      : null;

    if (!max) {
      this.emit('AMAZON.HelpIntent');
      return;
    }

    if (index === NaN) {
      this.emit('NotANumber');
      return;
    }

    if (index > max) {
      this.emit('OutsideRange', index);
      return;
    }

    if (index && index > 0) {
      this.emit('PlayAudio', this.attributes.searchResults[index - 1]);
      return;
    }

    this.emit('NotANumber');
  },
  'PlayAudio': function (audio) {
    // Play audio from url of matching clip
    let audioUrl = audio.url.split('.mp3')[0] + '.mp3';
    let audioHtml = `<audio src='http:${audioUrl}' />`;
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
    };

    this.context.succeed(response);
  },
  'AudioPlayer.PlaybackStarted': function () {
    this.context.succeed(true);
  },
  'AudioPlayer.PlaybackNearlyFinished': function () {
    this.context.succeed(true);
  },
  'AudioPlayer.PlaybackFinished': function () {
    this.context.succeed(true);
  },
  'AudioPlayer.PlaybackStopped': function () {
    let response = {
      version: '1.0',
      response: {
        shouldEndSession: true,
        directives: [
          {
            type: 'AudioPlayer.ClearQueue',
            clearBehavior: 'CLEAR_ENQUEUED'
          }
        ]
      }
    };

    this.context.succeed(response);
  },
  'AudioPlayer.PlaybackFailed': function () {
    let response = {
      version: '1.0',
      response: {
        shouldEndSession: true,
        directives: [
          {
            type: 'AudioPlayer.ClearQueue',
            clearBehavior: 'CLEAR_ENQUEUED'
          }
        ]
      }
    };

    this.context.succeed(response);
  },
  'Unhandled': function () {
    let hasSearchResults = this.attributes.hasOwnProperty('searchResults');

    if (hasSearchResults) {
      let count = this.attributes.searchResults.length;
      this.emit(':ask', `Sorry, please say a number between 1 and ${count}.`);
      return;
    }

    this.emit('AMAZON.HelpIntent');
  }
};