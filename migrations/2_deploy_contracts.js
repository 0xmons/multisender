let Test20 = artifacts.require("./Test20.sol");
let Test1155 = artifacts.require("./Test1155.sol");
let Test721 = artifacts.require("./Test721.sol");
let Multisender = artifacts.require("./Multisender.sol");

let testing = false;

module.exports = async(deployer) => {

  if (testing) {
    await deployer.deploy(Test20);
    await deployer.deploy(Test721);
    await deployer.deploy(Test1155);
    await deployer.deploy(Multisender);
  }
  else{
    await deployer.deploy(Multisender);
  }

}