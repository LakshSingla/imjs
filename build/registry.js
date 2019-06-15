(function() {
  var INSTANCES_PATH, ROOT, Registry, doReq, get, http, merge, querystring, utils, withCB,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  querystring = require('querystring');

  utils = require('./util');

  http = require('./http');

  withCB = utils.withCB, get = utils.get;

  doReq = http.doReq, merge = http.merge;

  ROOT = "http://registry.intermine.org/service/";

  INSTANCES_PATH = "instances";

  Registry = (function() {
    function Registry() {
      this.fetchMines = bind(this.fetchMines, this);
      this.makePath = bind(this.makePath, this);
    }

    Registry.prototype.getFormat = function(intended) {
      if (intended == null) {
        intended = 'json';
      }
      return intended;
    };

    Registry.prototype.isEmpty = function(obj) {
      return (Object.entries(obj)).length === 0 && obj.constructor === Object;
    };

    Registry.prototype.errorHandler = function(e) {
      var f, ref;
      f = (ref = console.error) != null ? ref : console.log;
      return f(e);
    };

    Registry.prototype.makePath = function(path, params) {
      var paramString;
      if (path == null) {
        path = '';
      }
      if (params == null) {
        params = {};
      }
      paramString = this.isEmpty(params) ? '' : '?' + querystring.stringify(params);
      return ROOT + path + paramString;
    };

    Registry.prototype.makeRequest = function(method, path, urlParams, data, cb) {
      var dataType, errBack, opts, ref, ref1;
      if (method == null) {
        method = 'GET';
      }
      if (path == null) {
        path = '';
      }
      if (urlParams == null) {
        urlParams = {};
      }
      if (data == null) {
        data = {};
      }
      if (cb == null) {
        cb = function() {};
      }
      if (utils.isArray(cb)) {
        ref = cb, cb = ref[0], errBack = ref[1];
      }
      if (utils.isArray(data)) {
        data = utils.pairsToObj(data);
      }
      if (errBack == null) {
        errBack = this.errorHandler;
      }
      data = utils.copy(data);
      dataType = this.getFormat(data.format);
      if (!http.supports(method)) {
        ref1 = [method, http.getMethod(method)], data.method = ref1[0], method = ref1[1];
      }
      opts = {
        data: data,
        dataType: dataType,
        type: method,
        url: this.makePath(path, urlParams)
      };
      return withCB(cb, http.doReq.call(this, opts));
    };

    Registry.prototype.fetchMines = function(q, mines, cb) {
      var params;
      if (q == null) {
        q = [];
      }
      if (mines == null) {
        mines = [];
      }
      if (cb == null) {
        cb = function() {};
      }
      if (!mines.every(function(mine) {
        return mine === "dev" || mine === "prod" || mine === "all";
      })) {
        return withCB(cb, new Promise(function(resolve, reject) {
          return reject("Mines field should only contain 'dev', 'prod' or 'all'");
        }));
      }
      params = {};
      if (q !== []) {
        params['q'] = q.join(' ');
      }
      if (mines !== []) {
        params['mines'] = mines.join(' ');
      }
      return this.makeRequest('GET', INSTANCES_PATH, params, {}, cb);
    };

    return Registry;

  })();

  exports.Registry = Registry;

}).call(this);
