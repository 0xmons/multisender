// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.6.8;

import "./IWithdraw.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract Operator is ERC721Holder, ERC1155Holder{

  using SafeERC20 for IERC20;

  IWithdraw public bundler;

  constructor(address a) public {
    bundler = IWithdraw(a);
  }

  // NOTE: these functions are UNSAFE, unless you permission who can call this function
  // Only used for testing

  function withdrawERC20(address tokenAddress, uint256 tokenAmount, address nftAddress, uint256 nftId) external {
    bundler.withdrawERC20(tokenAddress, tokenAmount, nftAddress, nftId);
    IERC20(tokenAddress).safeTransfer(msg.sender, tokenAmount);
  }

  function withdrawERC721(address tokenAddress, uint256 tokenId, address nftAddress, uint256 nftId) external {
    bundler.withdrawERC721(tokenAddress, tokenId, nftAddress, nftId);
    IERC721(tokenAddress).safeTransferFrom(address(this), msg.sender, tokenId);
  }

  function withdrawERC1155(address tokenAddress, uint256 tokenId, uint256 tokenAmount, address nftAddress, uint256 nftId) external {
    bundler.withdrawERC1155(tokenAddress, tokenId, tokenAmount, nftAddress, nftId);
    IERC1155(tokenAddress).safeTransferFrom(address(this), msg.sender, tokenId, tokenAmount, "");
  }
}