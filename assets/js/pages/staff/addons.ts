/// <reference path='../../../../typings/jquery/jquery.d.ts' />

$(function () {
    $(".approveButton").on('click', function (e) {
	    io.socket.get('/csrfToken', function(data) {
		    io.socket.post('/staff/approveAddon', {
			    _csrf: data._csrf,
			    addonId: $(this).data('addon-id')
		    });
	    });

        var $row = $(this).parent().parent().parent().parent();
        $row.hide('slow', function () {
            $row.remove()
        });
    });
    $(".denyButton").on('click', function (e) {
	    io.socket.get('/csrfToken', function(data) {
		    io.socket.post('/staff/denyAddon', {
			    _csrf: data._csrf,
			    addonId: $(this).data('addon-id')
		    });
	    });
        var $row = $(this).parent().parent().parent().parent();
        $row.hide('slow', function () {
            $row.remove()
        });
    });
});
