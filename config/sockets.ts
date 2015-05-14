/// <reference path='../typings/node/node.d.ts' />

/**
 * WebSocket Server Settings
 * (sails.config.sockets)
 *
 * These settings provide transparent access to the options for Sails'
 * encapsulated WebSocket server, as well as some additional Sails-specific
 * configuration layered on top.
 *
 * For more information on sockets configuration, including advanced config options, see:
 * http://sailsjs.org/#/documentation/reference/sails.config/sails.config.sockets.html
 */

module.exports.sockets = {
    adapter: 'socket.io-redis',
    host: '127.0.0.1',
    port: 6379,
    db: 'modmountain'
};
