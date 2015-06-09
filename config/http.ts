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
var Mongo = require('mongodb');

module.exports.http = {
    middleware: {
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
                    chunkSize: 1024 * 1024,
                    content_type: file.mimetype,
                });
                file.uploadStream.once('close', function() {
                    console.log('Write stream closed after writing ' + file.chunks + ' chunks to GridFS');
                });
                file.uploadStream.on('error', function(error) {
                    console.error('Write stream error:', error);
                });
                file.chunks = 0;
                file.dataChunks = 0;
            },
            onFileUploadData: function (file, data, req, res) {
                file.dataChunks++;
                file.uploadStream.write(data, function() {
                    file.chunks++;
                });
            },
            onFileUploadComplete: function (file) {
                console.log(file.fieldname + ' uploaded to  ' + file.path + ' in ' + file.dataChunks + ' chunks');
                file.uploadStream.end()
            },
            onParseEnd: function (req, next) {
                console.log('Form parsing completed at: ', new Date());

                // call the next middleware
                next();
            },
            onError: function(error, next) {
                console.error(error);
                next(error);
            },
            onFileSizeLimit: function() {
                console.error("File size limit reached");
            },
            onFilesLimit: function() {
                console.error("Files limit reached");
            },
            onFieldsLimit: function() {
                console.error("Form fields limit reached");
            },
            onPartsLimit: function() {
                console.error("Parts limit reached");
            }
        }),
	    static: require('st')({
		    path: '.tmp/public/',
		    url: 'assets/',
		    cache: false,
		    index: true // Show directory listings
	    })
    }
};
