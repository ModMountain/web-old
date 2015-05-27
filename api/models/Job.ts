/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />

var JobModel = {
    schema: true,
    attributes: {
        title: {
            type: "string",
            required: true
        },
        description: {
            type: "text",
            required: true
        },
        budget: {
            type: "integer",
            required: true
        },
        timeFrame: {
            type: "integer",
            required: true
        },
        inProgress: {
            type: "boolean",
            required: true
        },

        // Associations
        poster: {
            model: 'User',
            required: true
        },
        worker: {
            model: 'User'
        }
    }
};

module.exports = JobModel;