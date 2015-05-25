/// <reference path='../../../../typings/jquery/jquery.d.ts' />

$(function () {
    // jQuery selectors
    var purchaseBtn = $("#purchaseButton");

    // Configure Stripe
    var handler = StripeCheckout.configure({
        key: '***REMOVED***',
        //image: '/img/marketplace.png',
        token: function (token) {
            console.log("Got token, posting it to server via socket.io");
            io.socket.post('/addons/' + window.addon.id + "/purchase", {
                tokenId: token.id,
                type: token.type,
                addonId: window.addon.id
            });
        }
    });

    purchaseBtn.on('click', function (event) {
        var chargeAmount;
        if (window.addon.price === 0) chargeAmount = 500;
        else chargeAmount = window.addon.price * 100;
        // Open Checkout with further options
        handler.open({
            name: 'Mod Mountain',
            description: "Donation to '" + window.addon.name + "'",
            currency: "usd",
            amount: 500,
            bitcoin: true
        });
        event.preventDefault();
    });

    // Close Checkout on page navigation
    $(window).on('popstate', function () {
        handler.close();
    });
});