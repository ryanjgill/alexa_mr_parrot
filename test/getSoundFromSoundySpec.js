"use strict";

const getSoundFromSoundy = require('../utils/getSoundFromSoundy')
  , chai = require('chai')
  , chaiHttp = require('chai-http')
  , should = chai.should()
  ,	expect = chai.expect
  , BASE_URL = 'https://www.soundy.top'
  ;

chai.use(chaiHttp);

describe('getSoundFromSoundy', function () {
  it('should get list of sounds from soundy', function(done) {
    chai.request(BASE_URL)
      .get('/api/sounds')
      .end(function(err, res){
        res.should.have.status(200);
        done();
      });
  });
  
  it('should always return a list if no term provided', function(done) {
    chai.request(BASE_URL)
      .get('/api/sounds')
      .end(function(err, res){
        expect(res.body.length).to.be.greaterThan(0);
        done();
      });
  });
});
