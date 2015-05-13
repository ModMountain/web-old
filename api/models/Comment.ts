/// <reference path='../../typings/node/node.d.ts' />

var Comment = {
    schema: true,
    attributes: {
        body: {
            type: "string",
            required: true
        },

        // Associations
        author: {
            model: 'User',
            required: true
        },
        addon: {
            model: 'Addon',
            required: true
        },
        parent: {
            model: 'Comment',
        },
        children: {
            collection: 'Comment',
            via: 'parent'
        },

        isTopLevel: function () {
            return (this.parent === undefined || this.parent === null);
        }
    }
};

module.exports = Comment;