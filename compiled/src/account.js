
define('account', function() {
  'use strict';
  var Account;
  return Account = (function() {

    function Account(app) {
      this.app = app;
    }

    Account.prototype.sign_up = function(email, password) {
      var key, options, prefix, user,
        _this = this;
      prefix = 'org.couchdb.user';
      key = "" + prefix + ":" + email;
      user = {
        _id: key,
        name: email,
        type: 'user',
        roles: [],
        password: password
      };
      options = {
        success: function() {
          _this.app.trigger('account:sign_up');
          return _this.app.trigger('account:sign_in');
        }
      };
      return this._request('PUT', "/_users/" + (encodeURIComponent(key)), user, options);
    };

    Account.prototype.sign_in = function(email, password) {
      var creds, options,
        _this = this;
      creds = {
        name: email,
        password: password
      };
      options = {
        success: function() {
          return _this.app.trigger('account:sign_in');
        }
      };
      return this._request('POST', '/_session', creds, options);
    };

    Account.prototype.login = Account.prototype.sign_in;

    Account.prototype.change_password = function(current_password, new_password) {
      return alert('change password is not yet implementd');
    };

    Account.prototype.sign_out = function() {
      var options,
        _this = this;
      options = {
        success: function() {
          return _this.app.trigger('account:sign_out');
        }
      };
      return this._request('DELETE', '/_session', null, options);
    };

    Account.prototype.logout = Account.prototype.sign_out;

    Account.prototype._request = function(type, path, data, _options) {
      var options;
      if (_options == null) _options = {};
      options = {
        type: type,
        url: "" + this.app.couchDB_url + path,
        xhrFields: {
          withCredentials: true
        },
        crossDomain: true
      };
      options = $.extend(options, _options);
      if (data) options.data = JSON.stringify(data);
      if (type === 'PUT' || type === 'POST') {
        options.contentType = "application/json";
      }
      return $.ajax(options);
    };

    return Account;

  })();
});
