/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />

var TagModel = {
  schema: true,
  attributes: {
    name: {
      type: "string",
      required: true,
      unique: true
    },
    totalAddons: {
      type: "integer",
      defaultsTo: 0
    },
    addons: {
      collection: 'Addon',
      via: 'tags'
    }
  },

  getPopularTags: function() {
    return this.find({totalAddons: {'>': 0}}).sort({totalAddons: 'desc'}).limit(10)
  }
};

module.exports = TagModel;
