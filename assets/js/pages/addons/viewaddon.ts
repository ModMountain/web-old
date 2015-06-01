/// <reference path='../../../../typings/jquery/jquery.d.ts' />

$(function () {
    // jQuery selectors
    var $purchaseButton = $("#purchaseButton");
	var $couponInput = $("#couponInput");
	var $couponLabel = $("#couponLabel");
	var $couponNote = $("#couponNote");
	var $totalBill = $("#totalBill");
	var $checkoutButton = $("#checkoutButton");
	var finalBill = addon.price;

	var $payWithAccountBalanceCheckbox = $("#payWithAccountBalance");
	var $payWithPayPalCheckbox = $("#payWithPayPal");
	var $payWithStripeCheckbox = $("#payWithCreditCard");

	// Coupon logic
	var couponTimer;
	var coupon;
	$couponInput.on('change keydown paste input', function() {
		if (couponTimer !== null) clearTimeout(couponTimer);
		couponTimer = setTimeout(function() {
			io.socket.post('/addons/' + window.addon.id + '/validateCoupon', {
				couponCode: $couponInput.val()
			})
		}, 200);
	});

	io.socket.on('couponValidated', function(data) {
		coupon = data;
		if ($couponInput.val() === '') {
			$couponLabel.removeClass('state-success');
			$couponLabel.removeClass('state-error');
			$couponNote.removeClass('note-success');
			$couponNote.removeClass('note-error');
			$couponNote.html("");
			finalBill = window.addon.price;
		} else if (data === null) {
			$couponLabel.removeClass('state-success');
			$couponLabel.addClass('state-error');
			$couponNote.removeClass('note-success');
			$couponNote.addClass('note-error');
			$couponNote.html("That coupon does not exist.");
			finalBill = window.addon.price;
		} else if (data.expired) {
			$couponLabel.removeClass('state-success');
			$couponLabel.addClass('state-error');
			$couponNote.removeClass('note-success');
			$couponNote.addClass('note-error');
			$couponNote.html("That coupon has expired.");
			finalBill = window.addon.price;
		} else {
			$couponLabel.addClass('state-success');
			$couponLabel.removeClass('state-error');
			$couponNote.addClass('note-success');
			$couponNote.removeClass('note-error');
			if (data.type === 0) {
				$couponNote.html("Valid for " + data.amount + "% off.");
				finalBill = window.addon.price * (1.0 - data.amount / 100);
			} else {
				$couponNote.html("Valid for $" + data.amount + " off.");
				finalBill = window.addon.price - data.amount;
				$totalBill.text();
			}
		}

		if (finalBill <= 0) {
			finalBill = 0;
			$totalBill.text('Free');
		}
		else $totalBill.text('$' + finalBill + ' usd');
	});

	$purchaseButton.on('click', function (event) {
		$('#paymentModal').modal('show');
        event.preventDefault();
    });

	$checkoutButton.on('click', function(event) {
		// This is a donation, therefore we need to make sure they entered an amount
		if (window.addon.price === 0 && finalBill === 0) {
			alert("You must enter an amount into the donation input!")
		} else {
			if (finalBill === 0 || $payWithAccountBalanceCheckbox.is(':checked')) checkoutWithAccountBalance();
			else if ($payWithPayPalCheckbox.is(':checked')) checkoutWithPayPal();
			else if ($payWithStripeCheckbox.is(':checked')) checkoutWithStripe();
			else {
				console.log('invalid payment method specifed')
			}
		}

		event.preventDefault();
	});

	var checkoutWithAccountBalance = function() {

	};

	var checkoutWithPayPal = function() {

	};

	var checkoutWithStripe = function() {
		// Set the description
		var description;
		if (window.addon.price === 0) description = "Donation to '" + window.addon.name + "'";
		else description = "License for '" + window.addon.name + "'";

		// Configure Stripe
		var handler = StripeCheckout.configure({
			key: '***REMOVED***',
			token: function (token) {
				io.socket.post('/addons/' + window.addon.id + '/stripeCheckout', {
					tokenId: token.id,
					type: token.type,
					addonId: window.addon.id,
					finalBill: finalBill * 100,
					coupon: coupon,
					description: description
				});
			}
		});

		// Close Checkout on page navigation
		$(window).on('popstate', function () {
			handler.close();
		});

		// Open Checkout with further options
		handler.open({
			name: 'Mod Mountain',
			description: description,
			currency: "usd",
			amount: finalBill * 100
		});
	}
});