pragma solidity ^0.4.24;

// Copyright 2017 Bittrex

contract AgreementContract {

    enum AgreementStatus { New, Signed, Declined }
    AgreementStatus status;

    string public agreementDetails;
    string public declineReason;
    address public tenant;
    address public landlord;
    bool signedByTenant;
    bool signedByLandlord;

    event AgreementCreated(address tenant, address landlord);
    event AgreementSigned(address by);
    event AgreementDeclined(address by, string reason);

    modifier onlyTenantOrLandlord() { 
        require(msg.sender == tenant || msg.sender == landlord); 
        _; 
    }

    modifier onlyNew() { 
        require(status == AgreementStatus.New); 
        _; 
    }
    
    constructor (address _tenant, address _landlord ,string _agreementDetails){
        tenant = _tenant;
        landlord = _landlord;
        agreementDetails = _agreementDetails;
        status = AgreementStatus.New;
        emit AgreementCreated(_tenant, _landlord);
    }

    function signAgreement() onlyTenantOrLandlord public returns(bool){
        if(msg.sender == tenant){
            require(signedByTenant == false);
            signedByTenant = true;
            emit AgreementSigned(msg.sender);
            if(signedByLandlord == true){
                status = AgreementStatus.Signed;
            }
        } else {
            require(signedByLandlord == false);
            signedByLandlord = true;
            emit AgreementSigned(msg.sender);
            if(signedByTenant == true){
                status = AgreementStatus.Signed;
            }
        }
    }

    function declineAgreement(string _reason) onlyTenantOrLandlord onlyNew public returns(bool){
        require (status!=AgreementStatus.Declined);
        
        declineReason = _reason;
        status = AgreementStatus.Declined;
        emit AgreementDeclined(msg.sender, _reason);
    }
    
}