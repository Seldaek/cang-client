var __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

define('couchapp', ['events', 'store'], function(Events, Store) {
  'use strict';
  var couchApp;
  return couchApp = (function(_super) {

    __extends(couchApp, _super);

    function couchApp(couchDB_url) {
      this.couchDB_url = couchDB_url;
      this.couchDB_url = this.couchDB_url.replace(/\/+$/, '');
      this.store = new Store(this);
    }

    couchApp.prototype.sign_up = function(email, password) {
      var key, password_sha, prefix, salt, user;
      prefix = 'org.couchdb.user';
      key = "" + prefix + ":" + email;
      salt = hex_sha1(this.store.uuid());
      password_sha = hex_sha1(password + salt);
      user = {
        _id: key,
        name: email,
        type: 'user',
        roles: [],
        salt: salt,
        password_sha: password_sha
      };
      return $.ajax({
        type: 'PUT',
        url: "" + this.couchDB_url + "/_users/" + (encodeURIComponent(key)),
        data: JSON.stringify(user),
        contentType: "application/json"
      });
    };

    couchApp.prototype.sign_in = function(email, password) {
      var creds;
      creds = JSON.stringify({
        name: email,
        password: password
      });
      return $.ajax({
        type: 'POST',
        url: "" + this.couchDB_url + "/_session",
        data: creds,
        contentType: "application/json"
      });
    };

    couchApp.prototype.login = couchApp.prototype.sign_in;

    couchApp.prototype.change_password = function(email) {
      return alert('change password is not yet implementd');
    };

    couchApp.prototype.sign_out = function() {
      return $.ajax({
        type: 'DELETE',
        url: "" + this.couchDB_url + "/_session",
        contentType: "application/json"
      });
    };

    couchApp.prototype.logout = couchApp.prototype.sign_out;

    return couchApp;

  })(Events);
});
