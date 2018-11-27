pragma solidity ^0.4.24;

import "./AgreementContract.sol";

contract PaymentContract {

    using SafeMath for uint256;

    AgreementContract agreement;

    uint public lastPayment;
    uint public lastFinePayment;
    uint public month = 30 days;

    address public tenant;
    address public landlord;

    modifier onlyTenant() { 
        require(msg.sender == tenant); 
        _; 
    }

    modifier onlyLandlord() { 
        require(msg.sender == landlord); 
        _; 
    }

    modifier onlyTenantOrLandlord() { 
        require(msg.sender == tenant || msg.sender == landlord); 
        _; 
    }

    modifier onlyInAgreementPeriod() { 
        require(block.timestamp >= agreement.agreementCreated().add(agreement.period())); 
        _; 
    }

    modifier onlyAfterPeriodExpired() { 
        require (agreement.agreementCreated().add(agreement.period()) < block.timestamp); 
        _; 
    }

    function() payable external {
    }
    
    constructor(address _tenant, address _landlord, address _agreement) {
        tenant = _tenant;
        landlord = _landlord;
        lastPayment = block.timestamp;
        agreement = AgreementContract(_agreement);   
    }

    function payRentForMonth() public payable onlyTenant onlyInAgreementPeriod {
        require(msg.value == agreement.rentPrice());
        require(block.timestamp >= lastPayment.add(month));
        
        if((block.timestamp.sub(lastPayment.add(month).add(1 weeks)).div(1 days) > 0 && lastFinePayment > 0) || block.timestamp.sub(lastFinePayment) > block.timestamp.sub(lastPayment.add(month).add(1 weeks))) {
            revert();
        }

        lastPayment = block.timestamp;
        landlord.transfer(msg.value);
    }

    function payFine() public payable onlyTenant {
        require(msg.value == calculateFine(block.timestamp.sub(lastPayment.add(month).add(1 weeks)).div(1 days)));
        require(msg.value > 0);
        
        landlord.transfer(msg.value);
        lastFinePayment = block.timestamp;
    }

    function calculateFine(uint _latency) internal view returns(uint) {
        return agreement.rentPrice().mul(agreement.finePercent()).div(100).mul(_latency);
    }

    function getMyFine() external view onlyTenant returns(uint) {
        return calculateFine(block.timestamp.sub(lastPayment.add(month).add(1 weeks)).div(1 days));
    }
    
}