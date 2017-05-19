"use strict";

const scrubName = require('../utils/scrubName.js')
  , chai = require('chai')
  ,	expect = chai.expect
  ;

describe('scrubName', function () {
  it(`should return name without special characters slammed together and lower cased`, function() {
    let name = `I'm Mr. MeeSeeks, look at me.`,
    expectedOutput = `immrmeeseekslookatme`;

    expect(scrubName(name)).to.equal(expectedOutput);
  });
});