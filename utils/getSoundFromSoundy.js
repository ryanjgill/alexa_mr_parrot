/**
 * Get Sound From Soundy API
 * :term - String - search term
 * :cb - Function - callback function 
 */
const request = require('request');

module.exports = (term, cb) => {
  const baseUrl = `https://www.soundy.top/api/sounds`;
  let searchUrl = term ? `${baseUrl}?q=${term}` : baseUrl;

  request(searchUrl, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      cb(null, JSON.parse(body));
    } else if (error) {
      cb(error);
    } else {
      cb({
        type: 'service_down',
        term: term
      });
    }
  });
}

