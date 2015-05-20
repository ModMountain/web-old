/// <reference path='../../typings/node/node.d.ts' />

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
            category: {
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
            galleryImagePaths: {
                type: 'string',
            },
            youtubeVideos: {
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

            canDownload: function (user) {
                return !!(this.author == user.id || user.permissionLevel >= 1);
            },

            canModify: function (user) {
                return !!(this.author == user.id || user.permissionLevel >= 2);
            },

            prettyStatus: function () {
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
                }
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
    }
    ;

module.exports = AddonModel;