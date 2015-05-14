/// <reference path='../../../../typings/jquery/jquery.d.ts' />

// Bind normal buttons
Ladda.bind('.ladda-btn button', {timeout: 2000});

// Bind progress buttons and simulate loading progress
Ladda.bind('.ladda-btn-progress button', {
    callback: function (instance) {
        var progress = 0;
        var interval = setInterval(function () {
            progress = Math.min(progress + Math.random() * 0.1, 1);
            instance.setProgress(progress);

            if (progress === 1) {
                instance.stop();
                clearInterval(interval);
            }
        }, 200);
    }
});

$('.respondButton').on('click', function (e) {
    var $button = $(this);
    var $textArea = $($button.parent().parent().find('textarea')[0]);
    var content = $textArea.val();
    if (content !== null && content !== '') {
        $textArea.val('');
        io.socket.post('/profile/tickets/' + $button.data('ticket-id') + '/respond', {
            content: content
        });
    }
    e.preventDefault();
});

io.socket.on('ticket', function (msg) {
    if (msg.verb === 'updated') {
        if (msg.data.type === 'newResponse') {
            return addNewResponse(msg.id, msg.data.user, msg.data.content);
        } else if (msg.data.type === 'closed') {
            return closeTicket(msg.id);
        }
    }

    console.log('Unknown message:', msg);
});

io.socket.get('/profile/tickets');

// Utility Functions
function addNewResponse(ticketId, user, content) {
    var responseHTML = "";
    responseHTML += "<div class=\"media media-v2 margin-bottom-20\">";
    responseHTML += "<a class=\"pull-left\">";
    responseHTML += "<img class=\"media-object rounded-x\"";
    responseHTML += "src=\"" + user.steamProfile.photos[2].value + "\">";
    responseHTML += "<\/a>";
    responseHTML += "<div class=\"media-body\">";
    responseHTML += "<h4 class=\"media-heading\">";
    responseHTML += "<strong><a href=\"#\">" + user.username + "<\/a><\/strong>";
    responseHTML += "<small>" + Date.now() + "<\/small>";
    responseHTML += "<\/h4>";
    responseHTML += "<p>" + content + "<\/p>";
    responseHTML += "<\/div>";
    responseHTML += "<\/div>";
    $("#ticketBody-" + ticketId + " > .media").last().append(responseHTML);
}

function closeTicket(ticketId) {
    $("#ticketBody-" + ticketId).hide('slow', function () {
        $(this).remove();
        if ($(".profile-body").length === 1) {
            $("#noTicketsBanner").show();
        }
    });
}