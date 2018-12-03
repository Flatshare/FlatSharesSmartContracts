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
const ArbitrationContract = artifacts.require('ArbitrationContract');

contract('ArbitrationContract', function () {

    beforeEach(async function () {
      this.agreement = await AgreementContract.new(web3.eth.accounts[1], web3.eth.accounts[2], 10, web3.toWei('1', 'ether'), 12, 3, 10);
      this.contract = await ArbitrationContract.new(web3.eth.accounts[1], web3.eth.accounts[2], web3.eth.accounts[1], this.agreement.address);
    });

    describe('addToArbitratorWhitelist', function () {
      it('Should revert due to time missed', async function () {
        await increaseTimeTo(duration.days(2));
        await this.contract.addToArbitratorWhitelist([web3.eth.accounts[3], web3.eth.accounts[4], web3.eth.accounts[5], web3.eth.accounts[6], web3.eth.accounts[7]]).should.be.rejectedWith("revert");
      });

      it('Should revert due to not owner call', async function () {
        await this.contract.addToArbitratorWhitelist([web3.eth.accounts[3], web3.eth.accounts[4], web3.eth.accounts[5], web3.eth.accounts[6], web3.eth.accounts[7]], {from: web3.eth.accounts[1]}).should.be.rejectedWith("revert");
      });

      it('Should revert due to not enough arbitrators', async function () {
        await this.contract.addToArbitratorWhitelist([web3.eth.accounts[3], web3.eth.accounts[4], web3.eth.accounts[5], web3.eth.accounts[6]]).should.be.rejectedWith("revert");
      });

      it('Should pass', async function () {
        await this.contract.addToArbitratorWhitelist([web3.eth.accounts[3], web3.eth.accounts[4], web3.eth.accounts[5], web3.eth.accounts[6], web3.eth.accounts[7]]);
      });
    });

    describe('becomeArbitrator', function () {
      it('Should revert due to not arbitrator call', async function () {
        await this.contract.addToArbitratorWhitelist([web3.eth.accounts[3], web3.eth.accounts[4], web3.eth.accounts[5], web3.eth.accounts[6], web3.eth.accounts[7]]);
        await this.contract.becomeArbitrator({from: web3.eth.accounts[8], value: 100}).should.be.rejectedWith('revert');
      });

      it('Should revert due to time missed', async function () {
        await this.contract.addToArbitratorWhitelist([web3.eth.accounts[3], web3.eth.accounts[4], web3.eth.accounts[5], web3.eth.accounts[6], web3.eth.accounts[7]]);
        await increaseTimeTo(duration.days(1));
        await this.contract.becomeArbitrator({from: web3.eth.accounts[3], value: 100}).should.be.rejectedWith('revert');
      });

      it('Should revert due to msg.value = 0', async function () {
        await this.contract.addToArbitratorWhitelist([web3.eth.accounts[3], web3.eth.accounts[4], web3.eth.accounts[5], web3.eth.accounts[6], web3.eth.accounts[7]]);
        await this.contract.becomeArbitrator({from: web3.eth.accounts[3]}).should.be.rejectedWith('revert');
      });

      it('Should pass', async function () {
        await this.contract.addToArbitratorWhitelist([web3.eth.accounts[3], web3.eth.accounts[4], web3.eth.accounts[5], web3.eth.accounts[6], web3.eth.accounts[7]]);
        await this.contract.becomeArbitrator({from: web3.eth.accounts[3], value: 100});
      });
    });

    describe('vote', function () {
      it('Should revert due to not arbitrator call', async function () {
        await this.contract.addToArbitratorWhitelist([web3.eth.accounts[3], web3.eth.accounts[4], web3.eth.accounts[5], web3.eth.accounts[6], web3.eth.accounts[7]]);
        await this.contract.becomeArbitrator({from: web3.eth.accounts[3], value: 100});
        await this.contract.vote(true, "Test", {from: web3.eth.accounts[8]}).should.be.rejectedWith('revert');
      });

      it('Should revert due to time missed', async function () {
        await this.contract.addToArbitratorWhitelist([web3.eth.accounts[3], web3.eth.accounts[4], web3.eth.accounts[5], web3.eth.accounts[6], web3.eth.accounts[7]]);
        await this.contract.becomeArbitrator({from: web3.eth.accounts[3], value: 100});
        await increaseTimeTo(duration.days(3));
        await this.contract.vote(true, "Test", {from: web3.eth.accounts[3]}).should.be.rejectedWith('revert');
      });

      it('Should revert due to staked amount of arbitrator = 0', async function () {
        await this.contract.addToArbitratorWhitelist([web3.eth.accounts[3], web3.eth.accounts[4], web3.eth.accounts[5], web3.eth.accounts[6], web3.eth.accounts[7]]);
        await this.contract.vote(true, "Test", {from: web3.eth.accounts[3]}).should.be.rejectedWith('revert');
      });

      it('Should revert due to double voting', async function () {
        await this.contract.addToArbitratorWhitelist([web3.eth.accounts[3], web3.eth.accounts[4], web3.eth.accounts[5], web3.eth.accounts[6], web3.eth.accounts[7]]);
        await this.contract.becomeArbitrator({from: web3.eth.accounts[3], value: 100});
        await this.contract.vote(true, "Test", {from: web3.eth.accounts[3]});
        await this.contract.vote(true, "Test", {from: web3.eth.accounts[3]}).should.be.rejectedWith('revert');
      });

      it('Should pass', async function () {
        await this.contract.addToArbitratorWhitelist([web3.eth.accounts[3], web3.eth.accounts[4], web3.eth.accounts[5], web3.eth.accounts[6], web3.eth.accounts[7]]);
        await this.contract.becomeArbitrator({from: web3.eth.accounts[3], value: 100});
        await this.contract.vote(true, "Test", {from: web3.eth.accounts[3]});
      });
    });

    describe('getVotesResult', function () {
      it('Should fail due to not enough votes', async function () {
        await this.contract.addToArbitratorWhitelist([web3.eth.accounts[3], web3.eth.accounts[4], web3.eth.accounts[5], web3.eth.accounts[6], web3.eth.accounts[7]]);
        await this.contract.becomeArbitrator({from: web3.eth.accounts[3], value: 100});
        await this.contract.vote(true, "Test", {from: web3.eth.accounts[3]});
        await this.contract.getVotesResult().should.be.rejectedWith('revert');
      });

      it('Should pass with 5 true', async function () {
        await this.contract.addToArbitratorWhitelist([web3.eth.accounts[3], web3.eth.accounts[4], web3.eth.accounts[5], web3.eth.accounts[6], web3.eth.accounts[7]]);
        await this.contract.becomeArbitrator({from: web3.eth.accounts[3], value: 100});
        await this.contract.becomeArbitrator({from: web3.eth.accounts[4], value: 100});
        await this.contract.becomeArbitrator({from: web3.eth.accounts[5], value: 100});
        await this.contract.becomeArbitrator({from: web3.eth.accounts[6], value: 100});
        await this.contract.becomeArbitrator({from: web3.eth.accounts[7], value: 100});
        await this.contract.vote(true, "Test", {from: web3.eth.accounts[3]});
        await this.contract.vote(true, "Test", {from: web3.eth.accounts[4]});
        await this.contract.vote(true, "Test", {from: web3.eth.accounts[5]});
        await this.contract.vote(true, "Test", {from: web3.eth.accounts[6]});
        await this.contract.vote(true, "Test", {from: web3.eth.accounts[7]});
        let tx = await this.contract.getVotesResult();
        let events = tx.logs.filter(l => l.event === 'VotesResult');
        let result = events[0].args.result;
        assert.equal(result, true);
      });

      it('Should pass with 4 true 1 false', async function () {
        await this.contract.addToArbitratorWhitelist([web3.eth.accounts[3], web3.eth.accounts[4], web3.eth.accounts[5], web3.eth.accounts[6], web3.eth.accounts[7]]);
        await this.contract.becomeArbitrator({from: web3.eth.accounts[3], value: 100});
        await this.contract.becomeArbitrator({from: web3.eth.accounts[4], value: 100});
        await this.contract.becomeArbitrator({from: web3.eth.accounts[5], value: 100});
        await this.contract.becomeArbitrator({from: web3.eth.accounts[6], value: 100});
        await this.contract.becomeArbitrator({from: web3.eth.accounts[7], value: 100});
        await this.contract.vote(true, "Test", {from: web3.eth.accounts[3]});
        await this.contract.vote(true, "Test", {from: web3.eth.accounts[4]});
        await this.contract.vote(true, "Test", {from: web3.eth.accounts[5]});
        await this.contract.vote(true, "Test", {from: web3.eth.accounts[6]});
        await this.contract.vote(false, "Test", {from: web3.eth.accounts[7]});
        let tx = await this.contract.getVotesResult();
        let events = tx.logs.filter(l => l.event === 'VotesResult');
        let result = events[0].args.result;
        assert.equal(result, true);
      });

      it('Should pass with 3 true 2 false', async function () {
        await this.contract.addToArbitratorWhitelist([web3.eth.accounts[3], web3.eth.accounts[4], web3.eth.accounts[5], web3.eth.accounts[6], web3.eth.accounts[7]]);
        await this.contract.becomeArbitrator({from: web3.eth.accounts[3], value: 100});
        await this.contract.becomeArbitrator({from: web3.eth.accounts[4], value: 100});
        await this.contract.becomeArbitrator({from: web3.eth.accounts[5], value: 100});
        await this.contract.becomeArbitrator({from: web3.eth.accounts[6], value: 100});
        await this.contract.becomeArbitrator({from: web3.eth.accounts[7], value: 100});
        await this.contract.vote(true, "Test", {from: web3.eth.accounts[3]});
        await this.contract.vote(true, "Test", {from: web3.eth.accounts[4]});
        await this.contract.vote(true, "Test", {from: web3.eth.accounts[5]});
        await this.contract.vote(false, "Test", {from: web3.eth.accounts[6]});
        await this.contract.vote(false, "Test", {from: web3.eth.accounts[7]});
        let tx = await this.contract.getVotesResult();
        let events = tx.logs.filter(l => l.event === 'VotesResult');
        let result = events[0].args.result;
        assert.equal(result, true);
      });

      it('Should pass with 2 true 3 false', async function () {
        await this.contract.addToArbitratorWhitelist([web3.eth.accounts[3], web3.eth.accounts[4], web3.eth.accounts[5], web3.eth.accounts[6], web3.eth.accounts[7]]);
        await this.contract.becomeArbitrator({from: web3.eth.accounts[3], value: 100});
        await this.contract.becomeArbitrator({from: web3.eth.accounts[4], value: 100});
        await this.contract.becomeArbitrator({from: web3.eth.accounts[5], value: 100});
        await this.contract.becomeArbitrator({from: web3.eth.accounts[6], value: 100});
        await this.contract.becomeArbitrator({from: web3.eth.accounts[7], value: 100});
        await this.contract.vote(true, "Test", {from: web3.eth.accounts[3]});
        await this.contract.vote(true, "Test", {from: web3.eth.accounts[4]});
        await this.contract.vote(false, "Test", {from: web3.eth.accounts[5]});
        await this.contract.vote(false, "Test", {from: web3.eth.accounts[6]});
        await this.contract.vote(false, "Test", {from: web3.eth.accounts[7]});
        let tx = await this.contract.getVotesResult();
        let events = tx.logs.filter(l => l.event === 'VotesResult');
        let result = events[0].args.result;
        assert.equal(result, false);
      });

      it('Should pass with 1 true 4 false', async function () {
        await this.contract.addToArbitratorWhitelist([web3.eth.accounts[3], web3.eth.accounts[4], web3.eth.accounts[5], web3.eth.accounts[6], web3.eth.accounts[7]]);
        await this.contract.becomeArbitrator({from: web3.eth.accounts[3], value: 100});
        await this.contract.becomeArbitrator({from: web3.eth.accounts[4], value: 100});
        await this.contract.becomeArbitrator({from: web3.eth.accounts[5], value: 100});
        await this.contract.becomeArbitrator({from: web3.eth.accounts[6], value: 100});
        await this.contract.becomeArbitrator({from: web3.eth.accounts[7], value: 100});
        await this.contract.vote(true, "Test", {from: web3.eth.accounts[3]});
        await this.contract.vote(false, "Test", {from: web3.eth.accounts[4]});
        await this.contract.vote(false, "Test", {from: web3.eth.accounts[5]});
        await this.contract.vote(false, "Test", {from: web3.eth.accounts[6]});
        await this.contract.vote(false, "Test", {from: web3.eth.accounts[7]});
        let tx = await this.contract.getVotesResult();
        let events = tx.logs.filter(l => l.event === 'VotesResult');
        let result = events[0].args.result;
        assert.equal(result, false);
      });

      it('Should pass with 5 false', async function () {
        await this.contract.addToArbitratorWhitelist([web3.eth.accounts[3], web3.eth.accounts[4], web3.eth.accounts[5], web3.eth.accounts[6], web3.eth.accounts[7]]);
        await this.contract.becomeArbitrator({from: web3.eth.accounts[3], value: 100});
        await this.contract.becomeArbitrator({from: web3.eth.accounts[4], value: 100});
        await this.contract.becomeArbitrator({from: web3.eth.accounts[5], value: 100});
        await this.contract.becomeArbitrator({from: web3.eth.accounts[6], value: 100});
        await this.contract.becomeArbitrator({from: web3.eth.accounts[7], value: 100});
        await this.contract.vote(false, "Test", {from: web3.eth.accounts[3]});
        await this.contract.vote(false, "Test", {from: web3.eth.accounts[4]});
        await this.contract.vote(false, "Test", {from: web3.eth.accounts[5]});
        await this.contract.vote(false, "Test", {from: web3.eth.accounts[6]});
        await this.contract.vote(false, "Test", {from: web3.eth.accounts[7]});
        let tx = await this.contract.getVotesResult();
        let events = tx.logs.filter(l => l.event === 'VotesResult');
        let result = events[0].args.result;
        assert.equal(result, false);
      });
    });
})
