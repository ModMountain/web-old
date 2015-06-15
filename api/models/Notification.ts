/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />

var NotificationModel = {
  schema: true, attributes: {
    user: {
      model: 'User', required: true, via: 'notifications'
    }, priority: {
      type: 'number', required: true
    }, message: {
      type: 'string', required: true
    }, link: {
      type: 'string', required: true
    },

    prettyPriority: function ():string {
      switch (this.priority) {
        case Notification.Priority.LOW:
          return 'Low';
        case Notification.Priority.MEDIUM:
          return 'Medium';
        case Notification.Priority.HIGH:
          return 'High';
        case Notification.Priority.EMERGENCY:
          return 'Emergency';
        default:
          return 'Invalid Priority'
      }
    }
  },

  beforeValidate: function(user, cb) {
    if (typeof user.priority === 'string') user.priority = parseInt(user.priority);
    cb();
  }
};

module.exports = NotificationModel;
