/// <reference path='../../../../typings/jquery/jquery.d.ts' />
/// <reference path='../../../../typings/socket.io-client/socket.io-client.d.ts' />

$(function () {
    // Replace description and instructions text areas with Markdown editors
    var descriptionEditor = textboxio.replace('#descriptionInput');
    var instructionsEditor = textboxio.replace('#instructionsInput');

    //// Combine all of our forms together
    //$('#specialForm').submit(function() {
    //    var action = $(this).attr('action');
    //    var data = $('#generalForm, #mediaForm, #specialForm').serialize();
    //    var description = descriptionEditor.content.get();
    //    var instructions = instructionsEditor.content.get();
    //
    //    data += '&description=' + description + '&instructions=' + instructions;
    //
    //    console.log(data);
    //    $.ajax({
    //        url  : action,
    //        type : 'POST',
    //        data : data,
    //        success : function() {
    //            window.location.replace(action);
    //        }
    //    });
    //    return false;
    //});

    $("#submitButton").on('click', function (e) {
        submitAddon();
        e.preventDefault();
    });
    function submitAddon() {
        var addon = {
            name: $("#nameInput").val(),
            price: $("#priceInput").val(),
            gamemode: $("#gamemodeInput").val(),
            category: $("#categoryInput").val(),
            //filePath: $("#zipFileInput").files[0],
            filePath: "TODO",
            description: descriptionEditor.content.get(),
            instructions: instructionsEditor.content.get(),
            explanation: $("#explanationInput").val(),
            outsideServers: $("#outsideServersInput").val(),
            containsDrm: $("#containsDrmInput").val(),
            galleryImages: 'TODO',
            youtubeVideos: 'TODO',
            autoUpdaterEnabled: $("#autoUpdateEnabledInput").val(),
            configuratorEnabled: $("#configuratorEnabledInput").val(),
            leakProtectionEnabled: $("#leakProtectionEnabledInput").val(),
            statTrackerEnabled: $("#statTrackerEnabledInput").val()
        };
        io.socket.post('/profile/createAddon', addon);
    }
    io.socket.on('error', function(data) {console.log(data);})
});
