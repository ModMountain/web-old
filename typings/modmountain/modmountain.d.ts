/// <reference path="../node/node.d.ts" />
/// <reference path="../gridfs-stream/gridfs-stream.d.ts" />

declare function PrettyError(error: Error, message: String, callback?: Function): void;

declare var sails: {
  hooks: {
      gfs:Grid
  };
};

declare var Addon: {
    findOne(id:String);
    findOne(id:Object);
};

declare var Tag: {
    findOne(id:String);
    findOne(id:Object);
    findOrCreate(findCriteria:Object, createCriteria?:Object);
};