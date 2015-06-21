/// <reference path='../typings/node/node.d.ts' />
/// <reference path='../typings/modmountain/modmountain.d.ts' />

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
      if (req.user === undefined) req.user = {};
      else res.locals.user = req.user;
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
      inMemory: false,
      putSingleFilesInArray: true,
      rename: function (fieldname, filename) {
        return Crypto.createHash('md5').update(fieldname + filename + Date.now()).digest('hex');
      },
      onFileUploadStart: function (file) {
        FileService.preprocessFile(file);
      },
      onFileUploadComplete: function (file) {
        FileService.processFile(file);
      },
      onError: function (error, next) {
        console.error(error);
        next(error);
      },
      onFileSizeLimit: function () {
        console.error("File size limit reached");
      },
      onFilesLimit: function () {
        console.error("Files limit reached");
      },
      onFieldsLimit: function () {
        console.error("Form fields limit reached");
      },
      onPartsLimit: function () {
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
