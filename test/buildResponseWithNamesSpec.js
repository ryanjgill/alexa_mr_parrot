"use strict";

const buildResonseWithNames = require('../utils/buildResponseWithNames')
  , chai = require('chai')
  ,	expect = chai.expect
  ;

describe('buildResponseWithNames', function () {
  it(`should return numbered list with names`, function() {
    let testItems = [
      {
        name: 'Ryan',
        age: 30
      }, {
        name: 'Sarah',
        age: 32
      }, {
        name: 'Jim',
        age: 34
      }
    ],
    expectedOutput = `1: Ryan, 2: Sarah, 3: Jim`;

    expect(buildResonseWithNames(testItems)).to.equal(expectedOutput);
  });
});