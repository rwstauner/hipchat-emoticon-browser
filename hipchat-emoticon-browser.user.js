// ==UserScript==
// @name           hipchat-emoticon-browser
// @namespace      http://magnificent-tears.com
// @include        https://*.hipchat.com/chat*
// @version        3
// ==/UserScript==

(function(){

  // HipChat includes jQuery 1.8.3 and we're not shy about using it.

  var eb = {
    "interval": null,
    "id": '_local_emoticon_browser',
  };

  eb.prepare = function(){
    clearInterval(eb.interval);

    var
      // Set z-index high to cover the "X" for different tabs.
      box_style = 'width: 175px; position: absolute; left: 2px; bottom: 40px; background: #eef; z-index: 9999;',
      toggle_style = 'height: 1.5em; background: #aab; border-bottom: #778;text-align: center; cursor:pointer;',
      emoticons_style = 'overflow: auto; padding: 5px 0; display: none;',
      toggle = '<div class="_toggle" style="'+ toggle_style +'">Emoticons</div>',
      emoticons_box = '<div class="_emoticons" style="'+ emoticons_style +'"></div>',
      id = eb.id;

    $('#' + id).remove(); // This may or may not already exist.
    $('body').append('<div id="' + id + '" style="'+ box_style +'">'+toggle+emoticons_box+'</div>');

    $('body').on('click', '#'+id+' ._emoticon', function(e){
      var input = $('#message_input');
      input.focus();
      input.val(input.val()+' '+$(this).find('span').text());
    });

    $('body').on('click', '#'+id+' ._toggle', function(){
      // Refresh emoticons before opening.
      if( $('#'+id+' ._emoticons').css('display') == 'none' ){
        eb.refresh();
      }
      $('#'+id+' ._emoticons').toggle();
    });
  };

  eb.refresh = function () {
    var
      container = $('#'+eb.id+' ._emoticons'),
      emoticon_style = 'outline: 1px dotted #ccc; float: left; height: 35px; text-align: center;cursor:pointer; margin: 2px;',
      sorted_emoticons = emoticons.emoticons.sort(function(a,b){ return a.shortcut.localeCompare(b.shortcut); }),
      innerhtml = [];

    $.each(sorted_emoticons, function(i,e){
      var emote = [
        // Put shortcut text in title like the real ones (in case our font is too small).
        '<div class="_emoticon" style="' + emoticon_style + '" title="' + e.shortcut + '">',
        '<img src="' + emoticons.path_prefix + '/' + e.image + '"><br/>',
        // Shrink font so the items aren't too terribly large.
        '<span style="color: #555; font-size: 0.5em;">' + e.shortcut + '</span>',
        '</div>',
      ].join("\n");
      innerhtml.push(emote);
    });

    innerhtml.push('<div style="clear:both;"></div>');
    container.empty();
    container.append(innerhtml.join("\n")).height($('body').height()-80);
  };

  eb.interval = setInterval(function(){
    // Wait for Hipchat to finish loading before trying to get emoticons
    if($('#loading').css('display') == 'none') {
      $(document).ready(function(){
        eb.prepare();
      });
    }
  }, 500);

})();
