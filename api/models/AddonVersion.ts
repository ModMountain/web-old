/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />
/// <reference path='../../typings/lodash/lodash.d.ts' />

var AddonVersionModel = {
  schema: true,
  attributes: {
    addon: {
      model: "Addon",
      via: "versions",
      required: true
    },
    number: {
      type: "string",
      required: true
    },
    file: {
      type: "string",
      required: true
    },
    size: {
      type: "number",
      required: true
    },
    downloads: {
      type: "number",
      defaultsTo: true
    },
    approved: {
      type: 'boolean',
      defaultsTo: false
    }
  },

  beforeValidate: function(addonVersion, cb) {
    _.keys(addonVersion).forEach(function(key) {
	    var prop = addonVersion[key];
      if (typeof prop === 'string' && !isNaN(prop)) addonVersion[key] = parseFloat(prop);
    });

    cb();
  }
};

module.exports = AddonVersionModel;
