/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />

var UserModel = {
    schema: true,
    attributes: {
        username: {
            type: 'string',
            required: true,
            minLength: 1,
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
	    status: {
		    type: 'number',
		    defaultsTo: User.Status.ACTIVE
	    },
        permissionLevel: { // 0 is user, 1 is moderator, 2 is administrator
            type: 'integer',
            defaultsTo: 0,
            min: 0,
            max: 2
        },
        paypalEmail: {
            type: 'email'
        },
        balance: {
            type: 'integer',
            defaultsTo: 0
        },
	    suspensionReason: {
		    type: 'string'
	    },
	    bannedReason: {
		    type: 'string'
	    },
	    bio: {
		    type: 'string',
        defaultsTo: ''
	    },

        // Associations
        addons: {
            collection: 'Addon',
            via: 'author'
        },
        purchases: {
            collection: 'Addon',
            via: 'purchasers'
        },
        reviews: {
            collection: 'Review',
            via: 'author'
        },
        reviewComments: {
            collection: 'ReviewComment',
            via: 'author'
        },
        transactions: {
            collection: 'Transaction',
	        via: 'sender'
        },
	    social: {
		    type: 'json',
		    defaultsTo: {}
	    },
        reports: {
            collection: 'Report',
            via: 'reporter'
        },
        conversations: {
            collection: 'Conversation',
            via: 'participants'
        },
      notifications: {
        collection: 'Notification',
        via: 'user'
      },
      notificationIgnoreLevel: {
        type: 'number',
        defaultsTo: -1
      },

        // Instance methods
        isModerator: function () {
            return this.permissionLevel >= 1
        },
        isAdministrator: function () {
            return this.permissionLevel >= 2
        },
	    prettyStatus: function() {
		    switch (this.status) {
			    case User.Status.ACTIVE:
				    return 'Active';
			    case User.Status.SUSPENDED:
				    return 'Suspended';
			    case User.Status.BANNED:
				    return 'Banned';
			    default:
				    return "Unknown"
		    }
	    },
	    getProfileCompleteness: function() {
		    var completeness = 0;
		    if (this.bio.length > 140) completeness += 30;
		    if (this.email !== undefined) completeness += 40;
		    if (this.steamIdentifier !== undefined) completeness += 10;
			if (Object.keys(this.social).length >= 1) completeness += 10;
			if (Object.keys(this.social).length >= 2) completeness += 10;

		    return completeness;
	    },
	    getReputation: function() {
		    return 100;
	    }
    },

	beforeValidate: function(user, cb) {
		if (typeof user.status === 'string') user.status = parseInt(user.status);
		if (typeof user.notificationIgnoreLevel === 'string') user.notificationIgnoreLevel = parseInt(user.notificationIgnoreLevel);
		cb();
	}
};

module.exports = UserModel;
