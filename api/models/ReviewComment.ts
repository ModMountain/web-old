/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />

var ReviewCommentModel = {
    schema: true,
    attributes: {
        body: {
            type: 'string',
            required: true
        },
        author: {
            model: 'User',
            required: true
        },
        parent: {
            collection: 'Review',
            via: 'children'
        }
    }
};

module.exports = ReviewCommentModel;