(function() {
  var any, do_pref_req, error, get, isFunction, ref, withCB,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  ref = require('./util'), withCB = ref.withCB, get = ref.get, isFunction = ref.isFunction, any = ref.any, error = ref.error;

  do_pref_req = function(user, data, method, cb) {
    return user.service.manageUserPreferences(method, data, cb).then(function(prefs) {
      return user.preferences = prefs;
    });
  };

  exports.User = (function() {
    function User(service, arg) {
      this.service = service;
      this.username = arg.username, this.preferences = arg.preferences;
      this.refresh = bind(this.refresh, this);
      this.clearPreferences = bind(this.clearPreferences, this);
      this.clearPreference = bind(this.clearPreference, this);
      this.setPreferences = bind(this.setPreferences, this);
      this.setPreference = bind(this.setPreference, this);
      this.hasPreferences = this.preferences != null;
      if (this.preferences == null) {
        this.preferences = {};
      }
    }

    User.prototype.setPreference = function(key, value, cb) {
      var data, ref1;
      if (isFunction(value)) {
        ref1 = [null, value], value = ref1[0], cb = ref1[1];
      }
      if (typeof key === 'string') {
        data = {};
        data[key] = value;
      } else if (value == null) {
        data = key;
      } else {
        return withCB(cb, error("Incorrect arguments to setPreference"));
      }
      return this.setPreferences(data, cb);
    };

    User.prototype.setPreferences = function(prefs, cb) {
      return do_pref_req(this, prefs, 'POST', cb);
    };

    User.prototype.clearPreference = function(key, cb) {
      return do_pref_req(this, {
        key: key
      }, 'DELETE', cb);
    };

    User.prototype.clearPreferences = function(cb) {
      return do_pref_req(this, {}, 'DELETE', cb);
    };

    User.prototype.refresh = function(cb) {
      return do_pref_req(this, {}, 'GET', cb);
    };

    User.prototype.createToken = function(type, message, cb) {
      var ref1, ref2;
      if (type == null) {
        type = 'day';
      }
      if ((cb == null) && any([type, message], isFunction)) {
        if (isFunction(type)) {
          ref1 = [null, null, type], type = ref1[0], message = ref1[1], cb = ref1[2];
        } else if (isFunction(message)) {
          ref2 = [null, message], message = ref2[0], cb = ref2[1];
        }
      }
      return withCB(cb, this.service.post('user/tokens', {
        type: type,
        message: message
      }).then(get('token')));
    };

    User.prototype.fetchCurrentTokens = function(cb) {
      return withCB(cb, this.service.get('user/tokens').then(get('tokens')));
    };

    User.prototype.revokeAllTokens = function(cb) {
      return withCB(cb, this.service.makeRequest('DELETE', 'user/tokens'));
    };

    User.prototype.revokeToken = function(token, cb) {
      return withCB(cb, this.service.makeRequest('DELETE', "user/tokens/" + token));
    };

    return User;

  })();

}).call(this);
