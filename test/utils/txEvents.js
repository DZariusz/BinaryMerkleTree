"use strict";

let debug = 0;

/**
 * @dev this module goes throw all logs and base on parameters, does some actions
 *
 * @param _txLogs - transaction logs, required
 * @param _eventName - name of event we are looking for, if there is no such event, error is throw, optional
 * @param _logCount - number of logs that transaction should emits, if different number then error is throw, false if we don't care
 *
 * @return array or all events ( OR single event if _eventName was provided, also if we expect (_logCount) only 1 log iem,
 * then only arguments for this log are returned
 */
module.exports = function check(_txLogs, _eventName, _logCount) {


    if (typeof _eventName === 'undefined') _eventName = false;
    if (typeof _logCount === 'undefined') _logCount = false;



    if ((typeof _txLogs !== 'object') && (typeof _txLogs !== 'array')) {
        assert.isTrue(false, '[txEvents] Logs must be object or array');
        return null;
    }

    if (_logCount) {
        if (debug && (_txLogs.length !== _logCount)) {
            console.log(_txLogs.length, '!=', _logCount);
        }
        assert.strictEqual(_txLogs.length, _logCount, '[txEvents] Amount of emitted logs invalid');
    }

    debug && console.log('typeof _txLogs', typeof _txLogs);
    debug && console.log('_txLogs.length', _txLogs.length);

    let obj = {};

    for (let i =0; i < _txLogs.length; i++) {

        let log = _txLogs[i];
        debug && console.log(log);

        //if we don't have this type of log, then initiate empty array
        if (typeof obj[log.event] === 'undefined') obj[log.event] = [];
        obj[log.event].push(log.args);

    }

    debug && console.log(obj);

    /// @dev do we need specific log?
    if (_eventName) {
        if (typeof obj[_eventName] === 'undefined') {
            assert.isTrue(false, '[txEvents] Expected event `'+ _eventName +'` does not exist');
            return null;
        }

        //if we have _eventName and we expect only 1, then return only arguments
        return _logCount === 1 ? obj[_eventName][0] : obj[_eventName];
    }


    return obj;

};
