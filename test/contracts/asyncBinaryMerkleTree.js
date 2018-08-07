"use strict";

let debug = 0;

let chai = require('chai');
const asyncExecute = require("../utils/asyncExecute.js");


function Contract() {


    let app = {};
    app.__proto__ = asyncExecute();

    app.hashZero = '0x0000000000000000000000000000000000000000000000000000000000000000';

    app.root = '';

    //leafs with paths to proof
    app.leafs = {};

    // reflect hash of data to its original value
    app.hash2data = {};

    //all tree items
    app.tree = {};

    /**
     *
     * @param _leafsHashes logs from contract events
     */
    app.processLeafs = (_leafsHashes) => {

        _leafsHashes.map((obj,i) => {

            app.leafs[obj.data.toNumber()] = obj.dataHash;

            app.tree[obj.dataHash] = {
                leaf: true,
                parent: null
            }

        })

        debug && console.log('app.leafs:', app.leafs);
    }

    // build a tree base on contract events - for testing purposes
    app.processItems = (_treeItemsEvents) => {

        _treeItemsEvents.map((obj,i) => {

            app.tree[obj.hash] = {
                parent: null,
                leaf: false
            };

            app.tree[obj.left].parent = obj.hash;

            if (obj.right.toString(10) !== app.hashZero)
                app.tree[obj.right].parent = obj.hash;


        })

        debug && console.log('app.tree:', app.tree)
    }


    app.getProof = (data) => {

        let hash = app.leafs[data];

        let path = [];

        while (hash) {
            path.push(hash);
            hash = app.tree[hash].parent;
        }

        return path;

    }

    app.resetTree = () => {
        app.leafs = {};
        app.tree = {};
        app.root = null;
        app.hash2data = {};
    }


    app.createTree = async function (_data, _txAttr, _expectThrow) {

        app.resetTree();

        /// @dev make sure, we have transaction attributes
        _txAttr = this.getTxAttr(_txAttr);

        /// @dev create action command
        let action = () => this.instance.createTree(_data, _txAttr);

        /// @dev run `executeAction` - pay attention on additional attributes like: logCount, eventName, expectThrow
        /// do not create this variable globally
        let results = await this.executeAction(action, _txAttr, 0, null, _expectThrow);

        /// @dev perform tests
        if (!_expectThrow) {

            chai.assert.exists(results.LogCreateLeaf, "missing LogCreateLeafs event");
            assert.strictEqual(results.LogCreateLeaf.length, _data.length, "we should have the same number of leafs as number of input data");


            chai.assert.exists(results.LogCreateRoot[0], "missing LogCreateRoot event data");
            assert.strictEqual(results.LogCreateRoot[0].root, await this.getRoot(), "invalid root hash");

            chai.assert.exists(results.LogCreateTreeItem, "missing LogCreateTreeItem events");
            assert.isAbove(results.LogCreateTreeItem.length, 0);


            //lest just check if all hashes are unique
            let allHashes = [];

            debug && console.log('LogCreateTreeItem:', results.LogCreateTreeItem);
            results.LogCreateTreeItem.map(obj => {
                chai.assert.notInclude(allHashes, obj.hash, "We have duplicate hash: " + obj.hash);
                allHashes.push(obj.hash);
            });


            debug && console.log('LogCreateLeaf:', results.LogCreateLeaf);
            results.LogCreateLeaf.map(obj => {
               chai.assert.notInclude(allHashes, obj.dataHash, "We have duplicate hash: " + obj.dataHash);
                allHashes.push(obj.dataHash);
            });


            debug && console.log('LogCreateRoot:', results.LogCreateRoot);
            chai.assert.oneOf(results.LogCreateRoot[0].root, allHashes, "We need to have root in our hashes");


            //debug && console.log(allHashes);

            //build tree for testing purposes

            app.processLeafs(results.LogCreateLeaf);
            app.processItems(results.LogCreateTreeItem);
            app.root = results.LogCreateRoot[0].root;

        }

        return results;
    }


    // we can also provide non transaction methods, for easy access
    app.getRoot = async function () {

        return await this.instance.root();

    }

    // we can also provide non transaction methods, for easy access
    app.checkProof = async function (_proof, _expectInvalid) {

        let result = await this.instance.checkProof(_proof);
        debug && console.log('PROOF: ', result.toString(10));

        if (_expectInvalid)
            assert.isFalse(result.toString(10) === '0', "proof should be invalid")
        else
            assert.isTrue(result.toString(10) === '0', "proof does not match")

    }

    // we can also provide non transaction methods, for easy access
    app.getTree = async function () {

        return await this.instance.tree();

    }


    return app;

}



module.exports = Contract;