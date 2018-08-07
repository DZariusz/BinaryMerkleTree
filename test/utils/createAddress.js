const randomIntIn = require("./randomIntIn.js");

let debug = false;

function createAddress() {


    function fromString(s) {

        let addr = '0x' + '0'.repeat(40 - s.length) + s;
        debug && console.log('createAddress: ', addr);

        return addr;
    }

    function random() {

        return this.fromString(randomIntIn(1000, 1000000).toString(10));
    }


    return {
        fromString: fromString,
        random: random
    }

}

module.exports = createAddress;