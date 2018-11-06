pragma solidity ^0.4.24;

import "./AgreementContract.sol";

contract OfferContract {

    uint public rentPrice;
    uint public newProposedRentPrice;
    uint public area;
    address public owner;

    event AgreementCreated(address tenant, address landlord);
    event OfferCreated(address _by, uint _rentPrice , uint _area);
    event OfferChangesRequested(address _by, uint _newRentPrice);
    event ChangeRequestAccepted(address _by);
    event OwnershipTransfered(address _from, address _to);

    modifier onlyOwner() { 
        require(msg.sender == owner); 
        _; 
    }
    
    constructor (uint _rentPrice , uint _area){
        owner = msg.sender;
        rentPrice = _rentPrice;
        area = _area;

        emit OfferCreated(_by, _rentPrice, _area);
    }

    function transferOwnership(address _newOwner) onlyOwner public {
        owner = _newOwner;
        emit OwnershipTransfered(msg.sender, _newOwner);
    }

    function acceptOffer(string _agreementDetails) onlyTenantOrLandlord public {
        AgreementContract agreement = new AgreementContract(msg.sender, _by, _agreementDetails);
        emit AgreementCreated(_by, msg.sender);
    }

    function changeRequest(uint _newRentPrice) public {
        newProposedRentPrice = _newRentPrice;
        emit OfferChangesRequested(msg.sender, _newRentPrice);
    }

    function acceptChangeRequest() onlyOwner public{
        require(newProposedRentPrice > 0);
        rentPrice = newProposedRentPrice;
        emit ChangeRequestAccepted(msg.sender);
    }
    
}