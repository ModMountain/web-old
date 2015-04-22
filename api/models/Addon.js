/// <reference path='../../typings/node/node.d.ts' />
var Addon = {
    schema: true,
    attributes: {
        name: {
            type: "string",
            required: true
        },
        description: {
            type: "text",
            required: true
        },
        fileLocation: {
            type: "string",
            required: true
        },
        price: {
            type: "integer",
            required: true
        },
        discount: {
            type: "float",
            defaultsTo: 0.0,
            max: 0.99,
            min: 0.0
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
        }
    }
};
module.exports = Addon;
//# sourceMappingURL=Addon.js.map