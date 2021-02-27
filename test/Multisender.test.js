const truffleAssert = require('truffle-assertions');
const Test20Artifact = artifacts.require("./Test20.sol");
const Test1155Artifact = artifacts.require("./Test1155.sol");
const Test721Artifact = artifacts.require("./Test721.sol");
const MultisenderArtifact = artifacts.require("./Multisender.sol");

let results;

contract("ERC20 sending tests", async accounts => {
  it ("allows sending 10 ERC20 tokens to accounts 1/2/3/4", async() => {
    let Test20 = await Test20Artifact.deployed();
    let Msender = await MultisenderArtifact.deployed();

    // Mint 10 tokens to accounts[0]
    await Test20.mint(accounts[0], 10);

    results = await Test20.balanceOf(accounts[0]);
    expect(results).to.eql(web3.utils.toBN(10));

    // Approve multisend to spend 10 tokens
    await Test20.approve(Msender.address, 10, {from: accounts[0]});

    await Msender.send721Or20ToAddresses(
      [accounts[1], accounts[2], accounts[3], accounts[4]],
      [1,2,3,4],
      Test20.address,
      {from: accounts[0], value: web3.utils.toWei('0.05', 'ether')}
    )

    for (let i = 1; i <= 4; i++) {
      results = await Test20.balanceOf(accounts[i]);
      expect(results).to.eql(web3.utils.toBN(i));
    }

    // Expect revert if wrong number of args
    await truffleAssert.reverts(
      Msender.send721Or20ToAddresses(
        [accounts[1], accounts[2], accounts[3], accounts[4]],
        [1,2,3],
        Test20.address,
        {from: accounts[0], value: web3.utils.toWei('0.05', 'ether')}
      ),
      "diff lengths"
    );
    await truffleAssert.reverts(
      Msender.send721Or20ToAddresses(
        [accounts[3], accounts[4]],
        [1,2,3],
        Test20.address,
        {from: accounts[0], value: web3.utils.toWei('0.05', 'ether')}
      ),
      "diff lengths"
    );
  });
});

contract("ERC721 sending tests", async accounts => {
  it ("allows sending 5 ERC721 tokens to accounts 1/2/3/4", async() => {
    let Test721 = await Test721Artifact.deployed();
    let Msender = await MultisenderArtifact.deployed();

    // Mint IDs 1-5 tokens to accounts[0]
    for (let i = 0; i < 10; i++) {
      await Test721.mint(accounts[0]);
    }

    // Approve multisend to spend 10 tokens
    await Test721.setApprovalForAll(Msender.address, true, {from: accounts[0]});

    await Msender.send721Or20ToAddresses(
      [accounts[1], accounts[2], accounts[3], accounts[4]],
      [1,2,3,4],
      Test721.address,
      {from: accounts[0], value: web3.utils.toWei('0.05', 'ether')}
    );

    for (let i = 1; i <= 4; i++) {
      results = await Test721.ownerOf(i);
      expect(results).to.eql(accounts[i]);
    }
  });
});

