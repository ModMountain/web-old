/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />

var ReviewModel = {
    schema: true,
    attributes: {
        body: {
            type: "string",
            required: true
        },
        author: {
            model: 'User',
            required: true
        },
        addon: {
            model: 'Addon',
            required: true
        },
        children: {
            collection: 'ReviewComment',
            via: 'parent'
        }
    }
};

module.exports = ReviewModel;