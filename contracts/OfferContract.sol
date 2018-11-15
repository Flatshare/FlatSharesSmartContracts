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

contract OfferContract {

    enum OfferStatus { New, Accepted, Booked }
    OfferStatus status;

    mapping (address => uint) newProposedRentPrices;
    mapping (address => uint) newProposedPeriods;
    mapping (address => uint) bookedAt;

    address public owner;
    address public bookedFor;

    uint public rentPrice;
    uint public area;
    uint public period;
    uint public activeDuration;
    uint public creationDate;
    uint public finePercent;
    uint public bookingTime = 30 minutes;

    event AgreementCreated(address tenant, address landlord, uint area, uint rentPrice, uint period);
    event OfferPriceChangeRequested(address by, uint newRentPrice);
    event OfferPeriodChangeRequested(address by, uint newPeriod);
    event PriceChangeRequestAccepted(address from, address newRentPrice);
    event PeriodChangeRequestAccepted(address from, address newPeriod);

    modifier onlyOwner() { 
        require(msg.sender == owner); 
        _; 
    }

    modifier onlyInActiveDuration() { 
        require(creationDate.add(activeDuration) >= block.timestamp); 
        _; 
    }
    
    constructor (uint _rentPrice , uint _area, uint _period, uint _activeDuration, uint _finePercent){
        require(activeDuration > 0);

        owner = msg.sender;
        rentPrice = _rentPrice;
        area = _area;
        period = _period;
        creationDate = block.timestamp;
        finePercent = _finePercent;
        activeDuration = _activeDuration.mul(1 days);
    }

    function acceptOffer() public onlyInActiveDuration {
        require (msg.sender != owner);
        require(status == OfferStatus.New || status == OfferStatus.Booked);

        if(status == OfferStatus.Booked && bookedAt[bookedFor].add(bookingTime) >= block.timestamp){
            require(msg.sender == bookedFor);
        }
        
        AgreementContract agreement = new AgreementContract(msg.sender, owner, rentPrice, area, period, finePercent);
        emit AgreementCreated(msg.sender, owner, area, rentPrice, period);
        status = OfferStatus.Accepted;
    }

    function priceChangeRequest(uint _newRentPrice) public onlyInActiveDuration {
        newProposedRentPrices[msg.sender] = _newRentPrice;
        emit OfferPriceChangeRequested(msg.sender, _newRentPrice);
    }

    function periodChangeRequest(uint _newPeriod) public onlyInActiveDuration {
        newProposedPeriods[msg.sender] = _newPeriod;
        emit OfferPeriodChangeRequested(msg.sender, _newPeriod);
    }

    function acceptPriceChangeRequestFrom(address _tenant) public onlyOwner onlyInActiveDuration {
        require(newProposedRentPrices[_tenant] > 0);
        rentPrice = newProposedRentPrices[_tenant];
        emit PriceChangeRequestAccepted(_tenant, rentPrice);

        status = OfferStatus.Booked;
        bookedAt[_tenant] = block.timestamp;
        bookedFor = _tenant;
        activeDuration.add(2 hours);
    }

    function acceptPeriodChangeRequestFrom(address _tenant) public onlyOwner onlyInActiveDuration {
        require(newProposedPeriods[_tenant] > 0);
        period = newProposedPeriods[_tenant];
        emit PeriodChangeRequestAccepted(_tenant, period);

        status = OfferStatus.Booked;
        bookedAt[_tenant] = block.timestamp;
        bookedFor = _tenant;
        activeDuration.add(2 hours);
    }
    
}