contract("ERC1155 sending tests", async accounts => {
  it ("allows sending 2/4/6/8 ERC1155 tokens to accounts 1/2/3/4", async() => {
    let Test1155 = await Test1155Artifact.deployed();
    let Msender = await MultisenderArtifact.deployed();

    // Mint 1/2/3/4 tokens to accounts[0]
    for (let i = 1; i <= 4; i++) {
      await Test1155.mint(accounts[0], i, 2*i);
    }

    // Approve multisend to spend tokens
    await Test1155.setApprovalForAll(Msender.address, true, {from: accounts[0]});

    await Msender.send1155ToAddresses(
      [accounts[1], accounts[2], accounts[3], accounts[4]],
      [1,2,3,4],
      [2,4,6,8],
      Test1155.address,
      {from: accounts[0], value: web3.utils.toWei('0.05', 'ether')}
    );

    for (let i = 1; i <= 4; i++) {
      results = await Test1155.balanceOf(accounts[i], i);
      expect(results).to.eql(web3.utils.toBN(2*i));
    }

    // Expect revert if wrong number of args
    await truffleAssert.reverts(
      Msender.send1155ToAddresses(
        [accounts[1], accounts[2], accounts[3], accounts[4]],
        [1,2,3,4],
        [1,2,3],
        Test1155.address,
        {from: accounts[0], value: web3.utils.toWei('0.05', 'ether')}
        ),
      "diff lengths"
    );
    await truffleAssert.reverts(
      Msender.send1155ToAddresses(
        [accounts[1], accounts[2], accounts[3], accounts[4]],
        [1,2,3],
        [1,2,3,4],
        Test1155.address,
        {from: accounts[0], value: web3.utils.toWei('0.05', 'ether')}
        ),
      "diff lengths"
    );
    await truffleAssert.reverts(
      Msender.send1155ToAddresses(
        [accounts[1]],
        [1,2,3],
        [1,2,3,4],
        Test1155.address,
        {from: accounts[0], value: web3.utils.toWei('0.05', 'ether')}
        ),
      "diff lengths"
    );
  });
});

contract("ERC20 to ERC721 sending tests", async accounts => {
  it ("allows sending 1/2/3/4 ERC20 tokens to accounts that hold ERC721 IDs 1/2/3/4", async() => {
    let Test721 = await Test721Artifact.deployed();
    let Test20 = await Test20Artifact.deployed();
    let Msender = await MultisenderArtifact.deployed();

    // Mint IDs 1-4 tokens to accounts 1-4
    for (let i = 0; i < 5; i++) {
      let a = accounts[i+1];
      await Test721.mint(a);
    }
    
    // Mint 10 ERC20 tokens to accounts[0]
    await Test20.mint(accounts[0], 10);

    // Approve multisend to spend 10 tokens
    await Test20.approve(Msender.address, 10, {from: accounts[0]});

    await Msender.send721Or20To721Ids(
      [Test721.address, Test721.address, Test721.address, Test721.address],
      [1,2,3,4],
      [1,2,3,4],
      Test20.address,
      {from: accounts[0], value: web3.utils.toWei('0.05', 'ether')}
    );

    for (let i = 1; i <= 4; i++) {
      results = await Test20.balanceOf(accounts[i]);
      expect(results).to.eql(web3.utils.toBN(i));
    }
  });
});

contract("ERC721 to ERC721 sending tests", async accounts => {
  it ("allows sending 1/2/3/4 ERC721 tokens to accounts that hold ERC721 IDs 1/2/3/4", async() => {
    let Test721 = await Test721Artifact.deployed();
    let Msender = await MultisenderArtifact.deployed();

    // Mint IDs 1-4 tokens to accounts 1-4
    for (let i = 0; i < 4; i++) {
      let a = accounts[i+1];
      await Test721.mint(a);
    }

    // Mint IDs 5-9 to accounts[0]
    for (let i = 0; i < 5; i++) {
      await Test721.mint(accounts[0]);
    }

    // Approve multisend to spend all Test721_B tokens
    await Test721.setApprovalForAll(Msender.address, true, {from: accounts[0]});

    await Msender.send721Or20To721Ids(
      [Test721.address, Test721.address, Test721.address, Test721.address],
      [1,2,3,4],
      [5,6,7,8],
      Test721.address,
      {from: accounts[0], value: web3.utils.toWei('0.05', 'ether')}
    );

    for (let i = 1; i <= 4; i++) {
      results = await Test721.ownerOf(4+i);
      expect(results).to.eql(accounts[i]);
    }
  });
});

