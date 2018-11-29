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
const DepositContract = artifacts.require('DepositContract');

contract('DepositContract', function () {

    beforeEach(async function () {
      this.agreement = await AgreementContract.new(web3.eth.accounts[1], web3.eth.accounts[2], 10, web3.toWei('1', 'ether'), 12, 3, 10);
      this.contract = await DepositContract.new(web3.eth.accounts[1], web3.eth.accounts[2], this.agreement.address);
      await this.contract.sendTransaction({from: web3.eth.accounts[1], value: await this.agreement.securityDeposit()});
    });

    describe('returnSecurityDeposit', function () {
      it('Should revert due period not landlord call', async function () {
        await increaseTimeTo(duration.days(30));
        await this.contract.returnSecurityDeposit({from: web3.eth.accounts[1]}).should.be.rejectedWith("revert");
      });

      it('Should revert due period not expired', async function () {
        await increaseTimeTo(duration.days(30));
        await this.contract.returnSecurityDeposit({from: web3.eth.accounts[2]}).should.be.rejectedWith("revert");
      });

      it('Should pass', async function () {
        await increaseTimeTo(duration.years(1));
        await this.contract.returnSecurityDeposit({from: web3.eth.accounts[2]});
      });
    });

    describe('returnSecurityDeposit', function () {
      it('Start arbitration', async function () {
        
      });

    });
})
