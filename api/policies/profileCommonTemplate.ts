/// <reference path='../../typings/node/node.d.ts' />

module.exports = function (req, res, next) {
    User.findOne(req.user.id)
        .populateAll()
        .then(function (user) {
            user.tickets = [];
            user.sentTickets.concat(user.receivedTickets).forEach(function (ticket) {
                if (ticket.status !== 'closed') {
                    user.tickets.push(ticket)
                }
            });

            res.locals.user = user;
            req.user = user;
            next();
        })
        .catch(function(err) {
            next(err);
        });
};