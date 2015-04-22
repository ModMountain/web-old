/// <reference path='../../typings/node/node.d.ts' />
var User = {
    schema: true,
    attributes: {
        username: {
            type: 'string',
            required: true,
            minLength: 4,
            maxLength: 50
        },
        email: {
            type: 'email'
        },
        steamIdentifier: {
            type: 'string',
            required: true
        },
        steamProfile: {
            type: 'json',
            required: true
        },
        banned: {
            type: 'boolean',
            defaultsTo: false
        },
        permissionLevel: {
            type: 'integer',
            defaultsTo: 0,
            min: 0,
            max: 2
        },
        // Associations
        addons: {
            collection: 'Addon'
        },
        jobs: {
            collection: 'Job'
        },
        transactions: {
            collection: 'Transaction'
        },
        // Instance methods
        isModerator: function () {
            return this.permissionLevel >= 1;
        },
        isAdministrator: function () {
            return this.permissionLevel >= 2;
        }
    }
};
module.exports = User;
//# sourceMappingURL=User.js.map