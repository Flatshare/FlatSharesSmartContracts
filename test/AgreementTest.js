const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

var chai = require('chai');
var assert = chai.assert;

const AgreementContract = artifacts.require('AgreementContract');

contract('AgreementContract', function () {

    beforeEach(async function () {
      this.contract = await AgreementContract.new(web3.eth.accounts[1], web3.eth.accounts[2], "Test");
    });

    describe('signAgreement', function () {
      it('Should fail due to not tenant or landlord call', async function () {
        await this.contract.signAgreement({from: web3.eth.accounts[0]}).should.be.rejectedWith('revert');
      });

      it('Should pass', async function () {
        let tx = await this.contract.signAgreement({from: web3.eth.accounts[1]});
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

      it('Should pass', async function () {
        let tx = await this.contract.declineAgreement("test", {from: web3.eth.accounts[1]});
        let events = tx.logs.filter(l => l.event === 'AgreementDeclined');
        let reason = events[0].args.reason;
        assert.equal("test", reason);
      });
    });
})
