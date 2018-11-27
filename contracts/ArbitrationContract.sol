pragma solidity ^0.4.24;

import "./AgreementContract.sol";

contract ArbitrationContract {

    using SafeMath for uint256;

    AgreementContract agreement;
    
    uint public arbitratorsNum = 5;
    uint public penaltyFee;
    uint public arbitrationFee;
    uint public votesAmount;
    uint public creationTimestamp;
    uint public arbitratorsAdded;
    uint internal yes;
    uint internal no;
    
    address[] public arbitrators;

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
        owner = msg.sender; // ??
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
    	if(votes[arbitrators[i]] == this.getVotesResult()) {
    		if(this.getVotesResult()) {
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