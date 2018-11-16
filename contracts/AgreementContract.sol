pragma solidity ^0.4.24;

import "./PaymentContract.sol";
import "./DepositContract.sol";


/**
 * @title SafeMath
 * @dev Math operations with safety checks that revert on error
 */
library SafeMath {

  /**
  * @dev Multiplies two numbers, reverts on overflow.
  */
  function mul(uint256 a, uint256 b) internal pure returns (uint256) {
    // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
    // benefit is lost if 'b' is also tested.
    // See: https://github.com/OpenZeppelin/openzeppelin-solidity/pull/522
    if (a == 0) {
      return 0;
    }

    uint256 c = a * b;
    require(c / a == b);

    return c;
  }

  /**
  * @dev Integer division of two numbers truncating the quotient, reverts on division by zero.
  */
  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    require(b > 0); // Solidity only automatically asserts when dividing by 0
    uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold

    return c;
  }

  /**
  * @dev Subtracts two numbers, reverts on overflow (i.e. if subtrahend is greater than minuend).
  */
  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    require(b <= a);
    uint256 c = a - b;

    return c;
  }

  /**
  * @dev Adds two numbers, reverts on overflow.
  */
  function add(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a + b;
    require(c >= a);

    return c;
  }

  /**
  * @dev Divides two numbers and returns the remainder (unsigned integer modulo),
  * reverts when dividing by zero.
  */
  function mod(uint256 a, uint256 b) internal pure returns (uint256) {
    require(b != 0);
    return a % b;
  }
}

contract AgreementContract {
    enum AgreementStatus { New, Signed, Declined }
    AgreementStatus status;

    string public agreementDetails;
    string public declineReason;

    address public tenant;
    address public landlord;

    uint public rentPrice;
    uint public area;
    uint public period;
    uint public agreementCreated;
    uint public finePercent;
    uint public securityDeposit;
    uint public month = 30 days;

    bool signedByTenant;
    bool signedByLandlord;

    event AgreementSigned(address by);
    event AgreementDeclined(address by, string reason);

    modifier onlyTenantOrLandlord() { 
        require(msg.sender == tenant || msg.sender == landlord); 
        _; 
    }

    modifier onlyLandlord() { 
        require(msg.sender == landlord); 
        _; 
    }

    modifier onlyAfterPeriodExpired() { 
        require (agreementCreated.add(period) <= block.timestamp); 
        _; 
    }

    modifier onlyNew() { 
        require(status == AgreementStatus.New); 
        _; 
    }
    
    constructor(address _tenant, address _landlord, uint _area, uint _rentPrice, uint _period, uint _finePercent, uint _securityDeposit) {
        tenant = _tenant;
        landlord = _landlord;
        area = _area;
        rentPrice = _rentPrice;
        period = _period.mul(month);
        finePercent = _finePercent;
        securityDeposit = _securityDeposit;
        agreementCreated = block.timestamp;
        status = AgreementStatus.New;
    }

    function signAgreement() public payable onlyTenantOrLandlord onlyNew {
        if(msg.sender == tenant){
            require(signedByTenant == false);
            require (msg.value >= securityDeposit.add(rentPrice));
            signedByTenant = true;
            emit AgreementSigned(msg.sender);
            if(signedByLandlord == true){
                status = AgreementStatus.Signed;
                PaymentContract payment = new PaymentContract(tenant, landlord, address(this));
                DepositContract escrow = new DepositContract(tenant, landlord, address(this));
                address(payment).transfer(rentPrice);
                address(escrow).transfer(securityDeposit);
            }
        } else {
            require(signedByLandlord == false);
            signedByLandlord = true;
            emit AgreementSigned(msg.sender);
            if(signedByTenant == true){
                status = AgreementStatus.Signed;
                PaymentContract payment = new PaymentContract(tenant, landlord, address(this));
                DepositContract escrow = new DepositContract(tenant, landlord, address(this));
                address(payment).transfer(rentPrice);
                address(escrow).transfer(securityDeposit);
            }
        }
    }

    function declineAgreement(string _reason) public onlyTenantOrLandlord onlyNew {
        require (status!=AgreementStatus.Declined);
        
        declineReason = _reason;
        status = AgreementStatus.Declined;
        emit AgreementDeclined(msg.sender, _reason);
    }

    function extendAgreement(uint _newRentPrice, uint _newPeriod) public onlyAfterPeriodExpired onlyLandlord {
        require(_newRentPrice > 0);
        require(_newPeriod > 0);

        agreementCreated = block.timestamp;
        
        signedByLandlord = false;
        signedByTenant = false;

        rentPrice = _newRentPrice;
        period = _newPeriod;

        status = AgreementStatus.New;
    } 
}