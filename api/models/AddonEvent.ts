/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />

var AddonVersionModel = {
  schema: true,
  attributes: {
    name: {
      type: "string",
      required: true
    },
    addon: {
      model: "addon",
      required: true
    },
    data: {
      type: "object",
      required: true
    },
    source: {
      type: "object",
      required: true
    }
  }
};

module.exports = AddonVersionModel;