contract("ERC1155 to ERC721 sending tests", async accounts => {
  it ("allows sending 1/2/3/4 ERC1155 tokens to accounts that hold ERC721 IDs 1/2/3/4", async() => {
    let Test721 = await Test721Artifact.deployed();
    let Test1155 = await Test1155Artifact.deployed();
    let Msender = await MultisenderArtifact.deployed();

    // Mint IDs 1-4 tokens to accounts 1-4
    for (let i = 0; i < 4; i++) {
      let a = accounts[i+1];
      await Test721.mint(a);
    }

    // Mint IDs 1-4 with count 1-4 to accounts[0]
    // Mint 1/2/3/4 tokens to accounts[0]
    for (let i = 1; i <= 4; i++) {
      await Test1155.mint(accounts[0], i, 2*i);
    }

    // Approve multisend to spend all Test721_B tokens
    await Test1155.setApprovalForAll(Msender.address, true, {from: accounts[0]});

    await Msender.send1155To721Ids(
      [Test721.address,Test721.address,Test721.address,Test721.address],
      [1,2,3,4],
      [1,2,3,4],
      [2,4,6,8],
      Test1155.address,
      {from: accounts[0], value: web3.utils.toWei('0.05', 'ether')}
    );

    for (let i = 1; i <= 4; i++) {
      results = await Test1155.balanceOf(accounts[i], i);
      expect(results).to.eql(web3.utils.toBN(2*i));
    }

    await truffleAssert.reverts(
      Msender.send1155To721Ids(
        [Test721.address,Test721.address,Test721.address,Test721.address],
        [1,2,3],
        [1,2,3,4],
        [2,4,6,8],
        Test1155.address,
        {from: accounts[0], value: web3.utils.toWei('0.05', 'ether')}
      ),
      "diff lengths"
    );

    await truffleAssert.reverts(
      Msender.send1155To721Ids(
        [Test721.address,Test721.address,Test721.address,Test721.address],
        [1,2,3,4],
        [1],
        [2,4,6,8],
        Test1155.address,
        {from: accounts[0], value: web3.utils.toWei('0.05', 'ether')}
      ),
      "diff lengths"
    );

    await truffleAssert.reverts(
      Msender.send1155To721Ids(
        [Test721.address],
        [1,2,3],
        [1,2,3,4],
        [2,4,6,8],
        Test1155.address,
        {from: accounts[0], value: web3.utils.toWei('0.05', 'ether')}
      ),
      "diff lengths"
    );
  });
});

contract("ERC20 locking tests", async accounts => {
  it ("allows locking 1/2/3/4 ERC20 tokens to ERC721 IDs 1/2/3/4", async() => {
    let Test721 = await Test721Artifact.deployed();
    let Test20 = await Test20Artifact.deployed();
    let Msender = await MultisenderArtifact.deployed();

    // Mint IDs 1-4 tokens to accounts 1-4
    for (let i = 0; i < 5; i++) {
      let a = accounts[i+1];
      await Test721.mint(a);
    }
    
    // Mint 10 ERC20 tokens to accounts[0]
    await Test20.mint(accounts[0], 10);

    // Approve multisend to spend 10 tokens
    await Test20.approve(Msender.address, 10, {from: accounts[0]});

    await Msender.set20To721Ids(
      [Test721.address, Test721.address, Test721.address, Test721.address],
      [1,2,3,4],
      [1,2,3,4],
      Test20.address,
      {from: accounts[0]}
    );
    
    // Expect it to fail if someone tries to claim a different reward
    for (let i = 1; i <= 3; i++) {
      let a = accounts[i+1];
      await truffleAssert.reverts(
        Msender.take20Rewards(Test721.address, i, Test20.address, {from: a}),
        "Not owner"
      );
    }

    // Actually claim the rewards
    for (let i = 1; i <= 4; i++) {
      let a = accounts[i];
      await Msender.take20Rewards(Test721.address, i, Test20.address, {from: a});
      results = await Test20.balanceOf(accounts[i]);
      expect(results).to.eql(web3.utils.toBN(i));
    }
  });
});

