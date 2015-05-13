/// <reference path='../../typings/node/node.d.ts' />

var Transaction = {
    schema: true,
    attributes: {
        user: {
            model: 'User',
            required: true
        },
        addon: {
            model: 'Addon',
            required: true
        }
    }
};

module.exports = Transaction;