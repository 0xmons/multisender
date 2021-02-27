// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.6.8;

import "@openzeppelin/contracts/token/ERC1155/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Multisender is ERC1155Holder, ReentrancyGuard, Ownable {

  using SafeMath for uint256;

  address payable public feeReceiver;
  uint256 public ethFee;

  IERC20 public xmon;
  IERC721 public xmonNFT;

  uint256 public minXmon;
  uint256 public minXmonNFT;

  bytes emptyData = bytes("");

  // Mapping of ERC721 address -> ID -> tokenAddress -> reward amounts
  mapping(address => mapping(uint256 => mapping(address => uint256))) public erc20Rewards;

  // Mapping of ERC721 address -> ID -> tokenAddress -> array of IDs
  mapping(address => mapping(uint256 => mapping(address => uint256[]))) public erc721Rewards;

  // Mapping of ERC721 address -> ID -> tokenAddress -> IDs -> amounts
  mapping(address => mapping(uint256 => mapping(address => mapping(uint256 => uint256)))) public erc1155Rewards;


  constructor() public {
    ethFee = 0.05 ether;
    feeReceiver = 0x4e2f98c96e2d595a83AFa35888C4af58Ac343E44;
    minXmon = 1 ether;
    minXmonNFT = 1;
    xmon = IERC20(0x3aaDA3e213aBf8529606924d8D1c55CbDc70Bf74);
    xmonNFT = IERC721(0x0427743DF720801825a5c82e0582B1E915E0F750);
  }

  modifier collectFeeOrWhitelist() {
    if (msg.value >= ethFee) {
      feeReceiver.transfer(msg.value);
    }
    else {
      require(xmon.balanceOf(msg.sender) >= minXmon || xmonNFT.balanceOf(msg.sender) >= minXmonNFT, "Hold XMON");
    }
    _;
  }



  // Internal function to send ERC721 or ERC20 tokens
  // Using transferFrom means we don't implement ERC721 Receiver
  function _send721Or20(address tokenAddress, address from, address to, uint256 amountOrId) internal {
    IERC721(tokenAddress).transferFrom(from, to, amountOrId);
  }



  // Direct senders

  // Normal multisend: sends a batch of ERC721 or ERC20 to a list of addresses
  function send721Or20ToAddresses(
    address[] calldata userAddresses,
    uint256[] calldata amountsOrIds,
    address tokenAddress) external payable collectFeeOrWhitelist nonReentrant {
    require((userAddresses.length == amountsOrIds.length), "diff lengths");
    for (uint256 i = 0; i < userAddresses.length; i++) {
      _send721Or20(tokenAddress, msg.sender, userAddresses[i], amountsOrIds[i]);
    }
  }

