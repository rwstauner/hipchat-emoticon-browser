// ==UserScript==
// @name           hipchat-emoticon-browser
// @namespace      http://magnificent-tears.com
// @include        https://*.hipchat.com/chat*
// @updateURL      https://raw.github.com/rwstauner/hipchat-emoticon-browser/master/hipchat-emoticon-browser.user.js
// @version        13
// ==/UserScript==

(function(){
  /*global $, document, config, emoticons, HC*/

  // HipChat includes jQuery 1.8.3 and we're not shy about using it.

  // TODO: add special case for (scumbag)(allthethings)

  var eb = {
      interval: null,
      iconString: '',
      id: '_local_emoticon_browser',
      contentClass: '_emoticons',
      itemClass:    '_emoticon'
    },

    // Helper functions.

    _first = function() {
      var res, i;
      for(i = 0; i < arguments.length; ++i){
        try {
          res = arguments[i](this);
        }
        catch(ignore){}
        if(res){
          break;
        }
      }
      return res;
    },

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
      if( att ){
        html.push( stringifyAttributes(att) );
      }
      html.push(
        content.length ? ('>' + content.join("\n") + "</" + name + '>') : '/>'
      );
      return html.join(' ');
    };

  eb.contentSelector = '#' + eb.id + ' .' + eb.contentClass;

  eb.append_message_input = function(msg) {
    var input = $('#message_input');
    if(!input.length){
      input = $('#hc-message-input');
    }
    msg = input.val() + ' ' + msg;

    try {
      HC.Actions.ChatInputActions.setMsgValue({text: msg});
    }
    catch(x) {
      input.val( msg );
    }

    input.focus();
  };

  eb.prepare = function(){
    try {
      eb._prepare();
    }
    catch(ignore){}
  };

  eb._prepare = function(){
    clearInterval(eb.interval);

    var toggleClass = '_toggle',
      id = eb.id;

    $('#' + id).remove(); // This may or may not already exist.
    $('body').append(
      tag('div',
        {
          id: id,
          // Set z-index between the tab "X" (10) and the change-status text box (100).
          style: 'width: 175px; position: absolute; left: 2px; bottom: 40px; background: #eef; z-index: 50;'
        },

        tag('div', {
          "class": toggleClass,
          style: 'height: 1.5em; background: #aab; border-bottom: #778;text-align: center; cursor:pointer;'
        }, 'Emoticons'),

        tag('div', {
          "class": eb.contentClass,
          style: 'overflow: auto; padding: 5px 0; display: none;'
        }, '')
      )
    );

    // Insert shortcut into message box when clicked.
    $('body').on('click', '#' + id + ' .' + eb.itemClass, function(){
      eb.append_message_input( $(this).find('span').text() );
    });

    $('body').on('click', '#' + id + ' .' + toggleClass, function(){
      var $el = $(eb.contentSelector);

      // Refresh emoticons before opening.
      if( $el.css('display') === 'none' ){
        eb.refresh();

        // Readjust the height everytime we open it.
        // This should be automatic (percentage doesn't work but we could
        // consider doing onresize).
        $el.height( $('body').height() - 80 );
      }

      $el.toggle();
    });

  };

  eb.sorted_emoticons = function() {
    // HipChat has changed the structure of their emoticon objects a few times.
    var icons = _first(
      function(){ return HC.Utils.emoticons.emoticons; },
      function(){ return emoticons.emoticons; },
      function(){ return config.emoticons; }
    );

    if(!icons){
      return [];
    }

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

  eb.stringify_icons = function(icons) {
    // We need object attributes sorted so that strings are comparable.
    return $.map(icons, function(icon) { return stringifyAttributes(icon); }).join("\n");
  };

  eb.image_src = function (e) {
    var config;
    if(!eb.path_prefix){
      try { config = HC.Utils.emoticons; }
      catch(x) { config = emoticons; }
      eb.path_prefix = config.path_prefix;
    }
    return (eb.path_prefix + '/' + (e.image || e.file));
  };

  eb.refresh = function () {
    var
      container,
      icons = eb.sorted_emoticons(),
      iconString = eb.stringify_icons(icons),
      innerhtml = [];

    // TODO: if !icons.length show message (report issue?)

    // If the icons haven't changed we don't need to do anything.
    if( iconString === eb.iconString ){
      return;
    }

    // Save it so we can check it next time.
    eb.iconString = iconString;

    container = $(eb.contentSelector);

    $.each(icons, function(i, e){ /*jslint unparam: true */
      var emote = tag('div',
        {
          "class": eb.itemClass,
          style: 'outline: 1px dotted #ccc; float: left; height: 40px; text-align: center; cursor:pointer; margin: 2px;',
          // Put shortcut text in title like the real ones (in case our font is too small).
          title: e.shortcut
        },

        tag('img', {
          // replaceImageWithRetina requires the name="emoticon" attribute.
          name: 'emoticon',
          src: eb.image_src(e),
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
    container.html( innerhtml.join("\n") );

    // Use HipChat's own "upgrade to Retina" function if it's accessible.
    try {
      /*global chat*/
      chat.replaceImageWithRetina(container);
    } catch(ignore) { }

  };

  eb.interval = setInterval(function(){
    // Wait for Hipchat to finish loading before trying to get emoticons
    if(
      // Old UI had loading image.
      $('#loading').css('display') === 'none' ||
      // New UI rebuilds DOM and #hipchat div will be there.
      $('#hipchat').length === 1
    ) {
      $(document).ready(function(){
        eb.prepare();
        console.eb = eb; // FIXME
      });
    }
  }, 500);

}());
