var BinaryMerkleTree = artifacts.require('./BinaryMerkleTree.sol')

module.exports = function (deployer) {
  deployer.deploy(BinaryMerkleTree)
}
