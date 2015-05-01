/// <reference path='../typings/node/node.d.ts' />

/**
 * HTTP Server Settings
 * (sails.config.http)
 *
 * Configuration for the underlying HTTP server in Sails.
 * Only applies to HTTP requests (not WebSockets)
 *
 * For more information on configuration, check out:
 * http://sailsjs.org/#/documentation/reference/sails.config/sails.config.http.html
 */

var Crypto = require('crypto');
var Streamifier = require('streamifier');
var Mongo = require('mongodb');
module.exports.http = {

    /****************************************************************************
     *                                                                           *
     * Express middleware to use for every Sails request. To add custom          *
     * middleware to the mix, add a function to the middleware config object and *
     * add its key to the "order" array. The $custom key is reserved for         *
     * backwards-compatibility with Sails v0.9.x apps that use the               *
     * `customMiddleware` config option.                                         *
     *                                                                           *
     ****************************************************************************/

    middleware: {

        /***************************************************************************
         *                                                                          *
         * The order in which middleware should be run for HTTP request. (the Sails *
         * router is invoked by the "router" middleware below.)                     *
         *                                                                          *
         ***************************************************************************/

        passportInit: require('passport').initialize(),
        passportSession: require('passport').session(),
        userToTemplate: function (req, res, next) {
            res.locals.user = req.user;
            next();
        },
        morgan: require('morgan')('dev', {
            skip: function (req, res) {
                return res.statusCode < 400
            }
        }),
        multer: require('multer')({
            limits: {
                fileSize: 100000000
            },
            inMemory: true,
            rename: function (fieldname, filename) {
                return Crypto.createHash('md5').update(fieldname + filename + Date.now()).digest('hex');
            },
            onFileUploadStart: function (file) {
                console.log(file.originalname + ' is starting ...');
                file.objectId = new Mongo.ObjectID();
                file.uploadStream = sails.hooks.gfs.createWriteStream({
                    _id: file.objectId,
                    filename: file.name,
                    mode: 'w',
                    chunkSize: 1024,
                    content_type: file.mimetype,
                    metadata: {}
                });
                file.uploadStream.on('close', function() {
                    console.log('Write stream closed');
                });
                file.uploadStream.on('error', function(error) {
                    console.error('Write stream error:', error)
                });
            },
            onFileUploadData: function (file, data, req, res) {
                console.log(data.length + ' of ' + file.fieldname + ' arrived');
                Streamifier.createReadStream(data).pipe(file.uploadStream);
            },
            onFileUploadComplete: function (file) {
                console.log(file.fieldname + ' uploaded to  ' + file.path);
                file.uploadStream.end();
            },
            onParseEnd: function (req, next) {
                console.log('Form parsing completed at: ', new Date());

                // call the next middleware
                next();
            }
        })

        /***************************************************************************
         *                                                                          *
         * The body parser that will handle incoming multipart HTTP requests. By    *
         * default as of v0.10, Sails uses                                          *
         * [skipper](http://github.com/balderdashy/skipper). See                    *
         * http://www.senchalabs.org/connect/multipart.html for other options.      *
         *                                                                          *
         ***************************************************************************/

        // bodyParser: require('skipper')

    },

    /***************************************************************************
     *                                                                          *
     * The number of seconds to cache flat files on disk being served by        *
     * Express static middleware (by default, these files are in `.tmp/public`) *
     *                                                                          *
     * The HTTP static cache is only active in a 'production' environment,      *
     * since that's the only time Express will cache flat-files.                *
     *                                                                          *
     ***************************************************************************/

    cache: 604800
};
