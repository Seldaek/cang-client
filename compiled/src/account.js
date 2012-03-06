
define('account', function() {
  'use strict';
  var Account;
  return Account = (function() {

    function Account(app) {
      this.app = app;
    }

    Account.prototype.sign_up = function(email, password) {
      var key, prefix, user;
      prefix = 'org.couchdb.user';
      key = "" + prefix + ":" + email;
      user = {
        _id: key,
        name: email,
        type: 'user',
        roles: [],
        password: password
      };
      return this._request('PUT', "/_users/" + (encodeURIComponent(key)), user);
    };

    Account.prototype.sign_in = function(email, password) {
      return this._request('POST', '/_session', {
        name: email,
        password: password
      });
    };

    Account.prototype.login = Account.prototype.sign_in;

    Account.prototype.change_password = function(current_password, new_password) {
      return alert('change password is not yet implementd');
    };

    Account.prototype.sign_out = function() {
      return this._request('DELETE', '/_session');
    };

    Account.prototype.logout = Account.prototype.sign_out;

    Account.prototype._request = function(type, path, data) {
      var options;
      options = {
        type: type,
        url: "" + this.app.couchDB_url + path,
        xhrFields: {
          withCredentials: true
        },
        crossDomain: true
      };
      if (data) options.data = JSON.stringify(data);
      if (type === 'PUT' || type === 'POST') {
        options.contentType = "application/json";
      }
      return $.ajax(options);
    };

    return Account;

  })();
});
