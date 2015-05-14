/// <reference path='../../../../typings/jquery/jquery.d.ts' />
/// <reference path='../../../../typings/jquery.validation/jquery.validation.d.ts' />

$(function () {
    $('select[name^="gamemode"] option[value=' + window.addon.gamemode + ']').attr("selected","selected");
    $('select[name^="category"] option[value=' + window.addon.type + ']').attr("selected","selected");

    $('select[name^="category"]').attr("selected","selected");
});
