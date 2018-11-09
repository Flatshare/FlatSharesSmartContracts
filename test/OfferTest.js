const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

var chai = require('chai');
var assert = chai.assert;

const OfferContract = artifacts.require('OfferContract');

contract('OfferContract', function () {

    beforeEach(async function () {
      this.contract = await OfferContract.new(1, 100);
    });

    describe('transferOwnership', function () {
      it('Should fail due to not owner call', async function () {
        await this.contract.transferOwnership(web3.eth.accounts[2], {from: web3.eth.accounts[1]}).should.be.rejectedWith('revert');
      });

      it('Should pass', async function () {
        let tx = await this.contract.transferOwnership(web3.eth.accounts[2]);
        let events = tx.logs.filter(l => l.event === 'OwnershipTransfered');
        let newOwner = events[0].args._to;
        assert.equal(web3.eth.accounts[2], newOwner);
      });
    });

    describe('acceptOffer', function () {
      it('Should pass', async function () {
        let tx = await this.contract.acceptOffer("test", {from: web3.eth.accounts[5]});
        let events = tx.logs.filter(l => l.event === 'AgreementCreated');
        let tenantAccount = events[0].args.tenant;
        assert.equal(web3.eth.accounts[5], tenantAccount);
      });
    });

    describe('changeRequest', function () {
      it('Should pass', async function () {
        let tx = await this.contract.changeRequest(2, {from: web3.eth.accounts[3]});
        let events = tx.logs.filter(l => l.event === 'OfferChangesRequested');
        let newRentPrice = events[0].args._newRentPrice;
        assert.equal(2, newRentPrice);
      });
    });

    describe('acceptChangeRequest', function () {
      it('Should fail due to not owner', async function () {
        await this.contract.changeRequest(2, {from: web3.eth.accounts[3]});
        await this.contract.acceptChangeRequest({from: web3.eth.accounts[4]}).should.be.rejectedWith('revert');
      });

      it('Should fail due to new proposed RentPrice = 0', async function () {
        await this.contract.acceptChangeRequest().should.be.rejectedWith('revert');
      });

      it('Should pass', async function () {
        await this.contract.changeRequest(2, {from: web3.eth.accounts[3]});
        let tx = await this.contract.acceptChangeRequest();
        let events = tx.logs.filter(l => l.event === 'ChangeRequestAccepted');
        let sender = events[0].args._by;
        assert.equal(web3.eth.accounts[0], sender);
      });
    });
})
