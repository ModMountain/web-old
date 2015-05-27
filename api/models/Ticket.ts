/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />

var TicketModel = {
    schema: true,
    attributes: {
        title: {
            type: "string",
            required: true
        },
        priority: {
            type: 'string',
            enum: ['low', 'high', 'emergency'],
            defaultsTo: 'low'
        },
        status: {
            type: 'string',
            enum: ['submitterResponse', 'handlerResponse', 'closed'],
            defaultsTo: 'submitterResponse'
        },
        submitter: {
            model: 'User',
            required: true
        },
        responses: {
            collection: 'TicketResponse',
            via: 'ticket'
        },
        handler: {
            model: 'User'
        },
        affectedAddon: {
            model: 'Addon'
        },

        canClose: function (user) {
            return !!(this.submitter == user.id || user.permissionLevel == 2);
        },
        canRespond: function (user) {
            return !!(this.submitter == user.id || this.handler == user.id || user.permissionLevel >= 1);
        },
        addResponse: function (user, content:String) {
            var _this = this;
            return TicketResponse.create({
                user: user,
                content: content,
                ticket: this.id
            }).then(function (ticketResponse) {
                _this.responses.add(ticketResponse);
            }).then(function () {
                if (_this.submitter === user.id) _this.status = 'submitterResponse';
                else _this.status = 'handlerResponse';
                return _this.save()
            });
        },

        prettyStatus: function () {
            switch (this.status) {
                case 'submitterResponse':
                    return 'Response Sent';
                case 'handlerResponse':
                    return 'Response Required';
                case 'closed':
                    return 'Closed';
            }
        }
    }
};

module.exports = TicketModel;