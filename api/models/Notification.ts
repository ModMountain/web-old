/// <reference path='../../typings/node/node.d.ts' />

var NotificationModel = {
    schema: true,
    attributes: {
        receiver: {
            model: 'User',
            required: true,
            via: 'Notifications'
        },
        priority: {
            enum: ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'],
            required: true
        },
        message: {
            type: 'string',
            required: true
        }
    }
};

module.exports = NotificationModel;