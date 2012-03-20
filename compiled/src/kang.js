var __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

define('kang', ['events', 'store', 'account', 'remote'], function(Events, Store, Account, Remote) {
  'use strict';
  var Kang;
  return Kang = (function(_super) {

    __extends(Kang, _super);

    function Kang(couchDB_url) {
      this.couchDB_url = couchDB_url;
      this.couchDB_url = this.couchDB_url.replace(/\/+$/, '');
      this.store = new Store(this);
      this.account = new Account(this);
      this.remote = new Remote(this);
    }

    Kang.prototype.request = function(type, path, options) {
      var defaults;
      if (options == null) options = {};
      defaults = {
        type: type,
        url: "" + this.couchDB_url + path,
        xhrFields: {
          withCredentials: true
        },
        crossDomain: true,
        dataType: 'json'
      };
      return $.ajax($.extend(defaults, options));
    };

    Kang.prototype.promise = $.Deferred;

    return Kang;

  })(Events);
});
