// ==UserScript==
// @name           hipchat-emoticon-browser
// @namespace      http://magnificent-tears.com
// @include        https://*.hipchat.com/chat*
// @updateURL      https://raw.github.com/rwstauner/hipchat-emoticon-browser/master/hipchat-emoticon-browser.user.js
// @version        9
// ==/UserScript==

(function(){
  /*global $, document, config, emoticons*/

  // HipChat includes jQuery 1.8.3 and we're not shy about using it.

  var eb = {
    "interval": null,
    "id": '_local_emoticon_browser',
  };

  eb.prepare = function(){
    clearInterval(eb.interval);

    var
      // Set z-index between the tab "X" (10) and the change-status text box (100).
      box_style = 'width: 175px; position: absolute; left: 2px; bottom: 40px; background: #eef; z-index: 50;',
      toggle_style = 'height: 1.5em; background: #aab; border-bottom: #778;text-align: center; cursor:pointer;',
      emoticons_style = 'overflow: auto; padding: 5px 0; display: none;',
      toggle = '<div class="_toggle" style="'+ toggle_style +'">Emoticons</div>',
      emoticons_box = '<div class="_emoticons" style="'+ emoticons_style +'"></div>',
      id = eb.id;

    $('#' + id).remove(); // This may or may not already exist.
    $('body').append('<div id="' + id + '" style="'+ box_style +'">'+toggle+emoticons_box+'</div>');

    $('body').on('click', '#'+id+' ._emoticon', function(){
      var input = $('#message_input');
      input.focus();
      input.val(input.val()+' '+$(this).find('span').text());
    });

    $('body').on('click', '#'+id+' ._toggle', function(){
      // Refresh emoticons before opening.
      if( $('#'+id+' ._emoticons').css('display') === 'none' ){
        eb.refresh();
      }
      $('#'+id+' ._emoticons').toggle();
    });
  };

  eb.sorted_emoticons = function() {
    // HipChat has changed the structure of their emoticon objects a few times.
    var icons = (emoticons.emoticons || config.emoticons);

    // If it's not an array, assume it's an object and turn it into an array.
    if( !icons.sort ){
      icons = (function(obj){
        var k, a = [];
        for(k in obj){
          if( obj.hasOwnProperty(k) ){
            a.push(obj[k]);
          }
        }
        return a;
      }(icons));
    }

    $.each(icons, function(i, icon){ /*jslint unparam: true */

      // The "slant" smiley is missing the trailing backslash in the `shortcut`
      // attribute (though it is present in `regex`).
      if( icon.shortcut === ":" && icon.file === "slant.png" ){
        icon.shortcut = ":\\";
      }

    });

    return icons.sort(function(a,b){
      return a.shortcut.localeCompare(b.shortcut);
    });
  };

  eb.refresh = function () {
    var
      container = $('#'+eb.id+' ._emoticons'),
      emoticon_style = 'outline: 1px dotted #ccc; float: left; height: 35px; text-align: center;cursor:pointer; margin: 2px;',
      innerhtml = [];

    $.each(eb.sorted_emoticons(), function(i, e){ /*jslint unparam: true */
      var emote = [
        // Put shortcut text in title like the real ones (in case our font is too small).
        '<div class="_emoticon" style="' + emoticon_style + '" title="' + e.shortcut + '">',
        // replaceImageWithRetina requires the name="emoticon" attribute. Set the height and width so retina images don't get huge.
        '<img name="emoticon" src="' + emoticons.path_prefix + '/' + (e.image || e.file) + '" height="' + e.height + '" width="' + e.width + '"><br/>',
        // Shrink font so the items aren't too terribly large.
        '<span style="color: #555; font-size: 0.5em;">' + e.shortcut + '</span>',
        '</div>',
      ].join("\n");
      innerhtml.push(emote);
    });

    innerhtml.push('<div style="clear:both;"></div>');
    container.empty();
    container.append(innerhtml.join("\n")).height($('body').height()-80);

    // Use HipChat's own "upgrade to Retina" function if it's accessible.
    try {
      /*global chat*/
      chat.replaceImageWithRetina(container);
    } catch(ignore) { }

  };

  eb.interval = setInterval(function(){
    // Wait for Hipchat to finish loading before trying to get emoticons
    if($('#loading').css('display') === 'none') {
      $(document).ready(function(){
        eb.prepare();
      });
    }
  }, 500);

}());
