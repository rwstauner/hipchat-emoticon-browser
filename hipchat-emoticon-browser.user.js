// ==UserScript==
// @name           hipchat-emoticon-browser
// @namespace      http://magnificent-tears.com
// @include        https://*.hipchat.com/chat*
// ==/UserScript==

(function(){

  var show_emoticons = function(){
    clearInterval(interval);
    var id = '_local_emoticons',
      box_style = 'width: 175px; position: absolute; left: 2px; bottom: 40px; background: #eef; z-index: 9999;',
      toggle_style = 'height: 1.5em; background: #aab; border-bottom: #778;text-align: center; cursor:pointer;',
      emoticons_style = 'overflow: auto; padding: 5px 0; display: none;',
      emoticon_style = 'outline: 1px dotted #ccc; float: left; height: 35px; text-align: center;cursor:pointer; margin: 2px;',
      toggle = '<div class="_toggle" style="'+ toggle_style +'">Emoticons</div>',
      emoticons_box = '<div class="_emoticons" style="'+ emoticons_style +'"></div>',
      sorted_emoticons = emoticons.emoticons.sort(function(a,b){ return a.shortcut.localeCompare(b.shortcut); });

    $('#' + id).remove(); // This may or may not already exist.
    $('body').append('<div id="' + id + '" style="'+ box_style +'">'+toggle+emoticons_box+'</div>');

    $.each(sorted_emoticons, function(i,e){
      var emote = '<div class="_emoticon" style="'+emoticon_style+'">' +
                    '<img src="' + emoticons.path_prefix + '/' + e.image + '"><br/>' +
                    '<span style="color: #555; font-size: 0.5em;">' + e.shortcut + '</span>' +
                  '</div>';
      $('#'+id+' ._emoticons').append(emote);
    });
    $('#'+id+' ._emoticons').append('<div style="clear:both;"></div>').height($('body').height()-80);

    $('body').on('click', '#'+id+' ._emoticon', function(e){
      var input = $('#message_input');
      input.focus();
      input.val(input.val()+' '+$(this).find('span').text());
    });

    $('body').on('click', '#'+id+' ._toggle', function(){
      $('#'+id+' ._emoticons').toggle();
    });
  };
  //show_emoticons();

  var interval = setInterval(function(){
    // Wait for Hipchat to finish loading before trying to get emoticons
    if($('#loading').css('display') == 'none') {
      $(document).ready(function(){
        show_emoticons();
      });
    }
  }, 500);
})();
