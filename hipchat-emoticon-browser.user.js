// ==UserScript==
// @name           hipchat-emoticon-browser
// @namespace      http://magnificent-tears.com
// @include        https://*.hipchat.com/chat*
// @updateURL      https://raw.github.com/rwstauner/hipchat-emoticon-browser/master/hipchat-emoticon-browser.user.js
// @version        14
// ==/UserScript==

(function(){
  /*global $, document, config, emoticons, HC*/

  // HipChat includes jQuery 1.8.3 and we're not shy about using it.

  // TODO: add special case for (scumbag)(allthethings)

  function EmoticonBrowser() {
    $.extend(this, {
      interval: null,
      iconString: '',
      id: '_local_emoticon_browser',
      contentClass: '_emoticons',
      itemClass:    '_emoticon'
    });
    this.contentSelector = '#' + this.id + ' .' + this.contentClass;
  }

    // Helper functions.
  var
    _htmlEscape = function (s) {
      return s.toString().
        replace(/&/g, '&amp;').
        replace(/</g, '&lt;').
        replace(/"/g, '&quot;').
        replace(/'/g, '&#39;').
        replace(/>/g, '&gt;');
    },

    _keys = function (obj) {
      var k, list = [];
      for(k in obj){ if(obj.hasOwnProperty(k)){ list.push(k); } }
      return list.sort();
    },
    _slice = [].slice,
    _identity = function (val) { return val; },

    stringifyAttributes = function (att, opts) {
      opts = $.extend({
        assign: '="',
        suffix: '"',
        htmlEscape: false,
        keyTransform: _identity,
      }, opts || {});
      return $.map( _keys(att), function(key){
        var val = att[key];
        if( opts.htmlEscape ){
          val = _htmlEscape(val);
        }
        return opts.keyTransform(key) + opts.assign + val + opts.suffix;
      }).join(' ');
    },

    _jsToCSS = function (k) {
      return k.replace(/([a-z])([A-Z])/g,
        function() { return RegExp.$1 + '-' + RegExp.$2.toLowerCase(); });
    },
    stringifyCSS = function () {
      return stringifyAttributes(
        $.extend.apply($, $.map(arguments, function(a){ return a || {}; })),
        {
          assign: ': ',
          suffix: '; ',
          keyTransform: _jsToCSS
        }
      );
    },

    tag = function (name, att) {
      var html = ['<' + name], content = _slice.call(arguments, 2);
      if( att ){
        html.push( stringifyAttributes(att, {htmlEscape: true}) );
      }
      html.push(
        content.length ? ('>' + content.join("\n") + "</" + name + '>') : '/>'
      );
      return html.join(' ');
    };

  EmoticonBrowser.Adapters = [
    // New AUI (Atlassian UI) (in preview 2015).
    {
      active: function () {
        return typeof HC !== 'undefined';
      },
      containerStyle: {
        background: '#eef',
        bottom:     0,
        left:       0,
        lineHeight: '1em', // override parent
        width:      '219px'
      },
      emoticons: function(){
        return HC.Utils.emoticons.emoticons;
      },
      messageInput: '#hc-message-input',
      appendMessageInput: function (msg) {
        HC.Actions.ChatInputActions.setMsgValue({text: msg});
      },
      pathPrefix: function () {
        return HC.Utils.emoticons.path_prefix;
      },
      toggleStyle: {
        background: '#205081',
        color: '#fff'
      },
      ready: function () {
        // After DOM is rebuilt by React #hipchat div will be there.
        return $('#hipchat').length === 1;
      }
    },
    // 2014 HipChat UI
    {
      active: function () {
        return true; // be lazy and assume.
      },
      emoticons: function () {
        return (emoticons.emoticons || config.emoticons);
      },
      messageInput: '#message_input',
      appendMessageInput: function (msg) {
        $(this.messageInput).val(msg);
      },
      pathPrefix: function () {
        return emoticons.path_prefix;
      },
      ready: function () {
        // Spinner
        return $('#loading').css('display') === 'none';
      }
    }
  ];

$.extend(EmoticonBrowser.prototype, {

  eachAdapter: function (cb) {
    var $this = this;
    return $.each(EmoticonBrowser.Adapters, function(i, adapter){ /*jslint unparam: true*/
      return cb.call($this, adapter);
    });
  },

  setAdapter: function () {
    this.adapter = null;
    this.eachAdapter(function (adapter) {
      if( adapter.active() ){
        this.adapter = adapter;
        return false; // break
      }
    });
    if( !this.adapter ){
      throw new Error('Unrecognized HipChat Interface');
    }
  },

  appendMessageInput: function(msg) {
    var input = $(this.adapter.messageInput);
    msg = input.val() + ' ' + msg;
    this.adapter.appendMessageInput(msg);
    input.focus();
  },

  prepare: function() {
    try {
      this._prepare();
    }
    catch(ignore){}
  },

  _prepare: function() {
    var eb = this;
    clearInterval(eb.interval);

    // The "ready" check may not be entirely indicative of which adapter to use.
    this.setAdapter();

    var toggleClass = '_toggle',
      id = eb.id;

    $('#' + id).remove(); // This may or may not already exist.
    $('body').append(
      tag('div',
        {
          id: id,
          style: stringifyCSS({
            background: '#eef',
            bottom:     '40px',
            left:       '2px',
            position:   'absolute',
            width:      '175px',
            // Set z-index between the tab "X" (10) and the change-status text box (100).
            zIndex:     50
          }, this.adapter.containerStyle)
        },

        // TODO: Add Toggle to bottom (when open).
        tag('div', {
          "class": toggleClass,
          style: stringifyCSS({
            background:   '#aab',
            borderBottom: '#778',
            cursor:       'pointer',
            height:       '1.5em',
            lineHeight:   '1.5em',
            textAlign:    'center'
          }, this.adapter.toggleStyle)
        }, 'Emoticons'),

        tag('div', {
          "class": eb.contentClass,
          style: 'overflow: auto; padding: 5px 0; display: none;'
        }, '')
      )
    );

  $('#' + id).

    // Insert shortcut into message box when clicked.
    on('click', '.' + eb.itemClass, function(){
      eb.appendMessageInput( $(this).find('span').text() );
    }).

    on('click', '.' + toggleClass, function(){
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

  },

  sortedEmoticons: function() {
    // HipChat has changed the structure of their emoticon objects a few times.
    var icons = this.adapter.emoticons();

    if( !icons ){
      throw new Error('None found');
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

    if( !icons.length ){
      throw new Error('None found');
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
  },

  stringifyIcons: function(icons) {
    // We need object attributes sorted so that strings are comparable.
    return $.map(icons, function(icon) { return stringifyAttributes(icon); }).join("\n");
  },

  imageUrl: function (e) {
    var eb = this;
    if(!eb.path_prefix){
      eb.path_prefix = this.adapter.pathPrefix();
    }
    return (eb.path_prefix + '/' + (e.image || e.file));
  },

  refresh: function () {
    var
      eb = this,
      container,
      icons, iconString,
      innerhtml = [];

  try {
    // Try again if we don't have one.
    if( !this.adapter ){
      this.setAdapter();
    }

    icons      = this.sortedEmoticons();
    iconString = this.stringifyIcons(icons);

    // If the icons haven't changed we don't need to do anything.
    if( iconString === eb.iconString ){
      return;
    }

    // Save it so we can check it next time.
    eb.iconString = iconString;

    $.each(icons, function(i, e){ /*jslint unparam: true */
      innerhtml.push(tag('div',
        {
          "class": eb.itemClass,
          style: stringifyCSS({
            cursor:     'pointer',
            "float":    'left',
            height:     '40px',
            margin:     '2px',
            outline:    '1px dotted #ccc',
            textAlign:  'center'
          }, this.adapter.itemStyle),
          // Put shortcut text in title like the real ones (in case our font is too small).
          title: e.shortcut
        },

        tag('img', {
          // replaceImageWithRetina requires the name="emoticon" attribute.
          name: 'emoticon',
          src: this.imageUrl(e),
          // Set the height and width so retina images don't get huge.
          height: e.height,
          width:  e.width
        }),

        tag('br'),

        tag('span', {
          // Shrink font so the items aren't too terribly large.
          style: "color: #555; font-size: 0.5em;"
        }, e.shortcut)
      ));
    }.bind(this));
  }
  catch(x) {
    // Escape in case an error occurs with an unexpected message.
    innerhtml.push(tag('div',
      {
        style: 'font-size: 0.9em; text-align: center;',
      },
      'Unable to load emoticons: <i>' + _htmlEscape(x) + '</i>'
    ));
  }

    innerhtml.push('<div style="clear:both;"></div>');
    container = $(this.contentSelector);
    container.html( innerhtml.join("\n") );

    // Use HipChat's own "upgrade to Retina" function if it's accessible.
    try {
      /*global chat*/
      chat.replaceImageWithRetina(container);
    } catch(ignore) { }

  },

  init: function () {
    this.interval = setInterval(function(){
      // Wait for Hipchat to finish loading before trying to get emoticons
      this.eachAdapter(function(hipchat){
        if( hipchat.ready() ){
          this.prepare();
          return false; // break
        }
      });
    }.bind(this), 500);
  }
});

  var eb = new EmoticonBrowser();
  console.eb = eb; // FIXME
  eb.init();

}());