contract("ERC20 locking tests", async accounts => {
  it ("allows locking 2/4/6/8 ERC20 tokens to ERC721 IDs 1/2/3/4, over 2 lock calls", async() => {
    let Test721 = await Test721Artifact.deployed();
    let Test20 = await Test20Artifact.deployed();
    let Msender = await MultisenderArtifact.deployed();

    // Mint IDs 1-4 tokens to accounts 1-4
    for (let i = 0; i < 5; i++) {
      let a = accounts[i+1];
      await Test721.mint(a);
    }
    
    // Mint 20 ERC20 tokens to accounts[0]
    await Test20.mint(accounts[0], 20);

    // Approve multisend to spend 10 tokens
    await Test20.approve(Msender.address, 20, {from: accounts[0]});

    // Two locking calls
    await Msender.set20To721Ids(
      [Test721.address, Test721.address, Test721.address, Test721.address],
      [1,2,3,4],
      [1,2,3,4],
      Test20.address,
      {from: accounts[0]}
    );
    await Msender.set20To721Ids(
      [Test721.address, Test721.address, Test721.address, Test721.address],
      [1,2,3,4],
      [1,2,3,4],
      Test20.address,
      {from: accounts[0]}
    );
    
    // Expect it to fail if someone tries to claim a different reward
    for (let i = 1; i <= 3; i++) {
      let a = accounts[i+1];
      await truffleAssert.reverts(
        Msender.take20Rewards(Test721.address, i, Test20.address, {from: a}),
        "Not owner"
      );
    }

    // Actually claim the rewards
    for (let i = 1; i <= 4; i++) {
      let a = accounts[i];
      await Msender.take20Rewards(Test721.address, i, Test20.address, {from: a});
      results = await Test20.balanceOf(accounts[i]);
      expect(results).to.eql(web3.utils.toBN(2*i));

      // Expect another call to be harmless
      await Msender.take20Rewards(Test721.address, i, Test20.address, {from: a});
    }
  });
});

contract("ERC721 locking tests", async accounts => {
  it ("allows locking ERC721 IDs 5/6/7/8 to accounts that hold ERC721 IDs 1/2/3/4", async() => {
    let Test721 = await Test721Artifact.deployed();
    let Msender = await MultisenderArtifact.deployed();

    // Mint IDs 1-4 tokens to accounts 1-4
    for (let i = 0; i < 4; i++) {
      let a = accounts[i+1];
      await Test721.mint(a);
    }

    // Mint IDs 5-8 to accounts[0]
    for (let i = 0; i < 5; i++) {
      await Test721.mint(accounts[0]);
    }

    // Approve multisend to spend all Test721_B tokens
    await Test721.setApprovalForAll(Msender.address, true, {from: accounts[0]});

    await Msender.set721To721Ids(
      [Test721.address, Test721.address, Test721.address, Test721.address],
      [1,2,3,4],
      [5,6,7,8],
      Test721.address,
      {from: accounts[0]}
    );

    // Expect it to fail if someone tries to claim a different reward
    for (let i = 1; i <= 3; i++) {
      let a = accounts[i+1];
      await truffleAssert.reverts(
        Msender.take721Rewards(Test721.address, i, Test721.address, {from: a}),
        "Not owner"
      );
    }

    // Actually take rewards
    for (let i = 1; i <= 4; i++) {
      await Msender.take721Rewards(Test721.address, i, Test721.address, {from: accounts[i]});
      results = await Test721.ownerOf(4+i);
      expect(results).to.eql(accounts[i]);
    }
  });
});

