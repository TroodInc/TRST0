// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TRST0Payback is Ownable {
    using SafeMath for uint256;

    ERC20Burnable token;

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

    constructor(ERC20Burnable _token, uint _rate) {
        token = _token;
        rate = _rate;
    }

    receive() external payable {
        emit TopUp(msg.sender, msg.value);
    }

    function revertTopUp(uint256 _amount) public onlyOwner {
        payable(owner()).transfer(_amount);
        emit TopUpRevert(owner(), _amount);
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
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
        payable(_beneficiary).transfer(value);
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
