// ==UserScript==
// @name           hipchat-emoticon-browser
// @namespace      http://magnificent-tears.com
// @include        https://*.hipchat.com/chat*
// ==/UserScript==

(function(){

  var show_emoticons = function(){
    var id = '_local_emoticons',
      boxstyle = 'width: 175px; height: 50%; position: absolute; left: 2px; bottom: 40px; overflow: scroll; background: #eef;',
      url_prefix = 'https://dujrsrsgsd3nh.cloudfront.net/img/emoticons/';
    $('#' + id).remove(); // This may or may not already exist.
    $('body').append($([
      '<div id="' + id + '" style="' + boxstyle + '">',

        // TODO: sort?
        // TODO: filter out ones i don't care about
      emoticons.emoticons
        .sort(function(a,b){ return a.shortcut.localeCompare(b.shortcut); })
        .map(function(e){
          return [
            '<div onclick="$(\'#message_input\')[0].value += \' \' + $(this).find(\'span\')[0].innerHTML; $(\'#message_input\')[0].focus();"',
            ' style="outline: 1px dotted #ccc; float: left; height: 50px; text-align: center;">',
              '<img src="' + url_prefix + e.image + '"><br/>',
              '<span style="color: #555; font-size: 0.9em;">' + e.shortcut + '</span>',
            '</div>',
          ].join('');
        }).join("\n"),

      '</div>',
    ].join("\n")));
  };
  //show_emoticons();

  // Wait 20 seconds to let the room (and it's emoticons) load.
  setTimeout(show_emoticons, 20*1000);
})();
