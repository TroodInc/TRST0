pragma solidity ^0.8.7;

import "./Crowdsale.sol";
import "./AllowanceCrowdsale.sol";

import "./TRST0.sol";
import "./TRST0Crowdsale.sol";

contract TRST0CrowdsaleDeployer {

uint256 constant nSupply = 300000*1000000000000000000; ///300000*10^18
uint256 constant nRate = 250; ///TRST0 per BNB


    constructor()
        public
    {
        // create a fixed supply token
        TRST0 token = new TRST0("Trood Token 0", "TRST0", payable(msg.sender), nSupply);

        // create the crowdsale and tell it about the token
        TRST0Crowdsale crowdsale = new TRST0Crowdsale(
                                                      nRate,               // rate, still in TKNbits
                                                      payable(msg.sender),
                                                      token);
    }
}
