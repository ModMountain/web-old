/// <reference path='../../typings/node/node.d.ts' />

var User = {
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
            model: 'User'
        },
        worker: {
            model: 'User'
        }
    }
};

module.exports = User;