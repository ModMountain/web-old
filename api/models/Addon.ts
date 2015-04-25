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
        filePath: {
            type: 'string',
            required: true
        },
        description: {
            type: 'text',
            required: true
        },
        instructions: {
            type: 'text',
            required: true
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
            required: true
        },
        galleryImagePaths: {
            type: 'string',
            required: true
        },
        youtubeVideos: {
            type: 'string',
            required: true
        },
        autoUpdaterEnabled: {
            type: 'boolean',
            required: true
        },
        configuratorEnabled: {
            type: 'boolean',
            required: true
        },
        leakProtectionEnabled: {
            type: 'boolean',
            required: true
        },
        statTrackerEnabled: {
            type: 'boolean',
            required: true
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
            type: 'number',
            defaultsTo: 0,
            min: 0
        },
        downloads: {
            type: 'number',
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
        }
    }
};

module.exports = Addon;