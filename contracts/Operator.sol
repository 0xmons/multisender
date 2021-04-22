// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.6.8;

import "./IWithdraw.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract Operator {

  using SafeERC20 for IERC20;

  IWithdraw public bundler;

  constructor(address a) public {
    bundler = IWithdraw(a);
  }

  function withdrawERC20(address tokenAddress, uint256 tokenAmount, address nftAddress, uint256 nftId) external {
    bundler.withdrawERC20(tokenAddress, tokenAmount, nftAddress, nftId);

    // NOTE: this is UNSAFE, unless you permission who can call this function
    IERC20(tokenAddress).safeTransfer(msg.sender, tokenAmount);
  }
}