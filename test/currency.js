'use strict';

var should = require('should');
var sinon = require('sinon');
var proxyquire = require('proxyquire');
var CurrencyController = require('../lib/currency');

describe('Currency', function() {

  var dashCentralData = {
    general: {
      consensus_blockheight: 561311,
      consensus_version: 120058,
      consensus_protocolversion: 70103,
      all_user: 687,
      active_user: 372,
      registered_masternodes: 1583,
      registered_masternodes_verified: 770
    },
    exchange_rates: {
      dash_usd: 9.4858840414,
      btc_usd: 682.93,
      btc_dash: 0.01388998
    }
  };

  it.skip('will make live request to ulord central', function(done) {
    var currency = new CurrencyController({});
    var req = {};
    var res = {
      jsonp: function(response) {
        response.status.should.equal(200);
        should.exist(response.data.dash_usd);
        (typeof response.data.dash_usd).should.equal('number');
        done();
      }
    };
    currency.index(req, res);
  });

  it('will retrieve a fresh value', function(done) {
    var TestCurrencyController = proxyquire('../lib/currency', {
      request: sinon.stub().callsArgWith(1, null, {statusCode: 200}, JSON.stringify(dashCentralData))
    });
    var node = {
      log: {
        error: sinon.stub()
      }
    };
    var currency = new TestCurrencyController({node: node});
    currency.exchange_rates = {
      dash_usd: 9.4858840414,
      btc_usd: 682.93,
      btc_dash: 0.01388998
    };
    currency.timestamp = Date.now() - 61000 * CurrencyController.DEFAULT_CURRENCY_DELAY;
    var req = {};
    var res = {
      jsonp: function(response) {
        response.status.should.equal(200);
        should.exist(response.data.dash_usd);
        response.data.dash_usd.should.equal(9.4858840414);
        done();
      }
    };
    currency.index(req, res);
  });

  it('will log an error from request', function(done) {
    var TestCurrencyController = proxyquire('../lib/currency', {
      request: sinon.stub().callsArgWith(1, new Error('test'))
    });
    var node = {
      log: {
        error: sinon.stub()
      }
    };
    var currency = new TestCurrencyController({node: node});
    currency.exchange_rates = {
      dash_usd: 9.4858840414,
      btc_usd: 682.93,
      btc_dash: 0.01388998
    };
    currency.timestamp = Date.now() - 65000 * CurrencyController.DEFAULT_CURRENCY_DELAY;
    var req = {};
    var res = {
      jsonp: function(response) {
        response.status.should.equal(200);
        should.exist(response.data);
        response.data.dash_usd.should.equal(9.4858840414);
        node.log.error.callCount.should.equal(1);
        done();
      }
    };
    currency.index(req, res);
  });

  it('will retrieve a cached value', function(done) {
    var request = sinon.stub();
    var TestCurrencyController = proxyquire('../lib/currency', {
      request: request
    });
    var node = {
      log: {
        error: sinon.stub()
      }
    };
    var currency = new TestCurrencyController({node: node});
    currency.exchange_rates = {
      dash_usd: 9.4858840414,
      btc_usd: 682.93,
      btc_dash: 0.01388998
    };
    currency.timestamp = Date.now();
    var req = {};
    var res = {
      jsonp: function(response) {
        response.status.should.equal(200);
        should.exist(response.data.dash_usd);
        response.data.dash_usd.should.equal(9.4858840414);
        request.callCount.should.equal(0);
        done();
      }
    };
    currency.index(req, res);
  });

});
