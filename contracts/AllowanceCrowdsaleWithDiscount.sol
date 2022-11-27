// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.7;

import "./AllowanceCrowdsale.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract AllowanceCrowdsaleWithDiscount is
    AllowanceCrowdsale,
    Ownable
{
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    mapping(address => uint8) private _discounts;

    function removeDiscount(address beneficiary) public onlyOwner {
        delete _discounts[beneficiary];
    }

    function setDiscount(address beneficiary, uint8 discount) public onlyOwner {
        require(discount < 100, "Discount should be less than 100");
        require(discount > 0, "Discount should be greater than 0");
        _discounts[beneficiary] = discount;
    }

    function _getTokenAmount(address beneficiary, uint256 weiAmount)
        internal
        view
        virtual
        override
        returns (uint256)
    {
        return
            weiAmount.mul(rate()).mul(100).div(100 - _discounts[beneficiary]);
    }
}