contract("ERC721 locking tests", async accounts => {
  it ("allows locking ERC721 IDs 5/6/7/8 and 9/10/11/12 to accounts that hold ERC721 IDs 1/2/3/4", async() => {
    let Test721 = await Test721Artifact.deployed();
    let Msender = await MultisenderArtifact.deployed();

    // Mint IDs 1-4 tokens to accounts 1-4
    for (let i = 0; i < 4; i++) {
      let a = accounts[i+1];
      await Test721.mint(a);
    }

    // Mint IDs 5-8 to accounts[0]
    for (let i = 0; i < 9; i++) {
      await Test721.mint(accounts[0]);
    }

    // Approve multisend to spend all Test721_B tokens
    await Test721.setApprovalForAll(Msender.address, true, {from: accounts[0]});

    // Double send
    await Msender.set721To721Ids(
      [Test721.address, Test721.address, Test721.address, Test721.address],
      [1,2,3,4],
      [5,6,7,8],
      Test721.address,
      {from: accounts[0]}
    );
    await Msender.set721To721Ids(
      [Test721.address, Test721.address, Test721.address, Test721.address],
      [1,2,3,4],
      [9,10,11,12],
      Test721.address,
      {from: accounts[0]}
    );

    // Expect it to fail if someone tries to claim a different reward
    for (let i = 1; i <= 3; i++) {
      let a = accounts[i+1];
      await truffleAssert.reverts(
        Msender.take721Rewards(Test721.address, i, Test721.address, {from: a}),
        "Not owner"
      );
    }

    // Actually take rewards
    for (let i = 1; i <= 4; i++) {
      await Msender.take721Rewards(Test721.address, i, Test721.address, {from: accounts[i]});
      results = await Test721.ownerOf(4+i);
      expect(results).to.eql(accounts[i]);
      results = await Test721.ownerOf(8+i);
      expect(results).to.eql(accounts[i]);

      // Expect another call to be harmless
      await Msender.take721Rewards(Test721.address, i, Test721.address, {from: accounts[i]});
    }
  });
});

contract("ERC1155 locking tests", async accounts => {
  it ("allows locking 1/2/3/4 ERC1155 tokens (with quantity 2/4/6/8) to accounts that hold ERC721 IDs 1/2/3/4", async() => {
    let Test721 = await Test721Artifact.deployed();
    let Test1155 = await Test1155Artifact.deployed();
    let Msender = await MultisenderArtifact.deployed();

    // Mint IDs 1-4 tokens to accounts 1-4
    for (let i = 0; i < 4; i++) {
      let a = accounts[i+1];
      await Test721.mint(a);
    }

    // Mint IDs 1-4 with count 1-4 to accounts[0]
    // Mint 1/2/3/4 tokens to accounts[0]
    for (let i = 1; i <= 4; i++) {
      await Test1155.mint(accounts[0], i, 2*i);
    }

    // Approve multisend to spend all Test721_B tokens
    await Test1155.setApprovalForAll(Msender.address, true, {from: accounts[0]});

    await Msender.set1155to721Ids(
      [Test721.address,Test721.address,Test721.address,Test721.address],
      [1,2,3,4],
      [1,2,3,4],
      [2,4,6,8],
      Test1155.address,
      {from: accounts[0]}
    );

    // Expect it to fail if someone tries to claim a different reward
    for (let i = 1; i <= 3; i++) {
      let a = accounts[i+1];
      await truffleAssert.reverts(
        Msender.take1155Rewards(Test721.address, i, Test1155.address, i+1, {from: a}),
        "Not owner"
      );
    }

    for (let i = 1; i <= 4; i++) {
      await Msender.take1155Rewards(Test721.address, i, Test1155.address, i, {from: accounts[i]});
      results = await Test1155.balanceOf(accounts[i], i);
      expect(results).to.eql(web3.utils.toBN(2*i));
    }
  });
});

