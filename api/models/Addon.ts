/// <reference path='../../typings/node/node.d.ts' />

var Addon = {
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
            collection: 'User'
        },
        transactions: {
            collection: 'Transaction'
        },
        dependencies: {
            collection: 'Addon'
        },
        comments: {
            collection: 'Comment'
        },

        canDownload: function(user) {
            if (this.author == user.id) return true;
            else return false;
        }
    }
};

module.exports = Addon;