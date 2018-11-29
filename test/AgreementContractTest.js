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

const AgreementContract = artifacts.require('AgreementContract');

contract('AgreementContract', function () {

    beforeEach(async function () {
      this.contract = await AgreementContract.new(web3.eth.accounts[1], web3.eth.accounts[2], 100, web3.toWei('1', 'ether'), 12, 3, web3.toWei('1', 'ether'));
    });

    describe('signAgreement', function () {
      it('Should fail due to not tenant or landlord call', async function () {
        await this.contract.signAgreement({from: web3.eth.accounts[0]}).should.be.rejectedWith('revert');
      });

      it('Should pass', async function () {
        let tx = await this.contract.signAgreement({from: web3.eth.accounts[1], value: web3.toWei('2', 'ether')});
        let events = tx.logs.filter(l => l.event === 'AgreementSigned');
        let addressBy = events[0].args.by;
        assert.equal(web3.eth.accounts[1], addressBy);
        tx = await this.contract.signAgreement({from: web3.eth.accounts[2]});
        events = tx.logs.filter(l => l.event === 'AgreementSigned');
        addressBy = events[0].args.by;
        assert.equal(web3.eth.accounts[2], addressBy);
      });
    });

    describe('declineAgreement', function () {
      it('Should fail due to not tenant or landlord call', async function () {
        await this.contract.declineAgreement("test", {from: web3.eth.accounts[0]}).should.be.rejectedWith('revert');
      });

      it('Should fail due to already signed', async function () {
        let tx = await this.contract.signAgreement({from: web3.eth.accounts[1], value: web3.toWei('2', 'ether')});
        let events = tx.logs.filter(l => l.event === 'AgreementSigned');
        let addressBy = events[0].args.by;
        assert.equal(web3.eth.accounts[1], addressBy);
        tx = await this.contract.signAgreement({from: web3.eth.accounts[2]});
        events = tx.logs.filter(l => l.event === 'AgreementSigned');
        addressBy = events[0].args.by;
        assert.equal(web3.eth.accounts[2], addressBy);
        await this.contract.declineAgreement("test", {from: web3.eth.accounts[1]}).should.be.rejectedWith('revert');
      });

      it('Should pass', async function () {
        let tx = await this.contract.declineAgreement("test", {from: web3.eth.accounts[1]});
        let events = tx.logs.filter(l => l.event === 'AgreementDeclined');
        let reason = events[0].args.reason;
        assert.equal("test", reason);
      });
    });

    describe('terminateAgreement', function () {
      it('Should fail due to not landlord call', async function () {
        await this.contract.terminateAgreement({from: web3.eth.accounts[0]}).should.be.rejectedWith('revert');
      });

      it('Should fail due to agreement not signed', async function () {
        await this.contract.terminateAgreement({from: web3.eth.accounts[2]}).should.be.rejectedWith('revert');
      });

      it('Should pass', async function () {
        let tx = await this.contract.signAgreement({from: web3.eth.accounts[1], value: web3.toWei('2', 'ether')});
        let events = tx.logs.filter(l => l.event === 'AgreementSigned');
        let addressBy = events[0].args.by;
        assert.equal(web3.eth.accounts[1], addressBy);
        tx = await this.contract.signAgreement({from: web3.eth.accounts[2]});
        events = tx.logs.filter(l => l.event === 'AgreementSigned');
        addressBy = events[0].args.by;
        assert.equal(web3.eth.accounts[2], addressBy);
        await increaseTimeTo(duration.days(50));
        await this.contract.terminateAgreement({from: web3.eth.accounts[2]});
      });
    });

    describe('extendAgreement', function () {
      it('Should fail due to not landlord call', async function () {
        let tx = await this.contract.signAgreement({from: web3.eth.accounts[1], value: web3.toWei('2', 'ether')});
        let events = tx.logs.filter(l => l.event === 'AgreementSigned');
        let addressBy = events[0].args.by;
        assert.equal(web3.eth.accounts[1], addressBy);
        tx = await this.contract.signAgreement({from: web3.eth.accounts[2]});
        events = tx.logs.filter(l => l.event === 'AgreementSigned');
        addressBy = events[0].args.by;
        assert.equal(web3.eth.accounts[2], addressBy);
        await increaseTimeTo(duration.days(12*30+1));
        await this.contract.extendAgreement(web3.toWei('1', 'ether'), 12, {from: web3.eth.accounts[0]}).should.be.rejectedWith('revert');
      });

      it('Should fail due to period not expired', async function () {
        let tx = await this.contract.signAgreement({from: web3.eth.accounts[1], value: web3.toWei('2', 'ether')});
        let events = tx.logs.filter(l => l.event === 'AgreementSigned');
        let addressBy = events[0].args.by;
        assert.equal(web3.eth.accounts[1], addressBy);
        tx = await this.contract.signAgreement({from: web3.eth.accounts[2]});
        events = tx.logs.filter(l => l.event === 'AgreementSigned');
        addressBy = events[0].args.by;
        assert.equal(web3.eth.accounts[2], addressBy);
        await this.contract.extendAgreement(web3.toWei('1', 'ether'), 12, {from: web3.eth.accounts[2]}).should.be.rejectedWith('revert');
      });

      it('Should fail due to not signed agreement', async function () {
        await increaseTimeTo(duration.days(12*30+1));
        await this.contract.extendAgreement(web3.toWei('1', 'ether'), 12, {from: web3.eth.accounts[2]}).should.be.rejectedWith('revert');
      });

      it('Should pass', async function () {
        let tx = await this.contract.signAgreement({from: web3.eth.accounts[1], value: web3.toWei('2', 'ether')});
        let events = tx.logs.filter(l => l.event === 'AgreementSigned');
        let addressBy = events[0].args.by;
        assert.equal(web3.eth.accounts[1], addressBy);
        tx = await this.contract.signAgreement({from: web3.eth.accounts[2]});
        events = tx.logs.filter(l => l.event === 'AgreementSigned');
        addressBy = events[0].args.by;
        assert.equal(web3.eth.accounts[2], addressBy);
        await increaseTimeTo(duration.days(12*30+1));
        await this.contract.extendAgreement(web3.toWei('1', 'ether'), 12, {from: web3.eth.accounts[2]});
      });
    });
})
