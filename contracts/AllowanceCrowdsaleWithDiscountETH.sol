// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.7;

import "./AllowanceCrowdsaleWithDiscount.sol";

abstract contract AllowanceCrowdsaleWithDiscountETH is
    AllowanceCrowdsaleWithDiscount
{
    /**
     * @dev fallback function ***DO NOT OVERRIDE***
     * Note that other contracts will transfer funds with a base gas stipend
     * of 2300, which is not enough to call buyTokens. Consider calling
     * buyTokens directly when purchasing tokens from a contract.
     */
    receive() external payable {
        buyTokens(_msgSender());
    }

    /**
     * @dev fallback function ***DO NOT OVERRIDE***
     * Note that other contracts will transfer funds with a base gas stipend
     * of 2300, which is not enough to call buyTokens. Consider calling
     * buyTokens directly when purchasing tokens from a contract.
     */
    function buyTokens(address beneficiary) public payable {
        buyTokensWithAmount(beneficiary, msg.value);
    }
}
