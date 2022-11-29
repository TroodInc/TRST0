// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.7;

import "./AllowanceCrowdsaleWithDiscount.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

abstract contract AllowanceCrowdsaleWithDiscountERC20 is
    AllowanceCrowdsaleWithDiscount
{
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 private _buyToken;

    constructor(IERC20 buyToken_) {
        _buyToken = buyToken_;
    }

    function buyTokens(address beneficiary, uint256 weiAmount) public {
        buyTokensWithAmount(beneficiary, weiAmount);
    }

    function _preValidatePurchase(
        address beneficiary,
        uint256 weiAmount
    ) internal view virtual override {
        super._preValidatePurchase(beneficiary, weiAmount);
        address sender = _msgSender();
        uint256 allowance = _buyToken.allowance(sender, address(this));
        require(
            allowance >= weiAmount,
            "Allowance isn't set for buying tokens"
        );
    }

    function _forwardFunds(uint256 weiAmount) internal override {
        _buyToken.safeTransferFrom(_msgSender(), address(this), weiAmount);
        _buyToken.safeTransfer(wallet(), weiAmount);
    }

    function buyToken() public view returns (IERC20) {
        return _buyToken;
    }
}
