pragma solidity ^0.4.24;

import "./AgreementContract.sol";

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

contract PaymentContract {

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

    modifier onlyInAgreementPeriod() { 
        require(block.timestamp >= agreement.agreementCreated().add(agreement.period().add(month))); 
        _; 
    }
    
    constructor(address _tenant, address _landlord, address _agreement) {
        tenant = _tenant;
        landlord = _landlord;
        agreement = AgreementContract(_agreement);   
    }

    function payRentForMonth() public payable onlyTenant onlyInAgreementPeriod {
        require(msg.value == agreement.rentPrice());
        require(block.timestamp >= lastPayment.add(month));
        
        if((lastPayment > 0 && block.timestamp.sub(lastPayment.add(month).add(1 weeks)).div(1 days) > 0 && lastFinePayment > 0) || block.timestamp.sub(lastFinePayment) > block.timestamp.sub(lastPayment.add(month).add(1 weeks))) {
            revert();
        }

        landlord.transfer(msg.value);
        lastPayment = block.timestamp;
    }

    function payFine() public payable onlyTenant {
        require(msg.value == calculateFine(block.timestamp.sub(lastPayment.add(month).add(1 weeks)).div(1 days)));
        landlord.transfer(msg.value);
        lastFinePayment = block.timestamp;
    }

    function calculateFine(uint _latency) internal view returns(uint) {
        return agreement.rentPrice().mul(agreement.finePercent()).div(100).mul(_latency);
    }

    function getMyFine() external view onlyTenant returns(uint) {
        return calculateFine(block.timestamp.sub(lastPayment.add(month).add(1 weeks)).div(1 days)));
    }
    
}