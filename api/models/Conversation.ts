/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />

var ConversationModel = {
    schema: true,
    attributes: {
        title: {
            type: 'string',
            required: true
        },
	    participants: {
            collection: "User",
            via: 'conversations'
        },
	    messages: {
		    type: 'array',
		    defaultsTo: []
	    },

	    addMessage: function(user:User, body:string):Promise<void> {
			this.messages.push({
				user: user.id,
				body: body,
				date: Date.now()
			});
		    return this.save();
	    }
    }
};

module.exports = ConversationModel;