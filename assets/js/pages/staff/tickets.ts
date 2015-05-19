/// <reference path='../../../../typings/jquery/jquery.d.ts' />

$(function () {
    $('.respondButton').on('click', function (e) {
        var $button = $(this);
        var $textArea = $($button.parent().parent().find('textarea')[0]);
        var content = $textArea.val();
        if (content !== null && content !== '') {
            $textArea.val('');
            io.socket.post('/staff/tickets/' + $button.data('ticket-id') + '/respond', {
                content: content
            });
        }
        e.preventDefault();
    });

    io.socket.on('ticket', function (msg) {
        if (msg.verb === 'updated') {
            if (msg.data.type === 'newResponse') {
                return addNewResponse(msg.data.user, msg.data.content);
            } else if (msg.data.type === 'closed') {
                return closeTicket();
            }
        }

        console.log('Unknown message:', msg);
    });

    io.socket.get('/staff/tickets/' + window.ticketId);

    // Utility Functions
    function addNewResponse(user, content: String) {
        var responseHTML = "";
        responseHTML += "<div class=\"media media-v2 margin-bottom-20\">";
        responseHTML += "<a class=\"pull-left\">";
        responseHTML += "<img class=\"media-object rounded-x\"";
        responseHTML += "src=\"" + user.steamProfile.photos[2].value + "\">";
        responseHTML += "<\/a>";
        responseHTML += "<div class=\"media-body\">";
        responseHTML += "<h4 class=\"media-heading\">";
        responseHTML += "<strong><a href=\"#\">" + user.username + "<\/a><\/strong>";
        responseHTML += "<small>" + new Date().toDateString() + "<\/small>";
        responseHTML += "<\/h4>";
        responseHTML += "<p>" + content + "<\/p>";
        responseHTML += "<\/div>";
        responseHTML += "<\/div>";
        $("#ticketBody > .media").last().append(responseHTML);
    }

    function closeTicket() {
        $("#ticketBody").hide('slow', function () {
            $(this).remove();
        });
    }
});
