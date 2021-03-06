/// <reference path='../../../../typings/jquery/jquery.d.ts' />
/// <reference path='../../../../typings/modmountain/modmountain.d.ts' />

$(function () {
	// jQuery selectors
	var $purchaseButton = $("#purchaseButton");
	var $couponInput = $("#couponInput");
	var $couponLabel = $("#couponLabel");
	var $couponNote = $("#couponNote");
	var $totalBill = $("#totalBill");
	var $checkoutButton = $("#checkoutButton");
	var $donationInput = $("#donationInput");
	var finalBill = window.addon.price;

	var $payWithAccountBalanceCheckbox = $("#payWithAccountBalance");
	var $payWithPayPalCheckbox = $("#payWithPayPal");
	var $payWithStripeCheckbox = $("#payWithCreditCard");

  var $wishlistLink = $("#wishlistLink");

  var waitingForWishlistResponse = false;
  $wishlistLink.on('click', function (e) {
    if (waitingForWishlistResponse) return;

    waitingForWishlistResponse = true;
    getCSRF(function (csrf) {
      io.socket.post('/addons/' + window.addon.id + '/toggleWishlist', {_csrf: csrf});
    });
  });

  io.socket.on('wishlistResponse', function (data) {
    waitingForWishlistResponse = false;
    if (data.error) {
      addAlert('error', 'Wishlist Error', data.reason);
    } else {
      addAlert('success', 'Wishlist Success', data.reason);
      if (data.removed) {
        $wishlistLink.text('Add to Wishlist');
      } else {
        $wishlistLink.text('Remove from Wishlist');
      }
    }
  });

	// Coupon logic
	var couponTimer;
	var coupon = {code: ''};
	$couponInput.on('change keydown paste input', function () {
		if (couponTimer !== null) clearTimeout(couponTimer);
		couponTimer = setTimeout(function () {
			io.socket.get('/csrfToken', function (data) {
				io.socket.post('/addons/' + window.addon.id + '/validateCoupon', {
					_csrf: data._csrf,
					couponCode: $couponInput.val()
				})
			});

		}, 200);
	});

	io.socket.on('couponValidated', function (data) {
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
		else $totalBill.text('$' + finalBill + ' USD');
	});

	$donationInput.on('change keydown paste input', function (e) {
		finalBill = $donationInput.val();
		$totalBill.text('$' + finalBill + ' USD');
	});

	$purchaseButton.on('click', function (event) {
		$('#paymentModal').modal('show');
		event.preventDefault();
	});

	$checkoutButton.on('click', function (event) {
		// This is a donation, therefore we need to make sure they entered an amount
		if (window.addon.price === 0 && finalBill === 0) {
			alert("You must enter an amount into the donation input!")
		} else {
			// If the final bill is 0 dollars but this isn't a free addon, the user used a 100% off coupon
			if (finalBill === 0 || $payWithAccountBalanceCheckbox.is(':checked')) checkoutWithAccountBalance();
			else if ($payWithPayPalCheckbox.is(':checked')) checkoutWithPayPal();
			else if ($payWithStripeCheckbox.is(':checked')) checkoutWithStripe();
			else {
				console.log('invalid payment method specifed')
			}
		}

		event.preventDefault();
	});

	var checkoutWithAccountBalance = function () {
		var description;
		if (window.addon.price === 0) description = "Donation to '" + window.addon.name + "'";
		else description = "License for '" + window.addon.name + "'";

		getCSRF(function(csrf) {
			post('/addons/' + window.addon.id + '/checkout', {
				_csrf: csrf,
				addonId: window.addon.id,
				bill: finalBill,
				couponCode: coupon.code,
				paymentMethod: Transaction.PaymentMethod.ACCOUNT_BALANCE,
				description: description
			});
		});
	};

	var checkoutWithPayPal = function () {
		getCSRF(function(csrf) {
			// Set the description
			var description;
			if (window.addon.price === 0) description = "Donation to '" + window.addon.name + "'";
			else description = "License for '" + window.addon.name + "'";

			post('/addons/' + window.addon.id + '/checkout', {
				_csrf: csrf,
				addonId: window.addon.id,
				bill: finalBill,
				couponCode: coupon.code,
				paymentMethod: Transaction.PaymentMethod.PAYPAL,
				description: description
			});
		})
	};

	var checkoutWithStripe = function () {
		getCSRF(function(csrf) {
			// Set the description
			var description;
			if (window.addon.price === 0) description = "Donation to '" + window.addon.name + "'";
			else description = "License for '" + window.addon.name + "'";

			// Configure Stripe
			var handler = StripeCheckout.configure({
				key: window.stripePublicKey,
				token: function (token) {
					var metadata = JSON.stringify({
						token: token.id
					});
					post('/addons/' + window.addon.id + '/checkout', {
						_csrf: csrf,
						addonId: window.addon.id,
						bill: finalBill,
						couponCode: coupon.code,
						paymentMethod: Transaction.PaymentMethod.CREDIT_CARD,
						description: description,
						metadata: metadata
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
				amount: finalBill
			});
		})
	};

	// Post to the provided URL with the specified parameters.
	function post(path, parameters) {
		var form = $('<form></form>');

		form.attr("method", "post");
		form.attr("action", path);
		form.attr("enctype", "multipart/form-data");

		$.each(parameters, function (key, value) {
			var field = $('<input></input>');

			field.attr("type", "hidden");
			field.attr("name", key);
			field.attr("value", value);

			form.append(field);
		});

		// The form needs to be a part of the document in
		// order for us to be able to submit it.
		$(document.body).append(form);
		form.submit();
	};
});
