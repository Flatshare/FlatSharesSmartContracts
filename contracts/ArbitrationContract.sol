pragma solidity ^0.4.24;

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

contract ArbitrationContract {
    
    uint public arbitratorsNum = 5;
    uint public penaltyFee;
    uint public arbitrationFee;
    uint public votesAmount;
    uint[] public arbitrators;

    mapping(address => uint) stakedAmount;
    mapping(address => uint) arbitratorsRate;
    mapping(address => bool) isArbitrator;
    mapping(address => bool) votes;
    
    
    modifier onlyNotNegativeRate() { 
      require (arbitratorsRate[msg.sender] >= 0); 
      _; 
    }

    modifier onlyArbitrator() { 
      require(isArbitrator[msg.sender] == true); 
      _; 
    }
    
    constructor(address _tenant, address _landlord, address _agreement) {
        tenant = _tenant;
        landlord = _landlord;
        agreement = AgreementContract(_agreement);   
    }

    function addToArbitratorWhitelist() external {
      // to DO: Discuss - who should add arbitrators? The problem here is to avoid centralization
    }
    

    function becomeArbitrator() external payable onlyNotNegativeRate {
       require(arbitrators.length < 5);
       require(msg.value > 0);

       stakedAmount[msg.sender] = msg.value;
       isArbitrator[msg.sender] = true;
       arbitrators.push(msg.sender);
    }

    function vote(bool _vote) external onlyArbitrator {
      require(votesAmount < 5);
      
      votesAmount = votesAmount.add(1);
      votes[msg.sender] = _vote;

      if(votesAmount == arbitratorsNum) {
        arbitrationFinished();
      }
    }

    function getVotesResult() external view returns(bool) {
      require(votesAmount == arbitratorsNum);

      uint yes;
      uint no;

      for(uint i = 0; i < arbitrators.length; i++) {
        if(votes[arbitrators[i]] == true){
          yes = yes.add(1);
        } else {
          no = no.add(1);
        }
      }

      return yes > no;
    }
    
    function arbitrationFinished() internal {
      // to DO: add conditions;
    }

}