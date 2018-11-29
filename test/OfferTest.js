var increaseTimeTo = require('./helpers/increaseTime');
var latestTime = require('./helpers/latestTime');
var advanceBlock = require('./helpers/advanceToBlock');
const BigNumber = web3.BigNumber;

const duration = {
  seconds: function (val) { return val; },
  minutes: function (val) { return val * this.seconds(60); },
  hours: function (val) { return val * this.minutes(60); },
  days: function (val) { return val * this.hours(24); },
  weeks: function (val) { return val * this.days(7); },
  years: function (val) { return val * this.days(365); },
};

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

var chai = require('chai');
var assert = chai.assert;

const OfferContract = artifacts.require('OfferContract');

contract('OfferContract', function () {

    beforeEach(async function () {
      this.contract = await OfferContract.new(web3.toWei('1', 'ether'), 100, 12, 7, 3, web3.toWei('1', 'ether'));
    });

    describe('acceptOffer', function () {
      it('Should fail due to not in active duration', async function () {
        await increaseTimeTo(duration.days(10));
        await this.contract.acceptOffer({from: web3.eth.accounts[5]}).should.be.rejectedWith('revert');
      });

      it('Should pass', async function () {
        let tx = await this.contract.acceptOffer({from: web3.eth.accounts[5]});
        let events = tx.logs.filter(l => l.event === 'AgreementCreated');
        let tenantAccount = events[0].args.tenant;
        assert.equal(web3.eth.accounts[5], tenantAccount);
      });
    });

    describe('priceChangeRequest', function () {
      it('Should fail due to not in active duration', async function () {
        await increaseTimeTo(duration.days(10));
        await this.contract.priceChangeRequest(2, {from: web3.eth.accounts[3]}).should.be.rejectedWith('revert');
      });

      it('Should pass', async function () {
        let tx = await this.contract.priceChangeRequest(2, {from: web3.eth.accounts[3]});
        let events = tx.logs.filter(l => l.event === 'OfferPriceChangeRequested');
        let newRentPrice = events[0].args.newRentPrice;
        assert.equal(2, newRentPrice);
      });
    });

    describe('periodChangeRequest', function () {
      it('Should fail due to not in active duration', async function () {
        await increaseTimeTo(duration.days(10));
        await this.contract.periodChangeRequest(5, {from: web3.eth.accounts[3]}).should.be.rejectedWith('revert');
      });

      it('Should pass', async function () {
        let tx = await this.contract.periodChangeRequest(5, {from: web3.eth.accounts[3]});
        let events = tx.logs.filter(l => l.event === 'OfferPeriodChangeRequested');
        let newPeriod = events[0].args.newPeriod;
        assert.equal(5, newPeriod);
      });
    });

    describe('acceptPriceChangeRequestFrom', function () {
      it('Should fail due to not owner', async function () {
        let tx = await this.contract.priceChangeRequest(50000000, {from: web3.eth.accounts[3]});
        let events = tx.logs.filter(l => l.event === 'OfferPriceChangeRequested');
        let newRentPrice = events[0].args.newRentPrice;
        assert.equal(50000000, newRentPrice);
        await this.contract.acceptPriceChangeRequestFrom(web3.eth.accounts[3],{from: web3.eth.accounts[4]}).should.be.rejectedWith('revert');
      });

      it('Should fail due to new proposed RentPrice = 0', async function () {
        await this.contract.acceptPriceChangeRequestFrom(web3.eth.accounts[3]).should.be.rejectedWith('revert');
      });

      it('Should pass', async function () {
        let tx = await this.contract.priceChangeRequest(2, {from: web3.eth.accounts[3]});
        let events = tx.logs.filter(l => l.event === 'OfferPriceChangeRequested');
        let newRentPrice = events[0].args.newRentPrice;
        assert.equal(2, newRentPrice);
        tx = await this.contract.acceptPriceChangeRequestFrom(web3.eth.accounts[3]);
        events = tx.logs.filter(l => l.event === 'PriceChangeRequestAccepted');
        sender = events[0].args.from;
        assert.equal(web3.eth.accounts[3], sender);
      });
    });

    describe('acceptPeriodChangeRequestFrom', function () {
      it('Should fail due to not owner', async function () {
        await this.contract.periodChangeRequest(10, {from: web3.eth.accounts[3]});
        await this.contract.acceptPeriodChangeRequestFrom(web3.eth.accounts[3], {from: web3.eth.accounts[4]}).should.be.rejectedWith('revert');
      });

      it('Should fail due to new proposed RentPrice = 0', async function () {
        await this.contract.acceptPeriodChangeRequestFrom(web3.eth.accounts[3]).should.be.rejectedWith('revert');
      });

      it('Should pass', async function () {
        await this.contract.periodChangeRequest(10, {from: web3.eth.accounts[3]});
        let tx = await this.contract.acceptPeriodChangeRequestFrom(web3.eth.accounts[3]);
        let events = tx.logs.filter(l => l.event === 'PeriodChangeRequestAccepted');
        let sender = events[0].args.from;
        assert.equal(web3.eth.accounts[3], sender);
      });
    });
})
