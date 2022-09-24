// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

import "./AllowanceCrowdsale.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TRST0Crowdsale is AllowanceCrowdsale {
    constructor(
        uint256 rate, // rate in base units
        address payable wallet,
        address tokenWallet,
        ERC20 token
    ) Crowdsale(rate, wallet, token) AllowanceCrowdsale(tokenWallet) {}
}
