const truffleAssert = require('truffle-assertions');
const Test20Artifact = artifacts.require("./Test20.sol");
const Test1155Artifact = artifacts.require("./Test1155.sol");
const Test721Artifact = artifacts.require("./Test721.sol");
const BundlerArtifact = artifacts.require("./Bundler.sol");

let results;

contract("ERC20 deposit/withdraw tests", async accounts => {
  it ("allows depositing tokens and withdrawing, split over several deposits/withdraws", async() => {
    let Test20 = await Test20Artifact.deployed();
    let Test721 = await Test721Artifact.deployed();
    let Bundler = await BundlerArtifact.deployed();

    // Mint ID 1,2,3 to accounts[1]
    for (let i = 0; i < 3; i++) {
      await Test721.mint(accounts[1]);
    }

    // Mint 100 tokens to accounts[0]
    await Test20.mint(accounts[0], 100);

    // Approve the bundler to spend tokens
    await Test20.approve(Bundler.address, 100, {from: accounts[0]});

    // Deposit 1 token into ID 1
    await Bundler.depositERC20(Test20.address, 1, Test721.address, 1, {from: accounts[0]});

    // Withdraw 1 token from ID 1
    await Bundler.withdrawERC20(Test20.address, 1, Test721.address, 1, {from: accounts[1]});

    // Expect balance to be 1
    results = await Test20.balanceOf(accounts[1]);
    expect(results).to.eql(web3.utils.toBN(1));

    // Deposit 2 tokens into ID 1 (two separate txs)
    await Bundler.depositERC20(Test20.address, 1, Test721.address, 1, {from: accounts[0]});
    await Bundler.depositERC20(Test20.address, 1, Test721.address, 1, {from: accounts[0]});

    // Withdraw 2 tokens from ID 1
    await Bundler.withdrawERC20(Test20.address, 2, Test721.address, 1, {from: accounts[1]});

    // Expect balance to be 3 (1 + 2)
    results = await Test20.balanceOf(accounts[1]);
    expect(results).to.eql(web3.utils.toBN(3));

    // Alternate deposits/withdraws for ID 2 and 3
    for (let i = 0; i < 10; i++) {
      await Bundler.depositERC20(Test20.address, 1, Test721.address, 2, {from: accounts[0]});
      await Bundler.depositERC20(Test20.address, 2, Test721.address, 3, {from: accounts[0]}); 
      await Bundler.withdrawERC20(Test20.address, 1, Test721.address, 2, {from: accounts[1]});
    }

    // Expect balance to be 13 (3 + 10)
    results = await Test20.balanceOf(accounts[1]);
    expect(results).to.eql(web3.utils.toBN(13));

    // Expect balance to be 33 (13 + 20)
    await Bundler.withdrawERC20(Test20.address, 20, Test721.address, 3, {from: accounts[1]});
    results = await Test20.balanceOf(accounts[1]);
    expect(results).to.eql(web3.utils.toBN(33));
  });
});

contract("ERC721 deposit/withdraw tests", async accounts => {
  it ("allows depositing tokens and withdrawing, split over several deposits/withdraws", async() => {
    let Test721 = await Test721Artifact.deployed();
    let Bundler = await BundlerArtifact.deployed();

    // Mint ID 1-3 to accounts[0]
    for (let i = 0; i < 3; i++) {
      await Test721.mint(accounts[0]);
    }

    // Mint ID 4-13 to accounts[1]
    for (let i = 0; i < 10; i++) {
      await Test721.mint(accounts[1]);
    }

    // Approve bundler to spend tokens
    await Test721.setApprovalForAll(Bundler.address, true, {from: accounts[1]});

    // Deposit ID 4 inside
    await Bundler.depositERC721(Test721.address, 4, Test721.address, 1, {from: accounts[1]});

    // Withdraw ID 4 and expect it to be accounts[0]
    await Bundler.withdrawERC721(Test721.address, 4, Test721.address, 1, {from: accounts[0]});
    results = await Test721.ownerOf(4);
    expect(results).to.eql(accounts[0]);

    // Deposit ID 5 and 6 inside
    await Bundler.depositERC721(Test721.address, 5, Test721.address, 1, {from: accounts[1]});
    await Bundler.depositERC721(Test721.address, 6, Test721.address, 1, {from: accounts[1]});

    // Withdraw ID 5 and expect it to be accounts[0]
    await Bundler.withdrawERC721(Test721.address, 5, Test721.address, 1, {from: accounts[0]});
    results = await Test721.ownerOf(5);
    expect(results).to.eql(accounts[0]);

    // Withdraw ID 6 and expect it to be accounts[0]
    await Bundler.withdrawERC721(Test721.address, 6, Test721.address, 1, {from: accounts[0]});
    results = await Test721.ownerOf(6);
    expect(results).to.eql(accounts[0]);

    // Alternate deposits/withdraws for ID 7-13
    await Bundler.depositERC721(Test721.address, 7, Test721.address, 2, {from: accounts[1]});
    await Bundler.depositERC721(Test721.address, 8, Test721.address, 3, {from: accounts[1]});
    await Bundler.depositERC721(Test721.address, 9, Test721.address, 2, {from: accounts[1]});
    await Bundler.depositERC721(Test721.address, 10, Test721.address, 3, {from: accounts[1]});
    await Bundler.depositERC721(Test721.address, 11, Test721.address, 2, {from: accounts[1]});
    await Bundler.depositERC721(Test721.address, 12, Test721.address, 3, {from: accounts[1]});
    await Bundler.depositERC721(Test721.address, 13, Test721.address, 2, {from: accounts[1]});

    // Withdraw all tokens
    for (let i = 7; i <= 13; i++) {
      let index = 2;
      if (i % 2 == 0) {
        index = 3;
      }
      await Bundler.withdrawERC721(Test721.address, i, Test721.address, index, {from: accounts[0]});
      results = await Test721.ownerOf(i);
      expect(results).to.eql(accounts[0]);
    }
  });
});

