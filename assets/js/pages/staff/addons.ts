/// <reference path='../../../../typings/jquery/jquery.d.ts' />

$(function () {
    $(".approveButton").on('click', function (e) {
        io.socket.post('/staff/approveAddon', {
            addonId: $(this).data('addon-id')
        });
        var $row = $(this).parent().parent().parent().parent();
        $row.hide('slow', function () {
            $row.remove()
        });
    });
    $(".denyButton").on('click', function (e) {
        io.socket.post('/staff/denyAddon', {
            addonId: $(this).data('addon-id')
        });
        var $row = $(this).parent().parent().parent().parent();
        $row.hide('slow', function () {
            $row.remove()
        });
    });
});
