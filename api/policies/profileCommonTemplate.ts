/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/lodash/lodash.d.ts' />

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
            console.log(user.receivedTransactions, user.sentTransactions)
            user.transactions = _.union(user.receivedTransactions, user.sentTransactions);

            res.locals.user = user;
            req.user = user;
            next();
        })
        .catch(function(err) {
            next(err);
        });
};