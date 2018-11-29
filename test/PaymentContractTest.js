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
const PaymentContract = artifacts.require('PaymentContract');

contract('PaymentContract', function () {

    beforeEach(async function () {
      this.agreement = await AgreementContract.new(web3.eth.accounts[1], web3.eth.accounts[2], 10, web3.toWei('1', 'ether'), 12, 3, 10);
      this.contract = await PaymentContract.new(web3.eth.accounts[1], web3.eth.accounts[2], this.agreement.address);
    });

    describe('payRentForMonth', function () {
      it('Should revert due to not tenant call', async function () {
        await increaseTimeTo(duration.days(30));
        await this.contract.payRentForMonth({from: web3.eth.accounts[0], value: await this.agreement.rentPrice()}).should.be.rejectedWith("revert");
      });

      it('Should revert due to fine', async function () {
        await increaseTimeTo(duration.days(50));
        await this.contract.payRentForMonth({from: web3.eth.accounts[1], value: await this.agreement.rentPrice()}).should.be.rejectedWith("revert");
      });

      it('Should pass after fine payed', async function () {
        await increaseTimeTo(duration.days(50));
        await this.contract.payRentForMonth({from: web3.eth.accounts[1], value: await this.agreement.rentPrice()}).should.be.rejectedWith("revert");
        await this.contract.payFine({from: web3.eth.accounts[1], value: await this.contract.getMyFine({from: web3.eth.accounts[1]})});
        await this.contract.payRentForMonth({from: web3.eth.accounts[1], value: await this.agreement.rentPrice()});
      });

      it('Should pass', async function () {
        await increaseTimeTo(duration.days(30));
        await this.contract.payRentForMonth({from: web3.eth.accounts[1], value: await this.agreement.rentPrice()});
      });
    });

    describe('payFine', function () {
      it('Should revert due to no fine', async function () {
        await increaseTimeTo(duration.days(30));
        await this.contract.payFine({from: web3.eth.accounts[1], value: await this.contract.getMyFine({from: web3.eth.accounts[1]})}).should.be.rejectedWith("revert");
      });

      it('Should pass', async function () {
        await increaseTimeTo(duration.days(50));
        await this.contract.payRentForMonth({from: web3.eth.accounts[1], value: await this.agreement.rentPrice()}).should.be.rejectedWith("revert");
        await this.contract.payFine({from: web3.eth.accounts[1], value: await this.contract.getMyFine({from: web3.eth.accounts[1]})});
      });
    });

    describe('getMyFine', function () {
      it('Should pass', async function () {
        await increaseTimeTo(duration.days(35));
        assert.equal(await this.contract.getMyFine({from: web3.eth.accounts[1]}) == 0, true);
      });

      it('Should pass', async function () {
        await increaseTimeTo(duration.days(50));
        assert.equal(await this.contract.getMyFine({from: web3.eth.accounts[1]}) > 0, true);
      });
    });
})
