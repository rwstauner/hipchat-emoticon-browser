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
    },

    // Helper functions.

    _keys = function (obj) {
      var k, list = [];
      for(k in obj){ if(obj.hasOwnProperty(k)){ list.push(k); } }
      return list.sort();
    },

    _slice = [].slice,

    stringifyAttributes = function (att) {
      return $.map( _keys(att), function(key){
        return key + '="' + att[key] + '"';
      }).join(' ');
    },

    tag = function (name, att) {
      var html = ['<' + name], content = _slice.call(arguments, 2);
      if(att){ html.push(stringifyAttributes(att)); }
      html.push(content.length ? ('>' + content.join("\n") + "\n</" + name + '>') : '/>');
      return html.join(' ');
    };

  eb.prepare = function(){
    clearInterval(eb.interval);

    var toggleClass = '_toggle',
      id = eb.id;

    $('#' + id).remove(); // This may or may not already exist.
    $('body').append(
      tag('div',
        {
          id: eb.id,
          // Set z-index between the tab "X" (10) and the change-status text box (100).
          style: 'width: 175px; position: absolute; left: 2px; bottom: 40px; background: #eef; z-index: 50;'
        },
        tag('div', {
          "class": toggleClass,
          style: 'height: 1.5em; background: #aab; border-bottom: #778;text-align: center; cursor:pointer;'
        }, 'Emoticons'),
        tag('div', {
          "class": '_emoticons',
          style: 'overflow: auto; padding: 5px 0; display: none;'
        }, '')
      )
    );

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
      innerhtml = [];

    $.each(eb.sorted_emoticons(), function(i, e){ /*jslint unparam: true */
      var emote = tag('div',
        {
          "class": '_emoticon',
          style: 'outline: 1px dotted #ccc; float: left; height: 40px; text-align: center; cursor:pointer; margin: 2px;',
          // Put shortcut text in title like the real ones (in case our font is too small).
          title: e.shortcut
        },
        tag('img', {
          // replaceImageWithRetina requires the name="emoticon" attribute.
          name: 'emoticon',
          src: (emoticons.path_prefix + '/' + (e.image || e.file)),
          // Set the height and width so retina images don't get huge.
          height: e.height,
          width:  e.width
        }),
        tag('br'),
        tag('span', {
          // Shrink font so the items aren't too terribly large.
          style: "color: #555; font-size: 0.5em;"
        }, e.shortcut)
      );
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