contract("ERC1155 deposit/withdraw tests", async accounts => {
  it ("allows depositing tokens and withdrawing, split over several deposits/withdraws", async() => {
    let Test1155 = await Test1155Artifact.deployed();
    let Test721 = await Test721Artifact.deployed();
    let Bundler = await BundlerArtifact.deployed();

    // Mint ID 1-3 to accounts[0]
    for (let i = 0; i < 3; i++) {
      await Test721.mint(accounts[0]);
    }

    // Mint ID 1-10 with 100 supply
    for (let i = 1; i <= 10; i++) {
      await Test1155.mint(accounts[1], i, 100);
    }

    // Set approval for bundler
    await Test1155.setApprovalForAll(Bundler.address, true, {from: accounts[1]});

    // Deposit token 1 (amount: 10) into ID 1
    await Bundler.depositERC1155(Test1155.address, 1, 10, Test721.address, 1, {from: accounts[1]});
    
    // Withdraw token 1 (amount: 10) from ID 1
    await Bundler.withdrawERC1155(Test1155.address, 1, 10, Test721.address, 1, {from: accounts[0]});
    results = await Test1155.balanceOf(accounts[0], 1);
    expect(results).to.eql(web3.utils.toBN(10));

    // Deposit token 2 (amount: 10) into ID 2 
    // Deposit token 3 (amount: 10) into ID 3
    // do this twice
    await Bundler.depositERC1155(Test1155.address, 2, 10, Test721.address, 2, {from: accounts[1]});
    await Bundler.depositERC1155(Test1155.address, 3, 10, Test721.address, 3, {from: accounts[1]});
    await Bundler.depositERC1155(Test1155.address, 2, 10, Test721.address, 2, {from: accounts[1]});
    await Bundler.depositERC1155(Test1155.address, 3, 10, Test721.address, 3, {from: accounts[1]});

    // Withdraw token 2 (amount: 20) from ID 2
    await Bundler.withdrawERC1155(Test1155.address, 2, 20, Test721.address, 2, {from: accounts[0]});
    results = await Test1155.balanceOf(accounts[0], 2);
    expect(results).to.eql(web3.utils.toBN(20));

    // Withdraw token 3 (amount: 20) from ID 3
    await Bundler.withdrawERC1155(Test1155.address, 3, 20, Test721.address, 3, {from: accounts[0]});
    results = await Test1155.balanceOf(accounts[0], 3);
    expect(results).to.eql(web3.utils.toBN(20));
  });
});


contract("ERC20 revert tests", async accounts => {
  it ("reverts correctly if you overwithdraw or try to withdraw something not inside", async() => {
    let Test20 = await Test20Artifact.deployed();
    let Test721 = await Test721Artifact.deployed();
    let Bundler = await BundlerArtifact.deployed();

    // Mint ID 1 to accounts[1]
    await Test721.mint(accounts[1]);

    // Mint 100 tokens to accounts[0]
    await Test20.mint(accounts[0], 100);

    // Approve the bundler to spend tokens
    await Test20.approve(Bundler.address, 100, {from: accounts[0]});

    // Expect withdrawing to revert when there is nothing
    await truffleAssert.reverts(
      Bundler.withdrawERC20(Test20.address, 2, Test721.address, 1, {from: accounts[1]})
    );

    // Expect withdrawing to fail if not approved or owner
    await truffleAssert.reverts(
      Bundler.withdrawERC20(Test20.address, 2, Test721.address, 1, {from: accounts[0]}),
      "Not approved or owner"
    );

    // Deposit 1 token into ID 1
    await Bundler.depositERC20(Test20.address, 1, Test721.address, 1, {from: accounts[0]});

    // Expect withdrawing to revert when there aren't enough tokens
    await truffleAssert.reverts(
      Bundler.withdrawERC20(Test20.address, 2, Test721.address, 1, {from: accounts[1]})
    );

    // Withdraw the 1 token into ID 1
    await Bundler.withdrawERC20(Test20.address, 1, Test721.address, 1, {from: accounts[1]});

    // Expect withdrawing to revert when there is nothing
    await truffleAssert.reverts(
      Bundler.withdrawERC20(Test20.address, 2, Test721.address, 1, {from: accounts[1]})
    );
  });
});