// ERC721 targeted multisend: sends a batch of ERC721 or ERC20s to a list of ERC721 ID holders
  function send721Or20To721Ids(
    address[] calldata erc721Addresses,
    uint256[] calldata receiverIds,
    uint256[] calldata amountsOrIds,
    address tokenAddress) external payable collectFeeOrWhitelist nonReentrant {
    require((erc721Addresses.length == receiverIds.length), "diff lengths");
    require((erc721Addresses.length == amountsOrIds.length), "diff lengths");
    for (uint256 i = 0; i < receiverIds.length; i++) {
      IERC721Enumerable erc721 = IERC721Enumerable(erc721Addresses[i]);
      _send721Or20(tokenAddress, msg.sender, erc721.ownerOf(receiverIds[i]), amountsOrIds[i]);
    }
  }

  // Send ERC-1155 to a batch of addresses
  function send1155ToAddresses(
    address[] calldata userAddresses,
    uint256[] calldata tokenIds,
    uint256[] calldata amounts,
    address tokenAddress) external payable collectFeeOrWhitelist nonReentrant {
    require((userAddresses.length == amounts.length), "diff lengths");
    require((userAddresses.length == tokenIds.length), "diff lengths");
    for (uint256 i = 0; i < userAddresses.length; i++) {
      IERC1155(tokenAddress).safeTransferFrom(msg.sender, userAddresses[i], tokenIds[i], amounts[i], emptyData);
    }
  }

  // Send ERC-1155 to a list of ERC721 ID holders
  function send1155To721Ids(
    address[] calldata erc721Addresses,
    uint256[] calldata erc721Ids,
    uint256[] calldata tokenIds,
    uint256[] calldata amounts,
    address tokenAddress) external payable collectFeeOrWhitelist nonReentrant {
    require((erc721Addresses.length == erc721Ids.length), "diff lengths");
    require((erc721Addresses.length == amounts.length), "diff lengths");
    require((erc721Addresses.length == tokenIds.length), "diff lengths");
    for (uint256 i = 0; i < erc721Addresses.length; i++) {
      IERC1155(tokenAddress).safeTransferFrom(msg.sender, IERC721(erc721Addresses[i]).ownerOf(erc721Ids[i]), tokenIds[i], amounts[i], emptyData);
    }
  }




  // Delayed senders (i.e. for claimable airdrop)

  // Sends a batch of ERC20 rewards to a list of ERC721 ID holders, to be later claimed
  // Essentially "locks" tokens into the contract to be removed by the holder
  function set20To721Ids(
    address[] calldata erc721Addresses,
    uint256[] calldata receiverIds,
    uint256[] calldata amounts,
    address tokenAddress) external nonReentrant {
    require((erc721Addresses.length == receiverIds.length), "diff lengths");
    require((erc721Addresses.length == amounts.length), "diff lengths");
    for (uint256 i = 0; i < receiverIds.length; i++) {
      // Add new reward amount to mapping
      erc20Rewards[erc721Addresses[i]][receiverIds[i]][tokenAddress] = erc20Rewards[erc721Addresses[i]][receiverIds[i]][tokenAddress].add(amounts[i]);

      // Do the transfer
      _send721Or20(tokenAddress, msg.sender, address(this), amounts[i]);
    }
  }

  // Sends a batch of ERC721 rewards to a list of ERC721 ID holders, to be later claimed
  // Essentially "locks" tokens into the contract to be removed by the holder
  function set721To721Ids(
    address[] calldata erc721Addresses,
    uint256[] calldata receiverIds,
    uint256[] calldata idsToSend,
    address tokenAddress) external nonReentrant {
    require((erc721Addresses.length == receiverIds.length), "diff lengths");
    require((erc721Addresses.length == idsToSend.length), "diff lengths");
    for (uint256 i = 0; i < receiverIds.length; i++) {

      // Add to list of ERC721 reward IDs
      erc721Rewards[erc721Addresses[i]][receiverIds[i]][tokenAddress].push(idsToSend[i]);

      // Send rewards to sender
      _send721Or20(tokenAddress, msg.sender, address(this), idsToSend[i]);
    }
  }

  // Sends a batch of ERC1155 rewards to a list of ERC721 ID holders to be later claimed
  function set1155to721Ids(
    address[] calldata erc721Addresses,
    uint256[] calldata erc721Ids,
    uint256[] calldata tokenIds,
    uint256[] calldata amounts,
    address tokenAddress) external nonReentrant {
    require((erc721Addresses.length == erc721Ids.length), "diff lengths");
    require((erc721Addresses.length == amounts.length), "diff lengths");
    require((erc721Addresses.length == tokenIds.length), "diff lengths");
    for (uint256 i = 0; i < erc721Addresses.length; i++) {
      erc1155Rewards[erc721Addresses[i]][erc721Ids[i]][tokenAddress][tokenIds[i]] = erc1155Rewards[erc721Addresses[i]][erc721Ids[i]][tokenAddress][tokenIds[i]].add(amounts[i]);
      IERC1155(tokenAddress).safeTransferFrom(msg.sender, address(this), tokenIds[i], amounts[i], emptyData);
    }
  }



  // Reward claimers
  // Takes ERC20 reward for a given ERC721 ID
  function take20Rewards(
    address erc721Address,
    uint256 holderId,
    address rewardAddress) external nonReentrant {
    IERC721Enumerable erc721 = IERC721Enumerable(erc721Address);
    require((erc721.ownerOf(holderId) == msg.sender), "Not owner");

    // We use transfer to avoid having to make an approve call
    // The ITransferFrom interface using transferFrom would require an extra approve call
    IERC20(rewardAddress).transfer(msg.sender, erc20Rewards[erc721Address][holderId][rewardAddress]);

    // Clear storage for that one reward address
    delete erc20Rewards[erc721Address][holderId][rewardAddress];
  }

  // Takes all ERC721 rewards for a given ERC721 ID
  function take721Rewards(
    address erc721Address,
    uint256 holderId,
    address rewardAddress) external nonReentrant {
    IERC721Enumerable erc721 = IERC721Enumerable(erc721Address);
    require((erc721.ownerOf(holderId) == msg.sender), "Not owner");

    // Claim all of the associated rewards in the list
    uint256[] memory idList = erc721Rewards[erc721Address][holderId][rewardAddress];
    for (uint256 i = 0; i < idList.length; i++) {
      _send721Or20(rewardAddress, address(this), msg.sender, idList[i]);
    }

    // Clear storage for that ERC721 address
    delete erc721Rewards[erc721Address][holderId][rewardAddress];
  }

  // Takes ERC1155 reward for a given ERC721 ID
  function take1155Rewards(
    address erc721Address,
    uint256 holderId,
    address rewardAddress,
    uint256 rewardId) external nonReentrant {
    IERC721Enumerable erc721 = IERC721Enumerable(erc721Address);
    require((erc721.ownerOf(holderId) == msg.sender), "Not owner");
    uint256 amount = erc1155Rewards[erc721Address][holderId][rewardAddress][rewardId];

    // Move amount of erc1155 tokens over
    IERC1155(rewardAddress).safeTransferFrom(address(this), msg.sender, rewardId, amount, emptyData);

    // Clear storage for that ERC1155 address and ID
    delete erc1155Rewards[erc721Address][holderId][rewardAddress][rewardId];
  }


  // OWNER FUNCTIONS

  function setFeeReceiver(address payable a) public onlyOwner {
    feeReceiver = a;
  }

  function setEthFee(uint256 f) public onlyOwner {
    require(f < ethFee, "Only lower fee");
    ethFee = f;
  }

  function setMinXmon(uint256 m) public onlyOwner {
    minXmon = m;
  }

  function setMinXmonNFT(uint256 m) public onlyOwner {
    minXmonNFT = m;
  }

  function setXmon(address a) public onlyOwner {
    xmon = IERC20(a);
  }

  function setXmonNFT(address a) public onlyOwner {
    xmonNFT = IERC721(a);
  }
}