pragma solidity ^0.4.24;

import "./AgreementContract.sol";

contract UtilityContract {

    using SafeMath for uint256;

    AgreementContract agreement;
    
    uint public lastRequestUtilityPayment;
    uint public debt;
    uint public month = 30 days;

    address public tenant;
    address public landlord;

    event UtilityDeptRepaid(address _agreement, uint _debt);

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
        require(agreement.agreementCreated().add(agreement.period()) < block.timestamp); 
        _; 
    }

    function() payable external {
    }
    
    constructor(address _tenant, address _landlord, address _agreement) {
        tenant = _tenant;
        landlord = _landlord;
        agreement = AgreementContract(_agreement);   
    }

    function requestUtilityPayment(uint _price) external onlyLandlord {
      require(lastRequestUtilityPayment.add(month) <= block.timestamp);
      require(_price > 0);

      debt = _price;
      lastRequestUtilityPayment = block.timestamp;
    }

    function payUtilityPayment() external payable onlyTenant {
      require(debt > 0);
      require(msg.value == debt);

      landlord.transfer(msg.value);
      emit UtilityDeptRepaid(agreement, debt);
      
      debt = 0;
    }

    function startArbitration(string _reason) external onlyLandlord {
      // to do:
      // create arbitration contract
    }

}