contract("ERC721 revert tests", async accounts => {
  it ("reverts correctly if you overwithdraw or try to withdraw something not inside", async() => {
    let Test721 = await Test721Artifact.deployed();
    let Bundler = await BundlerArtifact.deployed();

    // Mint ID 1 to accounts[0]
    await Test721.mint(accounts[0]);

    // Mint ID 2-11 to accounts[1]
    for (let i = 0; i < 10; i++) {
      await Test721.mint(accounts[1]);
    }

    // Approve bundler to spend tokens
    await Test721.setApprovalForAll(Bundler.address, true, {from: accounts[1]});

    // Expect withdrawing to revert when there is nothing
    await truffleAssert.reverts(
      Bundler.withdrawERC721(Test721.address, 4, Test721.address, 1, {from: accounts[0]}),
      "Not bundled to this NFT"
    );

    // Deposit ID 2 inside
    await Bundler.depositERC721(Test721.address, 2, Test721.address, 1, {from: accounts[1]});

    // Expect withdrawing to revert if not approved or owner
    await truffleAssert.reverts(
      Bundler.withdrawERC721(Test721.address, 4, Test721.address, 1, {from: accounts[1]}),
      "Not approved or owner"
    );

    // Withdraw ID 2
    await Bundler.withdrawERC721(Test721.address, 2, Test721.address, 1, {from: accounts[0]});

    // Expect withdrawing to revert when there is nothing
    await truffleAssert.reverts(
      Bundler.withdrawERC721(Test721.address, 2, Test721.address, 1, {from: accounts[0]}),
      "Not bundled to this NFT"
    );
  });
});

contract("ERC1155 revert tests", async accounts => {
  it ("reverts correctly if you overwithdraw or try to withdraw something not inside", async() => {
    let Test1155 = await Test1155Artifact.deployed();
    let Test721 = await Test721Artifact.deployed();
    let Bundler = await BundlerArtifact.deployed();

    // Mint ID 1 to accounts[0]
    await Test721.mint(accounts[0]);

    // Mint ID 1-3 with 100 supply
    for (let i = 1; i <= 3; i++) {
      await Test1155.mint(accounts[1], i, 100);
    }

    // Set approval for bundler
    await Test1155.setApprovalForAll(Bundler.address, true, {from: accounts[1]});

    // Expect withdrawing to revert when there is nothing
    await truffleAssert.reverts(
      Bundler.withdrawERC1155(Test1155.address, 1, 1, Test721.address, 1, {from: accounts[0]})
    );

    // Deposit token 1 (amount: 10) into ID 1
    await Bundler.depositERC1155(Test1155.address, 1, 10, Test721.address, 1, {from: accounts[1]});

    // Expect withdrawing to revert when not approved or owner
    await truffleAssert.reverts(
      Bundler.withdrawERC1155(Test1155.address, 1, 1, Test721.address, 1, {from: accounts[1]}),
      "Not approved or owner"
    );

    // Expect withdrawing to revert when there aren't enough tokens
    await truffleAssert.reverts(
      Bundler.withdrawERC1155(Test1155.address, 1, 100, Test721.address, 1, {from: accounts[0]})
    );

    // Withdraw 10 tokens
    await Bundler.withdrawERC1155(Test1155.address, 1, 10, Test721.address, 1, {from: accounts[0]});

    // Expect withdrawing to revert when there aren't enough tokens
    await truffleAssert.reverts(
      Bundler.withdrawERC1155(Test1155.address, 1, 100, Test721.address, 1, {from: accounts[0]})
    );
  });
});

// Happy paths:
// ERC20 deposit/withdraw [x]
// ERC721 deposit/withdraw [x]
// ERC1155 deposit/withdraw (multiple IDs) [x]

// Everything reverts as expected:
// withdrawing something that's not inside (or more than allotted)
// withdrawing something that's keyed to something that's not yours
// ERC20 [x]
// ERC721 [x]
// ERC1155 [x]

// Mixed deposit/withdraw (i.e. deposit an ERC20 with the depositERC721 function) doesn't break things
// All of the above, but now it's an operator of the ERC721
