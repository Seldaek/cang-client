
define('account', function() {
  'use strict';
  var Account;
  return Account = (function() {

    function Account(app) {
      this.app = app;
    }

    Account.prototype.sign_up = function(email, password) {
      var key, prefix,
        _this = this;
      prefix = 'org.couchdb.user';
      key = "" + prefix + ":" + email;
      return this.app.request('PUT', "/_users/" + (encodeURIComponent(key)), {
        data: {
          _id: key,
          name: email,
          type: 'user',
          roles: [],
          password: password
        },
        success: function() {
          _this.app.trigger('account:sign_up');
          return _this.app.trigger('account:sign_in');
        }
      });
    };

    Account.prototype.sign_in = function(email, password) {
      var _this = this;
      return this.app.request('POST', '/_session', {
        data: {
          name: email,
          password: password
        },
        success: function() {
          return _this.app.trigger('account:sign_in');
        }
      });
    };

    Account.prototype.login = Account.prototype.sign_in;

    Account.prototype.change_password = function(current_password, new_password) {
      return alert('change password is not yet implementd');
    };

    Account.prototype.sign_out = function() {
      var _this = this;
      return this.app.request('DELETE', '/_session', {
        success: function() {
          return _this.app.trigger('account:sign_out');
        }
      });
    };

    Account.prototype.logout = Account.prototype.sign_out;

    return Account;

  })();
});
