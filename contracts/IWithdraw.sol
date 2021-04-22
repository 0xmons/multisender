// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.6.8;

interface IWithdraw {
  function withdrawERC20(address tokenAddress, uint256 tokenAmount, address nftAddress, uint256 nftId) external;
  function withdrawERC721(address tokenAddress, uint256 tokenId, address nftAddress, uint256 nftId) external;
  function withdrawERC1155(address tokenAddress, uint256 tokenId, uint256 tokenAmount, address nftAddress, uint256 nftId) external;
}