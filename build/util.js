(function() {
  var Promise, REQUIRES, comp, curry, encode, entities, error, flatten, fold, id, invoke, invokeWith, isArray, merge, pairFold, qsFromList, ref, root, success, thenFold,
    slice = [].slice,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    hasProp = {}.hasOwnProperty;

  Promise = require('./promise');

  root = exports;

  root.defer = function() {
    var deferred;
    deferred = {};
    deferred.promise = new Promise(function(resolve, reject) {
      deferred.resolve = resolve;
      return deferred.reject = reject;
    });
    return deferred;
  };

  encode = function(x) {
    return encodeURIComponent(String(x));
  };

  qsFromList = function(pairs) {
    var pair;
    return ((function() {
      var j, len, results;
      results = [];
      for (j = 0, len = pairs.length; j < len; j++) {
        pair = pairs[j];
        results.push(pair.map(encode).join('='));
      }
      return results;
    })()).join('&');
  };

  root.querystring = function(obj) {
    var k, p, pairs, subList, sv, v;
    if (!obj) {
      return '';
    }
    if (isArray(obj)) {
      pairs = obj.slice();
    } else {
      pairs = [];
      for (k in obj) {
        v = obj[k];
        if (isArray(v)) {
          subList = (function() {
            var j, len, results;
            results = [];
            for (j = 0, len = v.length; j < len; j++) {
              sv = v[j];
              results.push([k, sv]);
            }
            return results;
          })();
          pairs = pairs.concat(subList);
        } else {
          pairs.push([k, v]);
        }
      }
    }
    return qsFromList((function() {
      var j, len, results;
      results = [];
      for (j = 0, len = pairs.length; j < len; j++) {
        p = pairs[j];
        if (p[1] != null) {
          results.push(p);
        }
      }
      return results;
    })());
  };

  root.curry = curry = function() {
    var args, f;
    f = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    return function() {
      var rest;
      rest = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return f.apply(null, args.concat(rest));
    };
  };

  root.error = error = function(e) {
    return new Promise(function(_, reject) {
      return reject(new Error(e));
    });
  };

  root.success = success = function(x) {
    return new Promise(function(resolve, _) {
      return resolve(x);
    });
  };

  root.parallel = function() {
    var promises;
    promises = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    if (promises.length === 1 && (!promises[0].then) && promises[0].length) {
      return Promise.all(promises[0]);
    } else {
      return Promise.all(promises);
    }
  };

  root.withCB = function() {
    var f, fs, j, l, len, onErr, onSucc, p;
    fs = 2 <= arguments.length ? slice.call(arguments, 0, j = arguments.length - 1) : (j = 0, []), p = arguments[j++];
    for (l = 0, len = fs.length; l < len; l++) {
      f = fs[l];
      if (!(f != null)) {
        continue;
      }
      onSucc = curry(f, null);
      onErr = f;
      p.then(onSucc, onErr);
    }
    return p;
  };

  root.fold = fold = function(f) {
    return function(init, xs) {
      var k, ret, v;
      if (arguments.length === 1) {
        xs = (init != null ? init.slice() : void 0) || init;
        init = (xs != null ? xs.shift() : void 0) || {};
      }
      if (xs == null) {
        throw new Error("xs is null");
      }
      if (xs.reduce != null) {
        return xs.reduce(f, init);
      } else {
        ret = init;
        for (k in xs) {
          v = xs[k];
          ret = ret != null ? f(ret, k, v) : {
            k: v
          };
        }
        return ret;
      }
    };
  };

  root.take = function(n) {
    return function(xs) {
      if (n != null) {
        return xs.slice(0, +(n - 1) + 1 || 9e9);
      } else {
        return xs.slice();
      }
    };
  };

  root.filter = function(f) {
    return function(xs) {
      var j, len, results, x;
      results = [];
      for (j = 0, len = xs.length; j < len; j++) {
        x = xs[j];
        if (f(x)) {
          results.push(x);
        }
      }
      return results;
    };
  };

  root.uniqBy = function(f, xs) {
    var j, k, keys, len, values, x;
    if (arguments.length === 1) {
      return curry(root.uniqBy, f);
    }
    keys = [];
    values = [];
    if (xs == null) {
      return values;
    }
    for (j = 0, len = xs.length; j < len; j++) {
      x = xs[j];
      k = f(x);
      if (indexOf.call(keys, k) < 0) {
        keys.push(k);
        values.push(x);
      }
    }
    return values;
  };

  root.find = function(xs, f) {
    var j, len, x;
    if (arguments.length === 1) {
      f = xs;
      return function(xs) {
        return root.find(xs, f);
      };
    }
    for (j = 0, len = xs.length; j < len; j++) {
      x = xs[j];
      if (f(x)) {
        return x;
      }
    }
    return null;
  };

  isArray = (ref = Array.isArray) != null ? ref : function(xs) {
    return ((xs != null ? xs.splice : void 0) != null) && ((xs != null ? xs.push : void 0) != null) && ((xs != null ? xs.pop : void 0) != null) && ((xs != null ? xs.slice : void 0) != null);
  };

  root.isArray = isArray;

  root.isFunction = (typeof /./ !== 'function') ? function(f) {
    return typeof f === 'function';
  } : function(f) {
    return (f != null) && (f.call != null) && (f.apply != null) && f.toString() === '[object Function]';
  };

  entities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;'
  };

  root.escape = function(str) {
    var code, i, j, ref1, ret, withEntities;
    if (str == null) {
      return '';
    }
    withEntities = String(str).replace(/[&<>"']/g, function(entity) {
      return entities[entity];
    });
    ret = [];
    for (i = j = 0, ref1 = withEntities.length; 0 <= ref1 ? j <= ref1 : j >= ref1; i = 0 <= ref1 ? ++j : --j) {
      code = withEntities.charCodeAt(i);
      if (code > 256) {
        ret.push("&#" + code + ";");
      } else {
        ret.push(withEntities.charAt(i));
      }
    }
    return ret.join('');
  };

  root.omap = function(f) {
    var merger;
    merger = fold(function(a, oldk, oldv) {
      var newk, newv, ref1;
      ref1 = f(oldk, oldv), newk = ref1[0], newv = ref1[1];
      if (isArray(newv)) {
        newv = newv.slice();
      }
      a[newk] = newv;
      return a;
    });
    return function(xs) {
      return merger({}, xs);
    };
  };

  root.copy = root.omap(function(k, v) {
    return [k, v];
  });

  root.partition = function(f) {
    return function(xs) {
      var divide;
      divide = fold(function(arg, x) {
        var falses, trues;
        trues = arg[0], falses = arg[1];
        if (f(x)) {
          return [trues.concat([x]), falses];
        } else {
          return [trues, falses.concat([x])];
        }
      });
      return divide([[], []], xs);
    };
  };

  root.merge = function(options, overrides) {
    return extend(extend({}, options), overrides);
  };

  root.extend = function(obj, properties) {
    var key, results, val;
    results = [];
    for (key in properties) {
      val = properties[key];
      results.push(obj[key] = val);
    }
    return results;
  };

  root.id = id = function(x) {
    return x;
  };

  root.concatMap = function(f) {
    return function(xs) {
      var fx, j, len, ret, x;
      ret = void 0;
      for (j = 0, len = xs.length; j < len; j++) {
        x = xs[j];
        fx = f(x);
        ret = ret === void 0 ? fx : typeof ret === 'number' ? ret + fx : ret.concat != null ? ret.concat(fx) : merge(ret, fx);
      }
      return ret;
    };
  };

  root.map = function(f) {
    return invoke('map', f);
  };

  comp = fold(function(f, g) {
    return function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return f(g.apply(null, args));
    };
  });

  root.compose = function() {
    var fs;
    fs = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    return comp(fs);
  };

  root.flatMap = root.concatMap;

  root.difference = function(xs, remove) {
    var j, len, results, x;
    results = [];
    for (j = 0, len = xs.length; j < len; j++) {
      x = xs[j];
      if (indexOf.call(remove, x) < 0) {
        results.push(x);
      }
    }
    return results;
  };

  root.stringList = function(x) {
    if (typeof x === 'string') {
      return [x];
    } else {
      return x;
    }
  };

  root.flatten = flatten = function() {
    var j, l, len, len1, ref1, ret, x, xs, xx;
    xs = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    ret = [];
    for (j = 0, len = xs.length; j < len; j++) {
      x = xs[j];
      if (isArray(x)) {
        ref1 = flatten.apply(null, x);
        for (l = 0, len1 = ref1.length; l < len1; l++) {
          xx = ref1[l];
          ret.push(xx);
        }
      } else {
        ret.push(x);
      }
    }
    return ret;
  };

  root.sum = root.concatMap(id);

  root.merge = merge = function() {
    var j, k, len, newObj, o, objs, v;
    objs = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    newObj = {};
    for (j = 0, len = objs.length; j < len; j++) {
      o = objs[j];
      for (k in o) {
        if (!hasProp.call(o, k)) continue;
        v = o[k];
        newObj[k] = v;
      }
    }
    return newObj;
  };

  root.any = function(xs, f) {
    var j, len, x;
    if (f == null) {
      f = id;
    }
    for (j = 0, len = xs.length; j < len; j++) {
      x = xs[j];
      if (f(x)) {
        return true;
      }
    }
    return false;
  };

  root.invoke = invoke = function() {
    var args, name;
    name = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    return invokeWith(name, args);
  };

  root.invokeWith = invokeWith = function(name, args, ctx) {
    if (args == null) {
      args = [];
    }
    if (ctx == null) {
      ctx = null;
    }
    return function(o) {
      if (o == null) {
        throw new Error("Cannot call method \"" + name + "\" of null");
      }
      if (!o[name]) {
        throw new Error("Cannot call undefined method \"" + name + " of " + o);
      } else {
        return o[name].apply(ctx || o, args);
      }
    };
  };

  root.get = function(name) {
    return function(obj) {
      return obj[name];
    };
  };

  root.set = function(name, value) {
    return function(obj) {
      var k, v;
      if (arguments.length === 2) {
        obj[name] = value;
      } else {
        for (k in name) {
          if (!hasProp.call(name, k)) continue;
          v = name[k];
          obj[k] = v;
        }
      }
      return obj;
    };
  };

  REQUIRES = function(required, got) {
    return "This service requires a service at version " + required + " or above. This one is at " + got;
  };

  root.REQUIRES_VERSION = function(s, n, f) {
    return s.fetchVersion().then(function(v) {
      if (v >= n) {
        return f();
      } else {
        return error(REQUIRES(n, v));
      }
    });
  };

  root.dejoin = function(q) {
    var j, len, parts, ref1, view;
    ref1 = q.views;
    for (j = 0, len = ref1.length; j < len; j++) {
      view = ref1[j];
      parts = view.split('.');
      if (parts.length > 2) {
        q.addJoin(parts.slice(1, -1).join('.'));
      }
    }
    return q;
  };

  thenFold = fold(function(p, f) {
    return p.then(f);
  });

  root.sequence = function() {
    var fns;
    fns = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    return thenFold(success(), fns);
  };

  pairFold = fold(function(o, arg) {
    var k, v;
    k = arg[0], v = arg[1];
    if (o[k] != null) {
      throw new Error("Duplicate key: " + k);
    }
    o[k] = v;
    return o;
  });

  root.pairsToObj = function(pairs) {
    return pairFold({}, pairs);
  };

}).call(this);
