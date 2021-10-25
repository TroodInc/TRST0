// SPDX-License-Identifier: MIT
// Trood Inc. based on OpenZeppelin Contracts v4.3.2 (utils/Context.sol)

pragma solidity ^0.8.7;

import "./Crowdsale.sol";
import "./ERC20.sol";
import "./SafeMath.sol";


/**
 * @title AllowanceCrowdsale
 * @dev Extension of Crowdsale where tokens are held by a wallet, which approves an allowance to the crowdsale.
 */
abstract contract AllowanceCrowdsale is Crowdsale {
  using SafeMath for uint256;

  address public tokenWallet;
  ERC20 token;

  /**
   * @dev Constructor, takes token wallet address.
   * @param _tokenWallet Address holding the tokens, which has approved allowance to the crowdsale
   */
  constructor(address _tokenWallet, ERC20 _token)  {
    require(_tokenWallet != address(0));
    tokenWallet = _tokenWallet;
    token = _token;
  }

  /**
   * @dev Checks the amount of tokens left in the allowance.
   * @return Amount of tokens left in the allowance
   */
  function remainingTokens() public view returns (uint256) {
    return token.allowance(tokenWallet, address(this));
  }

  /**
   * @dev Overrides parent behavior by transferring tokens from wallet.
   * @param _beneficiary Token purchaser
   * @param _tokenAmount Amount of tokens purchased
   */
  function _deliverTokens (
    address _beneficiary,
    uint256 _tokenAmount
  )
    internal override
  {
    token.transferFrom(tokenWallet, _beneficiary, _tokenAmount);
  }
}
