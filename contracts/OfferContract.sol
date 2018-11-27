pragma solidity ^0.4.24;

import "./AgreementContract.sol";

contract OfferContract {

    using SafeMath for uint256;

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
    uint public securityDeposit;
    uint public bookingTime = 30 minutes;

    event AgreementCreated(address tenant, address landlord, uint area, uint rentPrice, uint period);
    event OfferPriceChangeRequested(address by, uint newRentPrice);
    event OfferPeriodChangeRequested(address by, uint newPeriod);
    event PriceChangeRequestAccepted(address from, uint newRentPrice);
    event PeriodChangeRequestAccepted(address from, uint newPeriod);

    modifier onlyOwner() { 
        require(msg.sender == owner); 
        _; 
    }

    modifier onlyInActiveDuration() { 
        require(creationDate.add(activeDuration) >= block.timestamp); 
        _; 
    }
    
    constructor (uint _rentPrice , uint _area, uint _period, uint _activeDuration, uint _finePercent, uint _securityDeposit){
        require(activeDuration > 0);

        owner = msg.sender;
        rentPrice = _rentPrice;
        area = _area;
        period = _period;
        creationDate = block.timestamp;
        finePercent = _finePercent;
        securityDeposit = _securityDeposit;
        activeDuration = _activeDuration.mul(1 days);
    }

    function acceptOffer() public onlyInActiveDuration {
        require (msg.sender != owner);
        require(status == OfferStatus.New || status == OfferStatus.Booked);

        if(status == OfferStatus.Booked && bookedAt[bookedFor].add(bookingTime) >= block.timestamp){
            require(msg.sender == bookedFor);
        }
        
        AgreementContract agreement = new AgreementContract(msg.sender, owner, rentPrice, area, period, finePercent, securityDeposit);
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