/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />

var TicketResponseModel = {
    schema: true,
    attributes: {
        user: {
            model: 'User',
            required: true
        },
        content: {
            type: 'string',
            required: true
        },
        ticket: {
            model: 'Ticket',
            required: true
        }
    }
};

module.exports = TicketResponseModel;