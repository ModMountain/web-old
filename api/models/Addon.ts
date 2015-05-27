/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />

//var Promise = require('bluebird');

/**
 * Provides the database model for Addons.
 */
var AddonModel = {
    schema: true,
    attributes: {
        name: {
            type: "string",
            required: true
        },
        price: {
            type: "float",
            required: true,
            min: 0.0,
            max: 1000.0
        },
        gamemode: {
            type: "string",
            required: true
        },
        type: {
            type: "string",
            required: true
        },
        zipFile: {
            type: 'string',
            required: true
        },
        description: {
            type: 'text'
        },
        shortDescription: {
            type: 'string'
        },
        size: {
            type: 'integer'
        },
        instructions: {
            type: 'text'
        },
        explanation: {
            type: 'text',
            required: true
        },
        outsideServers: {
            type: 'boolean',
            required: true
        },
        containsDrm: {
            type: 'boolean',
            required: true
        },
        bannerPath: {
            type: 'string',
        },
        youtubeLink: {
            type: 'string',
        },
        autoUpdaterEnabled: {
            type: 'boolean',
            defaultsTo: false
        },
        configuratorEnabled: {
            type: 'boolean',
            defaultsTo: false
        },
        leakProtectionEnabled: {
            type: 'boolean',
            defaultsTo: false
        },
        statTrackerEnabled: {
            type: 'boolean',
            defaultsTo: false
        },
        discount: {
            type: "float",
            defaultsTo: 0.0,
            max: 0.99,
            min: 0.0
        },
        status: {
            type: "string",
            enum: ['pending', 'approved', 'denied', 'locked', 'published'],
            defaultsTo: 'pending'
        },
        reasonForUpdate: {
            type: "string"
        },
        views: {
            type: 'string',
            defaultsTo: 0,
            min: 0
        },
        downloads: {
            type: 'string',
            defaultsTo: 0,
            min: 0
        },
        featured: {
            type: 'boolean',
            defaultsTo: true
        },
        rawTags: {
            type: 'string',
        },

        // Associations
        author: {
            model: 'User'
        },
        purchasers: {
            collection: 'User',
            via: 'purchases'
        },
        transactions: {
            collection: 'Transaction',
            via: 'addon'
        },
        dependencies: {
            collection: 'Addon',
            via: 'dependents'
        },
        dependents: {
            collection: 'Addon',
            via: 'dependencies'
        },
        comments: {
            collection: 'Comment',
            via: 'addon'
        },
        tags: {
            collection: 'Tag',
            via: 'addons'
        },

        // Four different types of images. Gallery (store page), thin card (home page), wide card (addons page), banner
        // (home page slider)
        galleryImages: {
            type: 'array',
            defaultsTo: []
        },
        thinCardImage: {
            type: 'string',
            required: true
        },
        wideCardImage: {
            type: 'string',
            required: true
        },
        bannerImage: {
            type: 'string'
        },

        /**
         * Determines whether or not a user can download this addon.
         * @param user The user to check.
         * @returns {boolean} Whether or not the user can download the addon.
         */
        canDownload: function (user):Boolean {
            if (this.author === user.id || user.permissionLevel >= 1 || this.price === 0) {
                return true;
            } else {
                for (var i = 0; i < this.purchasers.length; i++) {
                    if (this.purchasers[i].id === user.id) return true;
                }
                return false;
            }
        },

        /**
         * Determines whether or not a user can modify this addon.
         * @param user The user to check.
         * @returns {boolean} Whether or not the user can modify this addon.
         */
        canModify: function (user):Boolean {
            return !!(this.author === user.id || user.permissionLevel >= 2);
        },

        /**
         * @returns {string} This addon's prettified status.
         */
        prettyStatus: function ():String {
            switch (this.status) {
                case 'pending':
                    return 'Pending';
                case 'approved':
                    return 'Approved';
                case 'denied':
                    return 'Denied';
                case 'locked':
                    return 'Locked';
                case 'published':
                    return 'Published';
                default:
                    return "Invalid Status '" + this.status + "'"
            }
        },

        /**
         * @returns {string} This addon's prettified gamemode.
         */
        prettyGamemode: function ():String {
            switch (this.gamemode) {
                case '0':
                    return 'Sandbox Based';
                case '1':
                    return 'Dark RP';
                case '2':
                    return 'TTT';
                case '3':
                    return 'Murder';
                case '4':
                    return 'Other';
                default:
                    return "Invalid Gamemode '" + this.gamemode + "'";
            }
        },

        /**
         * @returns {string} This addon's prettified type.
         */
        prettyType: function ():String {
            switch (this.type) {
                case '0':
                    return 'Weapon';
                case '1':
                    return 'Chatbox';
                case '2':
                    return 'Utility';
                case '3':
                    return 'Other';
                default:
                    return "Invalid Type '" + this.type + "'"
            }
        },

        /**
         * @returns {string} This addon's prettified tags.
         */
        prettyTags: function ():String {
            var returnString = "";
            var splitTags = this.rawTags.split(',');
            splitTags.forEach(function (tag) {
                returnString += tag;
                returnString += ", ";
            });
            // Remove the extra comma before returning
            return returnString.slice(0, -2);
        },

        /**
         * Increments the total addon count for each tag attached to this addon.
         * Intended to be used when an addon is published.
         * @param cb The callback to run once the tags have been incremented.
         */
        incrementTags: function (cb) {
            // Get the addon's tags in raw format and then parse them into models
            var tagArray:Array<String> = this.rawTags.split(',');
            var findPromises = [];
            tagArray.forEach(function (tag) {
                findPromises.push(Tag.findOrCreate({name: tag.trim()}));
            });
            console.log(Promise);
            // Wait for all of our queries to complete
            Promise.all(findPromises)
                .then(function (tags) {
                    // Update every tag with the new addon total
                    var updatePromises = [];
                    tags.forEach(function (tag) {
                        tag.totalAddons++;
                        updatePromises.push(tag.save());
                    });
                    // When the updates complete, fire our callback
                    Promise.all(updatePromises).then(cb);
                });
        },

        /**
         * Decrements the total addon count for each tag attached to this addon.
         * Intended to be used when an addon is unpublished.
         * @param cb The callback to run once the tags have been decremented.
         */
        decrementTags: function (cb) {
            // Get the addon's tags in raw format and then parse them into models
            var tagArray:Array<String> = this.rawTags.split(',');
            var findPromises = [];
            tagArray.forEach(function (tag) {
                findPromises.push(Tag.findOne({name: tag.trim()}));
            });
            // Wait for all of our queries to complete
            Promise.all(findPromises)
                .then(function (tags) {
                    // Update every tag with the new addon total
                    var updatePromises = [];
                    tags.forEach(function (tag) {
                        if (tag !== undefined) {
                            tag.totalAddons--;
                            updatePromises.push(tag.save());
                        }
                    });
                    // When the updates complete, fire our callback
                    Promise.all(updatePromises).then(cb);
                });
        }
    },

    beforeDestroy: function (criteria, cb:Function) {
        Addon.findOne(criteria.where.id)
            .then(function (addon) {
                sails.hooks.gfs.exist({_id: addon.zipFile}, function (err:Error, found:Boolean) {
                        console.log("Exist results:", err, found);
                        if (err) {
                            PrettyError(err, 'An error occurred during sails.hooks.gfs.exist inside Addon.beforeDestroy');
                            cb(err)
                        } else if (found) {
                            sails.hooks.gfs.remove({_id: addon.zipFile}, function (err:Error) {
                                if (err) PrettyError(err, 'An error occurred during sails.hooks.gfs.exist inside Addon.beforeDestroy');
                                cb()
                            });
                        } else {
                            cb()
                        }
                    }
                );
            });

    }
};

module.exports = AddonModel;