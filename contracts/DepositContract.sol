pragma solidity ^0.4.24;

import "./AgreementContract.sol";

contract DepositContract {

    using SafeMath for uint256;

    AgreementContract agreement;

    address public tenant;
    address public landlord;

    modifier onlyLandlord() { 
        require(msg.sender == landlord); 
        _; 
    }

    modifier onlyTenantOrLandlord() { 
        require(msg.sender == tenant || msg.sender == landlord); 
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
        agreement = AgreementContract(_agreement);   
    }

    function returnSecurityDeposit() external onlyLandlord onlyAfterPeriodExpired {
      tenant.transfer(agreement.securityDeposit());
    }

    function startArbitration(string _reason) external onlyTenantOrLandlord {
      // to do:
      // create arbitration contract
    }
    
}