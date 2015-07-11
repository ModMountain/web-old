/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />

var AddonVersionModel = {
  schema: true,
  attributes: {
    addon: {
      model: "Addon",
      via: "versions",
      required: true
    },
    versionNumber: {
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
    explanation: {
      type: "string",
      required: true
    },
    // Whether or not the addon makes calls to outside servers. Shown to users to keep them informed.
    outsideServers: {
      type: 'boolean',
      required: true
    },
    // Whether or not the addon contains DRM or any sort of tracker. Shown to users to keep them informed.
    containsDrm: {
      type: 'boolean',
      required: true
    },
    // Whether or not Mod Mountain should automatically update this addon, if possible.
    autoUpdaterEnabled: {
      type: 'boolean',
      defaultsTo: false
    },
    // Whether or not the Mod Mountain configurator is enabled for this addon.
    configuratorEnabled: {
      type: 'boolean',
      defaultsTo: false
    },
    // Whether or not Mod Mountain leak protection (unique obfuscation) is enabled for this addon.
    leakProtectionEnabled: {
      type: 'boolean',
      defaultsTo: false
    },
    // Whether or not the Mod Mountain stat tracking is enabled for this addon.
    statTrackerEnabled: {
      type: 'boolean',
      defaultsTo: false
    }
  }
};

module.exports = AddonVersionModel;
