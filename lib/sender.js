/*!
 * node-gcm
 * Copyright(c) 2013 Marcus Farkas <toothlessgear@finitebox.com>
 * MIT Licensed
 */
var Constants = require('./constants');
var request = require('request');
var replay = require('request-replay');

module.exports = Sender;

function Sender (key , options) {
    this.key = key;
    this.options = options || {};
}

Sender.prototype.send = function (message, registrationId, retries, callback) {
    callback = callback || function anonymousCallback () {}

    var body = {},
        attempt = 1,
        backoff = Constants.BACKOFF_INITIAL_DELAY,
        timeout = this.options.timeout || Constants.SOCKET_TIMEOUT
    ;

    if (!registrationId.length) 
        return callback('No RegistrationIds given!')

    body[Constants.JSON_REGISTRATION_IDS] = registrationId;

    if (message.delayWhileIdle)
        body[Constants.PARAM_DELAY_WHILE_IDLE] = message.delayWhileIdle;

    if (message.collapseKey)
        body[Constants.PARAM_COLLAPSE_KEY] = message.collapseKey;

    if (message.timeToLive !== undefined)
        body[Constants.PARAM_TIME_TO_LIVE] = message.timeToLive;

    if (message.hasData)
        body[Constants.PARAM_PAYLOAD_KEY] = message.data;

    var options = {
        json: true,
        timeout: timeout,
        url: 'https://' + Constants.GCM_SEND_ENDPOINT + ':443' + Constants.GCM_SEND_ENDPATH,
        body: body,
        headers: {
            'Authorization': 'key=' + this.key
        }
    };

    replay(
      request.post(options, processRequest),
      { maxTimeout: timeout, retries: retries, errorCodes: Constants.RETRY_ERROR_CODES }
    );

    function processRequest (error, response, body) {
        if (!error && response.statusCode !== 200) {
            console.log('deu merda!', response.statusCode);
        }

        callback(error, body);
    }
   
};
