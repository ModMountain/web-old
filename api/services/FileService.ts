/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />

var Mongo = require('mongodb');
var GM = require('gm');
var FS = require('fs');

var Service = {
  preprocessFile: function(file) {
    file.objectId = new Mongo.ObjectID();
  },

  processFile: function (file) {
    // If the file is an image we will process it differently
    if (file.mimetype.startsWith('image/')) {
      switch (file.fieldname) {
        case 'cardImage':
          return FileService.processImage(file, 400, 600);
        case 'bannerImage':
          return FileService.processImage(file, 1920, 500);
        case 'galleryImages':
          return FileService.processImage(file, 600, 600);
      }
    }

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

  processImage: function (file, width, height) {
    // Multer will pass data chunks into here
    var imageStream = GM(file.path)
      .resize(width, height, "!")
      .minify()
      .noProfile()
      .stream();

    // GM will pass its chunks into here
    var gfsStream = sails.hooks.gfs.createWriteStream({
      _id: file.objectId,
      filename: file.name,
      mode: 'w',
      chunkSize: 1024 * 1024,
      content_type: file.mimetype,
    });

    // Event handlers
    gfsStream.once('close', function () {
      FS.unlink(file.path);
    });
    gfsStream.on('error', function (error) {
      PrettyError(error, "Error occurred during file streaming operation inside FileService.processImage");
      FS.unlink(file.path);
    });

    // Pipe the image into GridFS
    imageStream.pipe(gfsStream);
  }
};

module.exports = Service;
