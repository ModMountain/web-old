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
      via: 'conversations',
      required: true
    },
    messages: {
      type: 'array',
      defaultsTo: []
    },

    addMessage: function (user:User, body:string):Promise<any[]> {
      var message = {
        user: user.id,
        body: body,
        date: new Date()
      };
      this.messages.push(message);
      return this.save().then(() => {
        return message
      });
    },

    isParticipant: function(user:User):boolean {
      for (var i = 0; i < this.participants.length; i++) {
        if (this.participants[i] === user.id || this.participants[i].id === user.id) return true;
      }
      return false;
    }
  }
};

module.exports = ConversationModel;
