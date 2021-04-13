// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.6.8;

import "@openzeppelin/contracts/token/ERC1155/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Bundler is ERC721Holder, ERC1155Holder, ReentrancyGuard {

  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  // Mapping of ERC721 address -> ID -> tokenAddress -> reward amounts
  mapping(address => mapping(uint256 => mapping(address => uint256))) public ERC20Locked;

  // Mapping of ERC721 address -> ID -> tokenAddress -> IDs -> bool
  mapping(address => mapping(uint256 => mapping(address => mapping(uint256 => bool)))) public ERC721Locked;

  // Mapping of ERC721 address -> ID -> tokenAddress -> IDs -> amounts
  mapping(address => mapping(uint256 => mapping(address => mapping(uint256 => uint256)))) public ERC1155Locked;

  function depositERC20(address tokenAddress, uint256 tokenAmount, address nftAddress, uint256 nftId) public nonReentrant {
    ERC20Locked[nftAddress][nftId][tokenAddress] = ERC20Locked[nftAddress][nftId][tokenAddress].add(tokenAmount);
    IERC20(tokenAddress).safeTransferFrom(msg.sender, address(this), tokenAmount);
  }

  function depositERC721(address tokenAddress, uint256 tokenId, address nftAddress, uint256 nftId) public nonReentrant {
    ERC721Locked[nftAddress][nftId][tokenAddress][tokenId] = true;
    IERC721(tokenAddress).safeTransferFrom(msg.sender, address(this), tokenId);
  }

  function depositERC1155(address tokenAddress, uint256 tokenId, uint256 tokenAmount, address nftAddress, uint256 nftId) public nonReentrant {
    ERC1155Locked[nftAddress][nftId][tokenAddress][tokenId] = ERC1155Locked[nftAddress][nftId][tokenAddress][tokenId].add(tokenAmount);
    IERC1155(tokenAddress).safeTransferFrom(msg.sender, address(this), tokenId, tokenAmount, "");
  }

  // TODO: a batch deposit for ERC1155?

  function isApprovedOrOwner(address nftAddress, uint256 nftId) internal view {
    address owner = IERC721(nftAddress).ownerOf(nftId);
    require(
      owner == msg.sender ||
      IERC721(nftAddress).getApproved(nftId) == msg.sender ||
      IERC721(nftAddress).isApprovedForAll(owner, msg.sender),
      "Not approved or owner");
  }

  function withdrawERC20(address tokenAddress, uint256 tokenAmount, address nftAddress, uint256 nftId) public nonReentrant {
    isApprovedOrOwner(nftAddress, nftId);
    ERC20Locked[nftAddress][nftId][tokenAddress] = ERC20Locked[nftAddress][nftId][tokenAddress].sub(tokenAmount);
    IERC20(tokenAddress).safeTransfer(msg.sender, tokenAmount);
  }

  function withdrawERC721(address tokenAddress, uint256 tokenId, address nftAddress, uint256 nftId) public nonReentrant {
    isApprovedOrOwner(nftAddress, nftId);
    IERC721(tokenAddress).safeTransferFrom(address(this), msg.sender, tokenId);
    delete ERC721Locked[nftAddress][nftId][tokenAddress][tokenId];
  }

  function withdrawERC1155(address tokenAddress, uint256 tokenId, uint256 tokenAmount, address nftAddress, uint256 nftId) public nonReentrant {
    isApprovedOrOwner(nftAddress, nftId);
    ERC1155Locked[nftAddress][nftId][tokenAddress][tokenId] = ERC1155Locked[nftAddress][nftId][tokenAddress][tokenId].sub(tokenAmount);
    IERC1155(tokenAddress).safeTransferFrom(address(this), msg.sender, tokenId, tokenAmount, "");
  }
}