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
    uint public creationTimestamp;
    uint public arbitratorsAdded;
    uint internal yes;
    uint internal no;
    uint[] public arbitrators;

    address public owner;
    address public tenant;
    address public landlord;
    address public initiator;

    mapping(address => uint) stakedAmount;
    mapping(address => uint) arbitratorsRate;
    mapping(address => string) decisions;
    
    mapping(address => bool) isArbitrator;
    mapping(address => bool) votes;
    
    modifier onlyOwner() { 
    	require(msg.sender == owner); 
    	_; 
    }
    
    modifier onlyNotNegativeRate() { 
      require (arbitratorsRate[msg.sender] >= 0); 
      _; 
    }

    modifier onlyArbitrator() { 
      require(isArbitrator[msg.sender] == true); 
      _; 
    }

    modifier onlyTenantOrLandlord() { 
        require(msg.sender == tenant || msg.sender == landlord); 
        _; 
    }

    modifier onlyInArbitratorList(uint _time) { 
    	require(now >= _time); 
    	_; 
    }
    
    // to DO: Who is owner??
    constructor(address _tenant, address _landlord, address _initiator, address _agreement) {
        tenant = _tenant;
        landlord = _landlord;
        initiator = _initiator;
        agreement = AgreementContract(_agreement);   
        owner = msg.sender // ??
        creationTimestamp = block.timestamp;
    }

    // to DO: Discuss - who should add arbitrators? The problem here is to avoid centralization
    function addToArbitratorWhitelist(address[] _arbitrators) external onlyOwner {
    	require(creationTimestamp.add(1 days) >= block.timestamp);
    	require(_arbitrators.length == 5);
    	
    	for (uint i = 0; i < _arbitrators.length; i++) {
    		arbitrators.push(_arbitrators[i]);
    		isArbitrator[_arbitrators[i]] = true;
		}

		arbitratorsAdded = block.timestamp;
    }
    
    function becomeArbitrator() external payable onlyNotNegativeRate onlyArbitrator {
       require(arbitratorsAdded.add(2 hours) >= block.timestamp);
       require(msg.value > 0);

       stakedAmount[msg.sender] = msg.value;
    }

    function vote(bool _vote, string _decisionDetails) external onlyArbitrator {
      require(arbitratorsAdded.add(2 days) >= block.timestamp);
      require(votesAmount < 5);
      
      votesAmount = votesAmount.add(1);
      votes[msg.sender] = _vote;
      decisions[msg.sender] = _decisionDetails;

      if(votesAmount == arbitratorsNum) {
        arbitrationFinished();
      }
    }

    function getVotesResult() external view returns(bool) {
      require(votesAmount == arbitratorsNum);

      for(uint i = 0; i < arbitrators.length; i++) {
        if(votes[arbitrators[i]] == true) {
          yes = yes.add(1);
        } else {
          no = no.add(1);
        }
      }

      return yes > no;
    }
    
    // reward arbitrators
    function arbitrationFinished() internal {
      for (uint i = 0; i < arbitrators.length; i++) {
    	arbitrators[i].transfer(stakedAmount[arbitrators[i]]);
    	if(votes[arbitrators[i]] == getVotesResult()) {
    		if(getVotesResult()) {
    			arbitrators[i].transfer(arbitrationFee.div(yes));
    		} else {
    			arbitrators[i].transfer(arbitrationFee.div(no));
    		}
    	}
	  }
    }

    function submitAppeal() external onlyTenantOrLandlord {
    	
    }
    

}