/// <reference path='../../typings/node/node.d.ts' />

var TagModel = {
        schema: true,
        attributes: {
            name: {
                type: "string",
                required: true,
                unique: true
            },

            totalAddons: {
                type: "integer",
                defaultsTo: 0
            },

            // Associations
            addons: {
                collection: 'Addon',
                via: 'tags'
            }
        }
    };

module.exports = TagModel;