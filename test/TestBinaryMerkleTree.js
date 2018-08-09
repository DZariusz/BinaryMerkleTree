
// require for async
require('babel-register')
require('babel-polyfill')
let chai = require('chai')

let randomIntIn = require('./utils/randomIntIn')

// when true all console messages are displayed
let debug = 0

const Promise = require('bluebird')

if (typeof web3.eth.getAccountsPromise === 'undefined') {
  Promise.promisifyAll(web3.eth, { suffix: 'Promise' })
}

const BMTutil = require('./contracts/asyncBinaryMerkleTree')
const BMTartifacts = artifacts.require('./BinaryMerkleTree.sol')
const asyncBMT = BMTutil()

// simple finctionu for changing just one char in hash
String.prototype.changeHash = function () { // eslint-disable-line
  let index = randomIntIn(2, 65)
  let replacement = this.charAt(index) === 'a' ? 'b' : 'a'
  return this.substr(0, index) + replacement + this.substr(index + replacement.length)
}

contract('BinaryMerkleTree contract', function (accounts) {
  // our tree data
  let data = []
  let address

  // our Merkel Tree contract
  let contract

  before('should prepare', async function () {
    assert.isAtLeast(accounts.length, 1)

    address = accounts[0]

    // generate some random data to test, but remember, thay must be unique!
    let maxI = randomIntIn(2, 30)
    if (debug) maxI = 28
    for (let i = 0; i < maxI; i++) {
      data.push(randomIntIn(i * 5, 4) + 1)
    }

    // data = [1,2,3]

    console.log('RANDOM TESTING DATA:', data.join(', '))

    web3.eth.getBalancePromise(accounts[0])
      .then(balance => assert.isAtLeast(web3.fromWei(balance).toNumber(), 10, 'Not enought ETH balance for perform a test'))
  })

  describe('Tests', function () {
    beforeEach('should deploy a new contract', function () {
      return BMTartifacts.new()
        .then(function (instance) {
          contract = asyncBMT
          contract.setInstanceVar(instance)
          contract.setFromVar(address)
        })
    })

    describe('initial values', function () {
      it('should have empty initial root', async function () {
        let v = await contract.getRoot()
        assert.strictEqual(v, contract.hashZero)
      })
    })

    describe('createTree passing tests', function () {
      it('should be possible to createTree with valid data', async function () {
        await contract.createTree(data, {})
      })
    })

    describe('createTree failing tests', function () {
      let failData

      it('should NOT be possible to createTree with empty data', async function () {
        failData = []
        await contract.createTree(failData, {}, true)
      })

      it('should NOT be possible to createTree with just 1 item', async function () {
        failData = [1]
        await contract.createTree(failData, {}, true)
      })

      it('should NOT be possible to createTree with not unique items', async function () {
        failData = [1, 2, 3, 1]
        await contract.createTree(failData, {}, true)
      })

      it('should NOT be possible to createTree with zero', async function () {
        failData = [1, 2, 3, 0]
        await contract.createTree(failData, {}, true)
      })
    }) // */

    describe('Proof passing tests', function () {
      it('should be possible to proof valid data', async function () {
        await contract.createTree(data, {})

        // lets get any random path to proof
        let randomData = data[ randomIntIn(0, data.length) ]

        chai.assert.exists(randomData, 'our random data do not exists')
        let path = contract.getProof(randomData)

        chai.assert.isAbove(path.length, 0, 'Path must not be empty')

        debug && console.log('path for: ' + randomData, path)

        await contract.checkProof(path)
      })
    }) // */

    describe('Proof failing tests', function () {
      it('should NOT be possible to validate data, if we change hashes', async function () {
        await contract.createTree(data, {})

        // lets get any random path to proof
        let randomData = data[ randomIntIn(0, data.length - 1) ]

        chai.assert.exists(randomData, 'our random data do not exists')
        let path = contract.getProof(randomData)

        chai.assert.isAbove(path.length, 0, 'Path must not be empty')

        debug && console.log('path for: ' + randomData, path)

        // lets randomly change the data
        let i = randomIntIn(0, path.length - 1)
        let origin = path[i]
        path[i] = path[i].changeHash()

        assert.notEqual(origin, path[i])

        await contract.checkProof(path, true)
      })

      it('should NOT be possible to validate data, if we remove any hash from the proof', async function () {
        await contract.createTree(data, {})

        // lets get any random path to proof
        let randomData = data[ randomIntIn(0, data.length - 1) ]

        chai.assert.exists(randomData, 'our random data do not exists')
        let path = contract.getProof(randomData)

        chai.assert.isAbove(path.length, 0, 'Path must not be empty')

        debug && console.log('path for: ' + randomData, path)

        // lets randomly change the data
        let origin = path
        path = path.slice(randomIntIn(0, path.length - 1), 1)

        assert.notEqual(origin.length, path.length)

        await contract.checkProof(path, true)
      })
    }) // */
  })
})
