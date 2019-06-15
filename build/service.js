(function() {
  var ALWAYS_AUTH, CLASSKEYS, CLASSKEY_PATH, DEFAULT_ERROR_HANDLER, DEFAULT_PROTOCOL, ENRICHMENT_PATH, HAS_PROTOCOL, HAS_SUFFIX, IDResolutionJob, ID_RESOLUTION_PATH, LISTS_PATH, LIST_OPERATION_PATHS, LIST_PIPE, List, MODELS, MODEL_PATH, Model, NEEDS_AUTH, NO_AUTH, PATH_VALUES_PATH, PREF_PATH, Promise, QUERY_RESULTS_PATH, QUICKSEARCH_PATH, Query, RELEASES, RELEASE_PATH, REQUIRES_VERSION, Registry, SUBTRACT_PATH, SUFFIX, SUMMARYFIELDS_PATH, SUMMARY_FIELDS, Service, TABLE_ROW_PATH, TEMPLATES_PATH, TO_NAMES, USER_TOKENS, User, VERSIONS, VERSION_PATH, WHOAMI_PATH, WIDGETS, WIDGETS_PATH, WITH_OBJ_PATH, _get_or_fetch, dejoin, error, get, getListFinder, http, i, invoke, j, len, len1, map, merge, p, ref, ref1, set, success, to_query_string, utils, version, withCB,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  Promise = require('./promise');

  Model = require('./model').Model;

  Query = require('./query').Query;

  List = require('./lists').List;

  User = require('./user').User;

  Registry = require('./registry').Registry;

  IDResolutionJob = require('./id-resolution-job').IDResolutionJob;

  version = require('./version');

  utils = require('./util');

  http = require('./http');

  to_query_string = utils.querystring;

  withCB = utils.withCB, map = utils.map, merge = utils.merge, get = utils.get, set = utils.set, invoke = utils.invoke, success = utils.success, error = utils.error, REQUIRES_VERSION = utils.REQUIRES_VERSION, dejoin = utils.dejoin;

  VERSIONS = {};

  CLASSKEYS = {};

  RELEASES = {};

  MODELS = {};

  SUMMARY_FIELDS = {};

  WIDGETS = {};

  DEFAULT_PROTOCOL = "http://";

  VERSION_PATH = "version";

  TEMPLATES_PATH = "templates";

  RELEASE_PATH = "version/release";

  CLASSKEY_PATH = "classkeys";

  LISTS_PATH = "lists";

  MODEL_PATH = "model";

  SUMMARYFIELDS_PATH = "summaryfields";

  QUERY_RESULTS_PATH = "query/results";

  QUICKSEARCH_PATH = "search";

  WIDGETS_PATH = "widgets";

  ENRICHMENT_PATH = "list/enrichment";

  WITH_OBJ_PATH = "listswithobject";

  LIST_OPERATION_PATHS = {
    union: "lists/union",
    intersection: "lists/intersect",
    difference: "lists/diff"
  };

  SUBTRACT_PATH = 'lists/subtract';

  WHOAMI_PATH = "user/whoami";

  TABLE_ROW_PATH = QUERY_RESULTS_PATH + '/tablerows';

  PREF_PATH = 'user/preferences';

  PATH_VALUES_PATH = 'path/values';

  USER_TOKENS = 'user/tokens';

  ID_RESOLUTION_PATH = 'ids';

  NO_AUTH = {};

  ref = [VERSION_PATH, RELEASE_PATH, CLASSKEY_PATH, WIDGETS_PATH, MODEL_PATH, SUMMARYFIELDS_PATH, QUICKSEARCH_PATH, PATH_VALUES_PATH];
  for (i = 0, len = ref.length; i < len; i++) {
    p = ref[i];
    NO_AUTH[p] = true;
  }

  ALWAYS_AUTH = {};

  ref1 = [WHOAMI_PATH, PREF_PATH, LIST_OPERATION_PATHS, SUBTRACT_PATH, WITH_OBJ_PATH, ENRICHMENT_PATH, TEMPLATES_PATH, USER_TOKENS];
  for (j = 0, len1 = ref1.length; j < len1; j++) {
    p = ref1[j];
    ALWAYS_AUTH[p] = true;
  }

  NEEDS_AUTH = function(path, q) {
    if (NO_AUTH[path]) {
      return false;
    } else if (ALWAYS_AUTH[path]) {
      return true;
    } else if (!(q != null ? q.needsAuthentication : void 0)) {
      return true;
    } else {
      return q.needsAuthentication();
    }
  };

  HAS_PROTOCOL = /^https?:\/\//i;

  HAS_SUFFIX = /service\/?$/i;

  SUFFIX = "/service/";

  DEFAULT_ERROR_HANDLER = function(e) {
    var f, ref2;
    f = (ref2 = console.error) != null ? ref2 : console.log;
    return f(e);
  };

  _get_or_fetch = function(propName, store, path, key, cb) {
    var opts, promise, ref2, root, useCache, value;
    ref2 = this, root = ref2.root, useCache = ref2.useCache;
    promise = this[propName] != null ? this[propName] : this[propName] = (useCache && (value = store[root])) ? success(value) : (opts = {
      type: 'GET',
      dataType: 'json',
      data: {
        format: 'json'
      }
    }, this.doReq(merge(opts, {
      url: this.root + path
    })).then(function(x) {
      return store[root] = x[key];
    }));
    return withCB(cb, promise);
  };

  getListFinder = function(name) {
    return function(lists) {
      return new Promise(function(resolve, reject) {
        var list;
        if (list = utils.find(lists, function(l) {
          return l.name === name;
        })) {
          return resolve(list);
        } else {
          return reject("List \"" + name + "\" not found among: " + (lists.map(get('name'))));
        }
      });
    };
  };

  LIST_PIPE = function(service, prop) {
    if (prop == null) {
      prop = 'listName';
    }
    return utils.compose(service.fetchList, get(prop));
  };

  TO_NAMES = function(xs) {
    var len2, n, ref2, ref3, results, x;
    if (xs == null) {
      xs = [];
    }
    ref2 = (utils.isArray(xs) ? xs : [xs]);
    results = [];
    for (n = 0, len2 = ref2.length; n < len2; n++) {
      x = ref2[n];
      results.push((ref3 = x.name) != null ? ref3 : x);
    }
    return results;
  };

  Service = (function() {
    var FIVE_MIN, checkNameParam, getNewUserToken, loadQ, pathValuesReq, toMapByName;

    Service.prototype.doReq = function() {
      arguments[0] = this.attachCustomHeaders(arguments[0]);
      return http.doReq.apply(this, arguments);
    };

    function Service(arg) {
      var noCache;
      this.root = arg.root, this.token = arg.token, this.errorHandler = arg.errorHandler, this.DEBUG = arg.DEBUG, this.help = arg.help, noCache = arg.noCache, this.headers = arg.headers;
      this.connectAs = bind(this.connectAs, this);
      this.createList = bind(this.createList, this);
      this.resolveIds = bind(this.resolveIds, this);
      this.templateQuery = bind(this.templateQuery, this);
      this.savedQuery = bind(this.savedQuery, this);
      this.query = bind(this.query, this);
      this.fetchRelease = bind(this.fetchRelease, this);
      this.fetchClassKeys = bind(this.fetchClassKeys, this);
      this.fetchVersion = bind(this.fetchVersion, this);
      this.fetchSummaryFields = bind(this.fetchSummaryFields, this);
      this.fetchModel = bind(this.fetchModel, this);
      this.fetchWidgetMap = bind(this.fetchWidgetMap, this);
      this.fetchWidgets = bind(this.fetchWidgets, this);
      this.complement = bind(this.complement, this);
      this.fetchListsContaining = bind(this.fetchListsContaining, this);
      this.fetchList = bind(this.fetchList, this);
      this.findLists = bind(this.findLists, this);
      this.fetchLists = bind(this.fetchLists, this);
      this.fetchTemplates = bind(this.fetchTemplates, this);
      this.tableRows = bind(this.tableRows, this);
      this.values = bind(this.values, this);
      this.rows = bind(this.rows, this);
      this.records = bind(this.records, this);
      this.table = bind(this.table, this);
      this.pathValues = bind(this.pathValues, this);
      this.fetchUser = bind(this.fetchUser, this);
      this.whoami = bind(this.whoami, this);
      this.findById = bind(this.findById, this);
      this.count = bind(this.count, this);
      this.enrichment = bind(this.enrichment, this);
      if (this.root == null) {
        throw new Error("No service root provided. This is required");
      }
      if (!HAS_PROTOCOL.test(this.root)) {
        this.root = DEFAULT_PROTOCOL + this.root;
      }
      if (!HAS_SUFFIX.test(this.root)) {
        this.root = this.root + SUFFIX;
      }
      this.root = this.root.replace(/ice$/, "ice/");
      if (this.headers == null) {
        this.headers = null;
      }
      if (this.errorHandler == null) {
        this.errorHandler = DEFAULT_ERROR_HANDLER;
      }
      if (this.help == null) {
        this.help = 'no.help.available@dev.null';
      }
      this.useCache = !noCache;
      this.getFormat = function(intended) {
        if (intended == null) {
          intended = 'json';
        }
        return intended;
      };
    }

    Service.prototype.post = function(path, data) {
      return this.makeRequest('POST', path, data);
    };

    Service.prototype.get = function(path, data) {
      return this.makeRequest('GET', path, data);
    };

    Service.prototype.makeRequest = function(method, path, data, cb, indiv) {
      var dataType, errBack, opts, ref2, ref3, ref4, timeout;
      if (method == null) {
        method = 'GET';
      }
      if (path == null) {
        path = '';
      }
      if (data == null) {
        data = {};
      }
      if (cb == null) {
        cb = (function() {});
      }
      if (indiv == null) {
        indiv = false;
      }
      if (utils.isArray(cb)) {
        ref2 = cb, cb = ref2[0], errBack = ref2[1];
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
        ref3 = [method, http.getMethod(method)], data.method = ref3[0], method = ref3[1];
      }
      opts = {
        data: data,
        dataType: dataType,
        success: cb,
        error: errBack,
        path: path,
        type: method
      };
      if (data.auth != null) {
        opts.auth = data.auth;
        delete opts.data.auth;
      }
      if (data.headers != null) {
        opts.headers = utils.copy(data.headers);
        delete opts.data.headers;
      }
      if (timeout = (ref4 = data.timeout) != null ? ref4 : this.timeout) {
        opts.timeout = timeout;
        delete data.timeout;
      }
      return this.authorise(opts).then((function(_this) {
        return function(authed) {
          return _this.doReq(authed, indiv);
        };
      })(this));
    };

    Service.prototype.authorise = function(req) {
      return this.fetchVersion().then((function(_this) {
        return function(version) {
          var opts, pathAdditions, ref2;
          opts = utils.copy(req);
          if (opts.headers == null) {
            opts.headers = {};
          }
          opts.url = _this.root + opts.path;
          pathAdditions = [];
          if (version < 14) {
            if ('string' === typeof opts.data) {
              pathAdditions.push(['format', opts.dataType]);
            } else {
              opts.data.format = opts.dataType;
            }
          }
          if ((_this.token != null) && NEEDS_AUTH(req.path, (ref2 = opts.data) != null ? ref2.query : void 0)) {
            if (version >= 14) {
              opts.headers.Authorization = "Token " + _this.token;
            } else if ('string' === typeof opts.data) {
              pathAdditions.push(['token', _this.token]);
            } else {
              opts.data.token = _this.token;
            }
          }
          if (pathAdditions.length) {
            opts.url += '?' + to_query_string(pathAdditions);
          }
          return opts;
        };
      })(this));
    };

    Service.prototype.attachCustomHeaders = function(req) {
      var opts;
      if (this.headers != null) {
        opts = utils.copy(req);
        opts.headers = utils.merge(opts.headers, this.headers);
        return opts;
      } else {
        return req;
      }
    };

    Service.prototype.enrichment = function(opts, cb) {
      return REQUIRES_VERSION(this, 8, (function(_this) {
        return function() {
          var req;
          req = merge({
            maxp: 0.05,
            correction: 'Holm-Bonferroni'
          }, opts);
          return withCB(cb, _this.get(ENRICHMENT_PATH, req).then(get('results')));
        };
      })(this));
    };

    Service.prototype.search = function(options, cb) {
      if (options == null) {
        options = {};
      }
      if (cb == null) {
        cb = (function() {});
      }
      return REQUIRES_VERSION(this, 9, (function(_this) {
        return function() {
          var k, ref2, req, v;
          if (utils.isFunction(options)) {
            ref2 = [options, {}], cb = ref2[0], options = ref2[1];
          }
          if (typeof options === 'string') {
            req = {
              q: options
            };
          } else {
            req = {
              q: options.q,
              start: options.start,
              size: options.size
            };
            for (k in options) {
              if (!hasProp.call(options, k)) continue;
              v = options[k];
              if ((k !== 'q') && (k !== 'start') && (k !== 'size')) {
                req["facet_" + k] = v;
              }
            }
          }
          return withCB(cb, _this.post(QUICKSEARCH_PATH, req));
        };
      })(this));
    };

    Service.prototype.makePath = function(path, subclasses, cb) {
      if (subclasses == null) {
        subclasses = {};
      }
      if (cb == null) {
        cb = (function() {});
      }
      return withCB(cb, this.fetchModel().then(function(m) {
        return m.makePath(path, subclasses);
      }));
    };

    Service.prototype.count = function(q, cb) {
      var promise, req;
      if (cb == null) {
        cb = (function() {});
      }
      promise = !q ? error("Not enough arguments") : q.toPathString != null ? (p = q.isClass() ? q.append('id') : q, this.pathValues(p, 'count')) : q.toXML != null ? (req = {
        query: q,
        format: 'jsoncount'
      }, this.post(QUERY_RESULTS_PATH, req).then(get('count'))) : typeof q === 'string' ? this.fetchModel().then((function(_this) {
        return function(m) {
          var e;
          try {
            return _this.count(m.makePath(q));
          } catch (error1) {
            e = error1;
            return _this.query({
              select: [q]
            }).then(_this.count);
          }
        };
      })(this)) : this.query(q).then(this.count);
      return withCB(cb, promise);
    };

    Service.prototype.findById = function(type, id, fields, cb) {
      var promise, ref2;
      if (fields == null) {
        fields = ['**'];
      }
      if (cb == null) {
        cb = (function() {});
      }
      if (utils.isFunction(fields)) {
        ref2 = [['**'], fields], fields = ref2[0], cb = ref2[1];
      }
      promise = this.query({
        from: type,
        select: fields,
        where: {
          id: id
        }
      }).then(dejoin).then(invoke('records')).then(get(0));
      return withCB(cb, promise);
    };

    Service.prototype.lookup = function(type, term, context, cb) {
      var promise, ref2;
      if (utils.isFunction(context)) {
        ref2 = [null, context], context = ref2[0], cb = ref2[1];
      }
      promise = this.query({
        from: type,
        select: ['**'],
        where: [[type, 'LOOKUP', term, context]]
      }).then(dejoin).then(invoke('records'));
      return withCB(cb, promise);
    };

    Service.prototype.find = function(type, term, context, cb) {
      var ref2;
      if (utils.isFunction(context)) {
        ref2 = [null, context], context = ref2[0], cb = ref2[1];
      }
      return withCB(cb, this.lookup(type, term, context).then(function(found) {
        if ((found == null) || found.length === 0) {
          return error("Nothing found");
        } else if (found.length > 1) {
          return error("Multiple items found: " + (found.slice(0, 3)) + "...");
        } else {
          return success(found[0]);
        }
      }));
    };

    Service.prototype.whoami = function(cb) {
      return REQUIRES_VERSION(this, 9, (function(_this) {
        return function() {
          return withCB(cb, _this.get(WHOAMI_PATH).then(get('user')).then(function(x) {
            return new User(_this, x);
          }));
        };
      })(this));
    };

    Service.prototype.fetchUser = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return this.whoami.apply(this, args);
    };

    pathValuesReq = function(format, path) {
      return {
        format: format,
        path: String(path),
        typeConstraints: JSON.stringify(path.subclasses)
      };
    };

    Service.prototype.pathValues = function(path, typeConstraints, cb) {
      if (typeConstraints == null) {
        typeConstraints = {};
      }
      return REQUIRES_VERSION(this, 6, (function(_this) {
        return function() {
          var e, format, promise, ref2, wanted;
          if (typeof typeConstraints === 'string') {
            wanted = typeConstraints;
            typeConstraints = {};
          }
          if (utils.isFunction(typeConstraints)) {
            ref2 = [cb, typeConstraints], typeConstraints = ref2[0], cb = ref2[1];
          }
          if (wanted !== 'count') {
            wanted = 'results';
          }
          format = wanted === 'count' ? 'jsoncount' : 'json';
          promise = (function() {
            var ref3;
            try {
              return this.fetchModel().then(invoke('makePath', path, (ref3 = path.subclasses) != null ? ref3 : typeConstraints)).then(function(path) {
                return pathValuesReq(format, path);
              }).then((function(_this) {
                return function(req) {
                  return _this.post(PATH_VALUES_PATH, req);
                };
              })(this)).then(get(wanted));
            } catch (error1) {
              e = error1;
              return error(e);
            }
          }).call(_this);
          return withCB(cb, promise);
        };
      })(this));
    };

    Service.prototype.doPagedRequest = function(q, path, page, format, cb) {
      var ref2, req;
      if (page == null) {
        page = {};
      }
      if (cb == null) {
        cb = (function() {});
      }
      if (q.toXML != null) {
        if (utils.isFunction(page)) {
          ref2 = [page, {}], cb = ref2[0], page = ref2[1];
        }
        req = merge(page, {
          query: q,
          format: format
        });
        return withCB(cb, this.post(path, req).then(get('results')));
      } else {
        return this.query(q).then((function(_this) {
          return function(query) {
            return _this.doPagedRequest(query, path, page, format, cb);
          };
        })(this));
      }
    };

    Service.prototype.table = function(q, page, cb) {
      return this.doPagedRequest(q, QUERY_RESULTS_PATH, page, 'jsontable', cb);
    };

    Service.prototype.records = function(q, page, cb) {
      return this.doPagedRequest(q, QUERY_RESULTS_PATH, page, 'jsonobjects', cb);
    };

    Service.prototype.rows = function(q, page, cb) {
      return this.doPagedRequest(q, QUERY_RESULTS_PATH, page, 'json', cb);
    };

    Service.prototype.values = function(q, opts, cb) {
      var ref2, resp;
      if (utils.isFunction(opts)) {
        ref2 = [opts, cb], cb = ref2[0], opts = ref2[1];
      }
      resp = q == null ? error("No query term supplied") : (q.descriptors != null) || typeof q === 'string' ? this.pathValues(q, opts).then(map(get('value'))) : q.toXML != null ? q.views.length !== 1 ? error("Expected one column, got " + q.views.length) : this.rows(q, opts).then(map(get(0))) : this.query(q).then((function(_this) {
        return function(query) {
          return _this.values(query, opts);
        };
      })(this));
      return withCB(cb, resp);
    };

    Service.prototype.tableRows = function(q, page, cb) {
      return this.doPagedRequest(q, TABLE_ROW_PATH, page, 'json', cb);
    };

    Service.prototype.fetchTemplates = function(cb) {
      return withCB(cb, this.get(TEMPLATES_PATH).then(get('templates')));
    };

    Service.prototype.fetchLists = function(cb) {
      return this.findLists('', cb);
    };

    Service.prototype.findLists = function(name, cb) {
      if (name == null) {
        name = '';
      }
      if (cb == null) {
        cb = (function() {});
      }
      return this.fetchVersion().then((function(_this) {
        return function(v) {
          var fn;
          return withCB(cb, name && v < 13 ? error("Finding lists by name on the server requires version 13. This is only " + v) : (fn = function(ls) {
            var data, len2, n, results;
            results = [];
            for (n = 0, len2 = ls.length; n < len2; n++) {
              data = ls[n];
              results.push(new List(data, _this));
            }
            return results;
          }, _this.get(LISTS_PATH, {
            name: name
          }).then(get('lists')).then(fn)));
        };
      })(this));
    };

    Service.prototype.fetchList = function(name, cb) {
      return this.fetchVersion().then((function(_this) {
        return function(v) {
          return withCB(cb, v < 13 ? _this.findLists().then(getListFinder(name)) : _this.findLists(name).then(get(0)));
        };
      })(this));
    };

    Service.prototype.fetchListsContaining = function(opts, cb) {
      var fn;
      fn = (function(_this) {
        return function(xs) {
          var len2, n, results, x;
          results = [];
          for (n = 0, len2 = xs.length; n < len2; n++) {
            x = xs[n];
            results.push(new List(x, _this));
          }
          return results;
        };
      })(this);
      return withCB(cb, this.get(WITH_OBJ_PATH, opts).then(get('lists')).then(fn));
    };

    Service.prototype.combineLists = function(operation, options, cb) {
      var description, lists, name, ref2, req, tags;
      ref2 = merge({
        lists: [],
        tags: []
      }, options), name = ref2.name, lists = ref2.lists, tags = ref2.tags, description = ref2.description;
      req = {
        name: name,
        description: description
      };
      if (req.description == null) {
        req.description = operation + " of " + (lists.join(', '));
      }
      req.tags = tags.join(';');
      req.lists = lists.join(';');
      return withCB(cb, this.get(LIST_OPERATION_PATHS[operation], req).then(LIST_PIPE(this)));
    };

    Service.prototype.merge = function() {
      return this.combineLists.apply(this, ['union'].concat(slice.call(arguments)));
    };

    Service.prototype.intersect = function() {
      return this.combineLists.apply(this, ['intersection'].concat(slice.call(arguments)));
    };

    Service.prototype.diff = function() {
      return this.combineLists.apply(this, ['difference'].concat(slice.call(arguments)));
    };

    Service.prototype.complement = function(options, cb) {
      var defaultDesc, description, exclude, from, lists, name, references, req, tags;
      if (options == null) {
        options = {};
      }
      if (cb == null) {
        cb = function() {};
      }
      from = options.from, exclude = options.exclude, name = options.name, description = options.description, tags = options.tags;
      defaultDesc = function() {
        return "Relative complement of " + (lists.join(' and ')) + " in " + (references.join(' and '));
      };
      references = TO_NAMES(from);
      lists = TO_NAMES(exclude);
      if (name == null) {
        name = defaultDesc();
      }
      if (description == null) {
        description = defaultDesc();
      }
      if (tags == null) {
        tags = [];
      }
      req = {
        name: name,
        description: description,
        tags: tags,
        lists: lists,
        references: references
      };
      return withCB(cb, this.post(SUBTRACT_PATH, req).then(LIST_PIPE(this)));
    };

    Service.prototype.fetchWidgets = function(cb) {
      return REQUIRES_VERSION(this, 8, (function(_this) {
        return function() {
          return _get_or_fetch.call(_this, 'widgets', WIDGETS, WIDGETS_PATH, 'widgets', cb);
        };
      })(this));
    };

    toMapByName = utils.omap(function(w) {
      return [w.name, w];
    });

    Service.prototype.fetchWidgetMap = function(cb) {
      return REQUIRES_VERSION(this, 8, (function(_this) {
        return function() {
          return withCB(cb, (_this.__wmap__ != null ? _this.__wmap__ : _this.__wmap__ = _this.fetchWidgets().then(toMapByName)));
        };
      })(this));
    };

    Service.prototype.fetchModel = function(cb) {
      var ret;
      ret = _get_or_fetch.call(this, 'model', MODELS, MODEL_PATH, 'model').then(Model.load).then(set({
        service: this
      }));
      return withCB(cb, ret);
    };

    Service.prototype.fetchSummaryFields = function(cb) {
      return _get_or_fetch.call(this, 'summaryFields', SUMMARY_FIELDS, SUMMARYFIELDS_PATH, 'classes', cb);
    };

    Service.prototype.fetchVersion = function(cb) {
      return _get_or_fetch.call(this, 'version', VERSIONS, VERSION_PATH, 'version', cb);
    };

    Service.prototype.fetchClassKeys = function(cb) {
      return _get_or_fetch.call(this, 'classkeys', CLASSKEYS, CLASSKEY_PATH, 'classes', cb);
    };

    Service.prototype.fetchRelease = function(cb) {
      return _get_or_fetch.call(this, 'release', RELEASES, RELEASE_PATH, 'version', cb);
    };

    Service.prototype.query = function(options, cb) {
      var buildQuery;
      buildQuery = (function(_this) {
        return function(arg) {
          var model, summaryFields;
          model = arg[0], summaryFields = arg[1];
          return new Query(options, _this, {
            model: model,
            summaryFields: summaryFields
          });
        };
      })(this);
      return withCB(cb, utils.parallel(this.fetchModel(), this.fetchSummaryFields()).then(buildQuery));
    };

    loadQ = function(service, name) {
      return function(q) {
        if (!q) {
          return error("No query found called " + name);
        }
        return service.query(q);
      };
    };

    checkNameParam = function(name) {
      if (name) {
        if ('string' === typeof name) {
          return success();
        } else {
          return error("Name must be a string");
        }
      } else {
        return error("Name not provided");
      }
    };

    Service.prototype.savedQuery = function(name, cb) {
      return REQUIRES_VERSION(this, 16, (function(_this) {
        return function() {
          return checkNameParam(name).then(function() {
            return withCB(cb, _this.get('user/queries', {
              filter: name
            }).then(function(r) {
              return r.queries[name];
            }).then(loadQ(_this, name)));
          });
        };
      })(this));
    };

    Service.prototype.templateQuery = function(name, cb) {
      return checkNameParam(name).then((function(_this) {
        return function() {
          return withCB(cb, _this.fetchTemplates().then(get(name)).then(set('type', 'TEMPLATE')).then(loadQ(_this, name)));
        };
      })(this));
    };

    Service.prototype.manageUserPreferences = function(method, data, cb) {
      return REQUIRES_VERSION(this, 11, (function(_this) {
        return function() {
          return withCB(cb, _this.makeRequest(method, PREF_PATH, data).then(get('preferences')));
        };
      })(this));
    };

    Service.prototype.resolveIds = function(opts, cb) {
      return REQUIRES_VERSION(this, 10, (function(_this) {
        return function() {
          var req;
          req = {
            type: 'POST',
            url: _this.root + ID_RESOLUTION_PATH,
            contentType: 'application/json',
            data: JSON.stringify(opts),
            dataType: 'json'
          };
          return withCB(cb, _this.doReq(req).then(get('uid')).then(IDResolutionJob.create(_this)));
        };
      })(this));
    };

    Service.prototype.resolutionJob = function(id) {
      return IDResolutionJob.create(this)(id);
    };

    Service.prototype.createList = function(opts, ids, cb) {
      var adjust, req;
      if (opts == null) {
        opts = {};
      }
      if (ids == null) {
        ids = '';
      }
      if (cb == null) {
        cb = function() {};
      }
      adjust = (function(_this) {
        return function(x) {
          return merge(x, {
            token: _this.token,
            tags: opts.tags || []
          });
        };
      })(this);
      req = {
        data: utils.isArray(ids) ? ids.map(function(x) {
          return "\"" + x + "\"";
        }).join("\n") : ids,
        dataType: 'json',
        url: this.root + "lists?" + (to_query_string(adjust(opts))),
        type: 'POST',
        contentType: 'text/plain'
      };
      return withCB(cb, this.doReq(req).then(LIST_PIPE(this)));
    };

    getNewUserToken = function(resp) {
      return resp.user.temporaryToken;
    };

    Service.prototype.connectAs = function(token) {
      return Service.connect(merge(this, {
        token: token,
        noCache: !this.useCache
      }));
    };

    Service.prototype.register = function(name, password, cb) {
      return REQUIRES_VERSION(this, 9, (function(_this) {
        return function() {
          return withCB(cb, _this.post('users', {
            name: name,
            password: password
          }).then(getNewUserToken).then(_this.connectAs));
        };
      })(this));
    };

    FIVE_MIN = 5 * 60;

    Service.prototype.getDeregistrationToken = function(validity, cb) {
      if (validity == null) {
        validity = FIVE_MIN;
      }
      return REQUIRES_VERSION(this, 16, (function(_this) {
        return function() {
          var promise;
          promise = _this.token != null ? _this.post('user/deregistration', {
            validity: validity
          }).then(get('token')) : error("Not registered");
          return withCB(cb, promise);
        };
      })(this));
    };

    Service.prototype.deregister = function(token, cb) {
      return REQUIRES_VERSION(this, 16, (function(_this) {
        return function() {
          return withCB(cb, _this.makeRequest('DELETE', 'user', {
            deregistrationToken: token,
            format: 'xml'
          }));
        };
      })(this));
    };

    Service.prototype.login = function(name, password, cb) {
      return REQUIRES_VERSION(this, 9, (function(_this) {
        return function() {
          var auth;
          auth = name + ":" + password;
          return withCB(cb, _this.logout().then(function(service) {
            return service.get('user/token', {
              auth: auth
            });
          })).then(get('token')).then(_this.connectAs);
        };
      })(this));
    };

    Service.prototype.logout = function(cb) {
      return withCB(cb, success(this.connectAs()));
    };

    return Service;

  })();

  Service.prototype.rowByRow = function() {
    var args, f, q;
    q = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    f = http.iterReq('POST', QUERY_RESULTS_PATH, 'json');
    if (q.toXML != null) {
      return f.apply(this, arguments);
    } else {
      return this.query(q).then((function(_this) {
        return function(query) {
          return _this.rowByRow.apply(_this, [query].concat(slice.call(args)));
        };
      })(this));
    }
  };

  Service.prototype.eachRow = Service.prototype.rowByRow;

  Service.prototype.recordByRecord = function() {
    var args, f, q;
    q = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    f = http.iterReq('POST', QUERY_RESULTS_PATH, 'jsonobjects');
    if (q.toXML != null) {
      return f.apply(this, arguments);
    } else {
      return this.query(q).then((function(_this) {
        return function(query) {
          return _this.recordByRecord.apply(_this, [query].concat(slice.call(args)));
        };
      })(this));
    }
  };

  Service.prototype.eachRecord = Service.prototype.recordByRecord;

  Service.prototype.union = Service.prototype.merge;

  Service.prototype.difference = Service.prototype.diff;

  Service.prototype.symmetricDifference = Service.prototype.diff;

  Service.prototype.relativeComplement = Service.prototype.complement;

  Service.prototype.subtract = Service.prototype.complement;

  Service.flushCaches = function() {
    MODELS = {};
    VERSIONS = {};
    RELEASES = {};
    CLASSKEYS = {};
    SUMMARY_FIELDS = {};
    return WIDGETS = {};
  };

  Service.connect = function(opts) {
    if ((opts != null ? opts.root : void 0) == null) {
      throw new Error("Invalid options provided: " + (JSON.stringify(opts)));
    }
    return new Service(opts);
  };

  exports.Service = Service;

  exports.Model = Model;

  exports.Query = Query;

  exports.Registry = Registry;

  exports.utils = utils;

  exports.VERSION = version.VERSION;

  exports.imjs = version;

}).call(this);
