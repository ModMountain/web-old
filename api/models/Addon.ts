/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />

/**
 * Provides the database model for Addons.
 */
var AddonModel = {
    schema: true,
    attributes: {
        // The formal name of the addon. This will show up in notifications and transactions.
        name: {
            type: "string",
            required: true
        },
        // A price of 0.0 implies that the addon is free.
        price: {
            type: "float",
            required: true,
            min: 0.0,
            max: 1000.0
        },
        // How much the addon is discounted. This is a percentage from 1% to 99%.
        discount: {
            type: "float",
            defaultsTo: 0.0,
            max: 0.99,
            min: 0.0
        },
        gamemode: {
            type: "string",
            required: true
        },
        type: {
            type: "string",
            required: true
        },
        // Contains the ObjectID of the addon's zip file record in GridFS
        zipFile: {
            type: 'string',
            required: true
        },
        // The file size of the addon in bytes. Populated by Multer (see config/http.ts) when the addon is created.
        size: {
            type: 'integer',
            required: true
        },
        // One to two sentences quickly describing the addon.
        shortDescription: {
            type: 'string',
            required: true
        },
        // The full description for the addon in Markdown format.
        description: {
            type: 'text',
            required: true
        },
        // The addon described in a few sentences. This is only seen by staff and is used during the approval process.
        explanation: {
            type: 'text',
            required: true
        },
        // When the addon is updated by the author, this field will be populated. It tells staff why it was updated.
        reasonForUpdate: {
            type: "string"
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
        // A link to Youtube video showcasing the addon. The video will be embedded on the addon's store page.
        youtubeLink: {
            type: 'string',
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
        },
        // The status of this addon. Prettified using prettyStatus().
        status: {
            type: "string",
            enum: ['pending', 'approved', 'denied', 'locked', 'published'],
            defaultsTo: 'pending'
        },
        // How many pageviews this addon has received
        views: {
            type: 'string',
            defaultsTo: 0,
            min: 0
        },
        // How many times this addon has been downloaded
        downloads: {
            type: 'string',
            defaultsTo: 0,
            min: 0
        },
        // Whether or not this addon is featured on the home page
        featured: {
            type: 'boolean',
            defaultsTo: true
        },
        // The addon's tags in raw (comma separated) format
        rawTags: {
            type: 'string',
        },
        // The user that created this addon
        author: {
            model: 'User'
        },
        // The users that have purchased this addon
        purchasers: {
            collection: 'User',
            via: 'purchases'
        },
        // All transactions related to this addon (purchases, donations, and refunds)
        transactions: {
            collection: 'Transaction',
            via: 'addon'
        },
        // What addons this addon needs installed to function
        dependencies: {
            collection: 'Addon',
            via: 'dependents'
        },
        // What addons require this addon to function
        dependents: {
            collection: 'Addon',
            via: 'dependencies'
        },
        // The comments by users on this addon
        comments: {
            collection: 'Comment',
            via: 'addon'
        },
        // The addon's tags
        tags: {
            collection: 'Tag',
            via: 'addons'
        },
        // The images shown on the addon's store page, stored as an array of GridFS ObjectIDs
        galleryImages: {
            type: 'array',
            defaultsTo: []
        },
        // The image shown on the home page (featured or latest addon), stored as a GridFS ObjectID
        thinCardImage: {
            type: 'string',
            required: true
        },
        // The image shown on the addons page, stored as a GridFS ObjectID
        wideCardImage: {
            type: 'string',
            required: true
        },
        // The image shown on the home page slider, stored as a GridFS ObjectID
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

    /**
     * Waterline lifecycle method. Ensures that all files attached to this addon are removed from GridFS when the addon
     * is destroyed.
     * @param criteria
     * @param cb
     */
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