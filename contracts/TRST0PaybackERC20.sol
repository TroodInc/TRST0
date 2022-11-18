// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TRST0PaybackERC20 is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    ERC20Burnable token;
    IERC20 buyToken;

    uint256 public rate;

    uint256 public tokensReturned;

    event TopUp(address indexed sender, uint256 value);

    event TopUpRevert(address indexed receiver, uint256 value);

    event TokenReturn(
        address indexed sender,
        address indexed beneficiary,
        uint256 value,
        uint256 amount
    );

    constructor(
        ERC20Burnable _token,
        IERC20 _buyToken,
        uint _rate
    ) {
        token = _token;
        buyToken = _buyToken;
        rate = _rate;
    }

    function topUp(uint256 _amount) public {
        buyToken.safeTransferFrom(msg.sender, address(this), _amount);
        emit TopUp(msg.sender, _amount);
    }

    function revertTopUp(uint256 _amount) public onlyOwner {
        buyToken.transfer(owner(), _amount);
        emit TopUpRevert(owner(), _amount);
    }

    function getBalance() public view returns (uint256) {
        return buyToken.balanceOf(address(this));
    }

    function returnTokens(address _beneficiary, uint256 _amount) public {
        uint256 value = _getTokenValue(_amount);
        uint256 balance = getBalance();
        require(
            value <= balance,
            "Balance should be higher or equal to the returned value"
        );

        token.transferFrom(msg.sender, address(this), _amount);
        tokensReturned += _amount;
        buyToken.safeTransfer(_beneficiary, value);

        emit TokenReturn(msg.sender, _beneficiary, value, _amount);

        token.burn(_amount);
    }

    function _getTokenValue(uint256 _tokenAmount)
        internal
        view
        returns (uint256)
    {
        return _tokenAmount.div(rate);
    }
}
