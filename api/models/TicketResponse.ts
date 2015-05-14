/// <reference path='../../typings/node/node.d.ts' />

var TicketResponse = {
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

module.exports = TicketResponse;