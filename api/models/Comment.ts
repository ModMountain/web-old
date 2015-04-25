/// <reference path='../../typings/node/node.d.ts' />

var Comment = {
    schema: true,
    attributes: {
        body: {
            type: "string",
            required: true
        },
        isToplevel: {
            type: 'boolean',
            required: true
        },

        // Associations
        author: {
            model: 'User',
            required: true
        },
        addon: {
            collection: 'Addon',
            required: true
        },
        children: {
            collection: 'Comment'
        }
    }
};

module.exports = Comment;