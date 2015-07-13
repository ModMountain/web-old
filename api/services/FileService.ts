/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />

var Mongo = require('mongodb');
var GM = require('gm');
var FS = require('fs');

var Service = {
  preprocessFile: function (file) {
    file.objectId = new Mongo.ObjectID();
  },

  processFile: function (file) {
    // Otherwise we will process it normally
    var gfsStream = sails.hooks.gfs.createWriteStream({
      _id: file.objectId,
      filename: file.name,
      mode: 'w',
      chunkSize: 1024 * 1024,
      content_type: file.mimetype,
    });
    gfsStream.once('close', function () {
      FS.unlink(file.path);
    });
    gfsStream.on('error', function (error) {
      PrettyError(error, "Error occurred during file streaming operation inside FileService.processFile");
      FS.unlink(file.path);
    });
    FS.createReadStream(file.path).pipe(gfsStream);
  },

  modifyImage: function (image:Addon.Image, type:Addon.Image.Type, krake:boolean):Promise<any> {
    return new Promise(function (resolve, reject) {
      // Determine the width and height based on the type
      var width, height;
      switch (type) {
        case Addon.Image.Type.HIGHLIGHT: width = 550; height = 550; break;
        case Addon.Image.Type.BANNER: width = 1920; height = 500; break;
        case Addon.Image.Type.CARD: width = 400; height = 600; break;
        case Addon.Image.Type.NORMAL: return reject(new Error("Cannot modify an image into a normal one"));
      }

      // Locate the original copy of the image
      sails.hooks.gfs.findOne({_id: image.originalId}, function (err, file) {
	      if (err) return reject(err);
        else if (!file) return reject(new Error("File with object id " + image.originalId + " not found"));

        // Create our GridFS read and write streams
        var readStream = sails.hooks.gfs.createReadStream({_id: image.originalId});
        readStream.once('error', reject);

        var newId = new Mongo.ObjectID();
        var writeStream = sails.hooks.gfs.createWriteStream({
          _id: newId,
          filename: file.name,
          mode: 'w',
          chunkSize: 1024 * 1024,
          content_type: file.mimetype
        });
        writeStream.once('error', reject);
        if (krake) { // Use Kraken.io
          //TODO https://github.com/kraken-io/kraken-node#how-to-use
        } else { // Use Graphics Magick
          GM(readStream)
            .resize(width, height, "!")
            .noProfile()
            .stream()
            .pipe(writeStream)
            .once('close', () => resolve(newId))
            .once('error', reject)
        }
      });
    });
  },

  sendFile: function (objectId, res) {
    // Get the file and it's metadata from GridFS
    sails.hooks.gfs.findOne({_id: objectId}, function (err, file) {
      if (err) {
        PrettyError(err, 'An error occurred during gfs.exist inside FileService.sendFile');
        res.send(500);
      } else if (!file) {
        res.send(404);
      }
      else {
        // Build the response
        res.type(file.contentType);
        res.set({
          'Content-Disposition': 'inline; filename="' + file.filename + '"',
          'Content-Length': file.length,
          'ETag': file.md5,
          'Cache-Control': "public, max-age=" + 60 * 60 * 24 * 30
        });
        sails.hooks.gfs.createReadStream({
          _id: objectId,
          chunkSize: 1024 * 1024
        }).once('error', function (err) {
          PrettyError(err, "An error occurred during gfs.createReadStream inside FileService.sendFile");
          res.serverError();
        }).pipe(res)
      }
    });
  },

  removeFile: function (objectId) {
    return new Promise(function (resolve, reject) {
      sails.hooks.gfs.remove({_id: objectId}, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(err);
        }
      });
    });
  },

  removeOldImage: function (image) {
    var clone = _.assign({}, image);
    return new Promise(function (resolve, reject) {
      // Do not delete the original image
      if (clone.objectId === clone.originalId) resolve(null);
      else {
        sails.hooks.gfs.remove({_id: clone.objectId}, function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(err);
          }
        });
      }
    });
  }
};

module.exports = Service;
