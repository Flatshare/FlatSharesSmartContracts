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
const UtilityContract = artifacts.require('UtilityContract');

contract('UtilityContract', function () {

    beforeEach(async function () {
      this.agreement = await AgreementContract.new(web3.eth.accounts[1], web3.eth.accounts[2], 10, web3.toWei('1', 'ether'), 12, 3, 10);
      this.contract = await UtilityContract.new(web3.eth.accounts[1], web3.eth.accounts[2], this.agreement.address);
    });

    describe('requestUtilityPayment', function () {
      it('Should revert due to not landlord call', async function () {
        await this.contract.requestUtilityPayment(1000000, {from: web3.eth.accounts[1]}).should.be.rejectedWith("revert");
      });

      it('Should revert due to zero price', async function () {
        await this.contract.requestUtilityPayment(0, {from: web3.eth.accounts[2]}).should.be.rejectedWith("revert");
      });

      it('Should revert due to utility already requested in this month', async function () {
        await this.contract.requestUtilityPayment(1000000, {from: web3.eth.accounts[2]});
        await this.contract.payUtilityPayment({from: web3.eth.accounts[1], value: await this.contract.debt()});
        await this.contract.requestUtilityPayment(1000000, {from: web3.eth.accounts[2]}).should.be.rejectedWith("revert");
      });

      it('Should pass', async function () {
        await this.contract.requestUtilityPayment(1000000, {from: web3.eth.accounts[2]});
      });
    });

    describe('payUtilityPayment', function () {
      it('Should revert due to not tenant call', async function () {
        await this.contract.requestUtilityPayment(1000000, {from: web3.eth.accounts[2]});
        await this.contract.payUtilityPayment({from: web3.eth.accounts[2], value: await this.contract.debt()}).should.be.rejectedWith("revert");
      });

      it('Should revert due to not enough vlue', async function () {
        await this.contract.requestUtilityPayment(1000000, {from: web3.eth.accounts[2]});
        await this.contract.payUtilityPayment({from: web3.eth.accounts[2], value: await this.contract.debt()-10}).should.be.rejectedWith("revert");
      });

      it('Should pass', async function () {
        await this.contract.requestUtilityPayment(1000000, {from: web3.eth.accounts[2]});
        let tx = await this.contract.payUtilityPayment({from: web3.eth.accounts[1], value: await this.contract.debt()});
        let events = tx.logs.filter(l => l.event === 'UtilityDeptRepaid');
        let debt = events[0].args._debt;
        assert.equal(1000000, debt);
      });
    });
})