contract("ERC1155 locking tests", async accounts => {
  it ("allows locking 1/2/3/4 ERC1155 tokens (with quantity 4/8/12/16) to accounts that hold ERC721 IDs 1/2/3/4", async() => {
    let Test721 = await Test721Artifact.deployed();
    let Test1155 = await Test1155Artifact.deployed();
    let Msender = await MultisenderArtifact.deployed();

    // Mint IDs 1-4 tokens to accounts 1-4
    for (let i = 0; i < 4; i++) {
      let a = accounts[i+1];
      await Test721.mint(a);
    }

    // Mint IDs 1-4 with count 1-4 to accounts[0]
    // Mint 1/2/3/4 tokens to accounts[0]
    for (let i = 1; i <= 4; i++) {
      await Test1155.mint(accounts[0], i, 4*i);
    }

    // Approve multisend to spend all Test721_B tokens
    await Test1155.setApprovalForAll(Msender.address, true, {from: accounts[0]});

    /// Double lock
    await Msender.set1155to721Ids(
      [Test721.address,Test721.address,Test721.address,Test721.address],
      [1,2,3,4],
      [1,2,3,4],
      [2,4,6,8],
      Test1155.address,
      {from: accounts[0]}
    );
    await Msender.set1155to721Ids(
      [Test721.address,Test721.address,Test721.address,Test721.address],
      [1,2,3,4],
      [1,2,3,4],
      [2,4,6,8],
      Test1155.address,
      {from: accounts[0]}
    );

    // Expect it to fail if someone tries to claim a different reward
    for (let i = 1; i <= 3; i++) {
      let a = accounts[i+1];
      await truffleAssert.reverts(
        Msender.take1155Rewards(Test721.address, i, Test1155.address, i+1, {from: a}),
        "Not owner"
      );
    }

    for (let i = 1; i <= 4; i++) {
      await Msender.take1155Rewards(Test721.address, i, Test1155.address, i, {from: accounts[i]});
      results = await Test1155.balanceOf(accounts[i], i);
      expect(results).to.eql(web3.utils.toBN(4*i));

      // Expect multiple claims to do nothing
      await Msender.take1155Rewards(Test721.address, i, Test1155.address, i, {from: accounts[i]});
    }
  });
});

contract("ERC20 sending tests", async accounts => {
  it ("allows sending 10 ERC20 tokens to accounts 1/2/3/4 with no fees if owner holds 1 NFT", async() => {
    let Test20 = await Test20Artifact.deployed();
    let Test721 = await Test721Artifact.deployed();
    let Msender = await MultisenderArtifact.deployed();

    // Set minimum xmon NFT to be 1
    await Msender.setMinXmonNFT(1, {from: accounts[0]});

    // Set minimum xmon amount to be 1000 (should not trigger)
    await Msender.setMinXmon(1000, {from: accounts[0]});

    // Set xmon NFT to be Test721
    await Msender.setXmonNFT(Test721.address, {from: accounts[0]});

    // Set XMON to be Test20
    await Msender.setXmon(Test20.address, {from: accounts[0]});

    // Assign NFT ID 1 to accounts[0]
    await Test721.mint(accounts[0]);

    // Mint 10 tokens to accounts[0]
    await Test20.mint(accounts[0], 10);

    // Approve multisend to spend 10 tokens
    await Test20.approve(Msender.address, 10, {from: accounts[0]});

    await Msender.send721Or20ToAddresses(
      [accounts[1], accounts[2], accounts[3], accounts[4]],
      [1,2,3,4],
      Test20.address,
      {from: accounts[0]}
    );

    for (let i = 1; i <= 4; i++) {
      results = await Test20.balanceOf(accounts[i]);
      expect(results).to.eql(web3.utils.toBN(i));
    }

    // Expect revert if wrong number of args
    await truffleAssert.reverts(
      Msender.send721Or20ToAddresses(
        [accounts[1], accounts[2], accounts[3], accounts[4]],
        [1,2,3],
        Test20.address,
        {from: accounts[0]}
      ),
      "diff lengths"
    );
    await truffleAssert.reverts(
      Msender.send721Or20ToAddresses(
        [accounts[3], accounts[4]],
        [1,2,3],
        Test20.address,
        {from: accounts[0]}
      ),
      "diff lengths"
    );
  });
});

contract("ERC20 sending tests", async accounts => {
  it ("allows sending 10 ERC20 tokens to accounts 1/2/3/4 with no fees if owner holds 1 ERC20 token", async() => {
    let Test20 = await Test20Artifact.deployed();
    let Test721 = await Test721Artifact.deployed();
    let Msender = await MultisenderArtifact.deployed();

    // Set minimum xmon NFT to be 1 (should not trigger)
    await Msender.setMinXmonNFT(1000, {from: accounts[0]});

    // Set minimum xmon amount to be 1000 
    await Msender.setMinXmon(1, {from: accounts[0]});

    // Set xmon NFT to be Test721
    await Msender.setXmonNFT(Test721.address, {from: accounts[0]});

    // Set XMON to be Test20
    await Msender.setXmon(Test20.address, {from: accounts[0]});

    // Assign NFT ID 1 to accounts[0]
    await Test721.mint(accounts[0]);

    // Mint 10 tokens to accounts[0]
    await Test20.mint(accounts[0], 11);

    // Approve multisend to spend 10 tokens
    await Test20.approve(Msender.address, 10, {from: accounts[0]});

    await Msender.send721Or20ToAddresses(
      [accounts[1], accounts[2], accounts[3], accounts[4]],
      [1,2,3,4],
      Test20.address,
      {from: accounts[0]}
    );

    for (let i = 1; i <= 4; i++) {
      results = await Test20.balanceOf(accounts[i]);
      expect(results).to.eql(web3.utils.toBN(i));
    }

    // Expect revert if wrong number of args
    await truffleAssert.reverts(
      Msender.send721Or20ToAddresses(
        [accounts[1], accounts[2], accounts[3], accounts[4]],
        [1,2,3],
        Test20.address,
        {from: accounts[0]}
      ),
      "diff lengths"
    );
    await truffleAssert.reverts(
      Msender.send721Or20ToAddresses(
        [accounts[3], accounts[4]],
        [1,2,3],
        Test20.address,
        {from: accounts[0]}
      ),
      "diff lengths"
    );
  });
});

contract("Permission tests", async accounts => {
  it ("allows only owner to modify fee receiver/eth fee/xmon address/xmonNFT address/minXmon/minXmonNFT", async() => {
    let Test20 = await Test20Artifact.deployed();
    let Msender = await MultisenderArtifact.deployed();

    await Msender.setFeeReceiver(accounts[0], {from: accounts[0]});
    results = await Msender.feeReceiver();
    expect(results).to.eql(accounts[0]);
    await truffleAssert.reverts(
      Msender.setFeeReceiver(accounts[0], {from: accounts[1]})
    );

    await Msender.setEthFee(10, {from: accounts[0]});
    results = await Msender.ethFee();
    expect(results).to.eql(web3.utils.toBN(10));
    await truffleAssert.reverts(
      Msender.setEthFee(10, {from: accounts[1]})
    );

    await Msender.setXmon(Test20.address, {from: accounts[0]});
    await truffleAssert.reverts(
      Msender.setXmon(Test20.address, {from: accounts[1]})
    );

    await Msender.setXmonNFT(Test20.address, {from: accounts[0]});
    await truffleAssert.reverts(
      Msender.setXmonNFT(Test20.address, {from: accounts[1]})
    );
    
    await Msender.setMinXmon(100, {from: accounts[0]});
    results = await Msender.minXmon();
    expect(results).to.eql(web3.utils.toBN(100));
    await truffleAssert.reverts(
      Msender.setMinXmon(100, {from: accounts[1]})
    );

    await Msender.setMinXmonNFT(1000, {from: accounts[0]});
    results = await Msender.minXmonNFT();
    expect(results).to.eql(web3.utils.toBN(1000));
    await truffleAssert.reverts(
      Msender.setMinXmonNFT(1000, {from: accounts[1]})
    );
  });
});


// Multisend ERC721 distribution works [x]

// Mulitsend ERC1155 distribution works [x]

// Multisending ERC20 to ERC721 ids works [x]

// Multisending ERC721 to ERC721 ids works [x]

// Multisending ERC1155 to ERC721 ids works [x]

// Setting/claiming ERC20 rewards works [x]

// Setting/claiming ERC721 rewards works [x]

// Setting/claiming ERC1155 rewards works [x]

// Adding more ERC20 rewards doesn't heck things up [x]

// Adding more ERC721 rewards doesn't heck things up [x]

// Adding more ERC1155 rewards doesn't heck things up [x]

// Other people can't claim ERC20 rewards [x]

// Other people can't claim ERC721 rewards [x]

// Other people can't claim ERC1155 rewards [x]



// Only owner can set all values (fee, recipient, xmon, xmonNFT, minXmon, minXmonNFT)
// Verify recipient actually gets fees
// Verify recipient gets no fees of holder has at least minXmon or minXmonNFT