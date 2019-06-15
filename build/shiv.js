(function() {
  var HAS_CONSOLE, HAS_JSON, NOT_ENUM, fn, hasDontEnumBug, hasOwnProperty, head, j, len, m, ref, script;

  HAS_CONSOLE = typeof console !== 'undefined';

  HAS_JSON = typeof JSON !== 'undefined';

  NOT_ENUM = ['toString', 'toLocaleString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'constructor'];

  if (!HAS_JSON) {
    script = document.createElement('script');
    script.src = 'http://cdn.intermine.org/js/json3/3.2.2/json3.min.js';
    script.type = 'text/javascript';
    head = document.getElementsByTagName('head')[0];
    head.appendChild(script);
  }

  if (Object.keys == null) {
    hasOwnProperty = Object.prototype.hasOwnProperty;
    hasDontEnumBug = !{
      toString: null
    }.propertyIsEnumerable("toString");
    Object.keys = function(o) {
      var j, keys, len, name, nonEnum;
      if (typeof o !== "object" && typeof o !== "" || o === null) {
        throw new TypeError("Object.keys called on a non-object");
      }
      keys = (function() {
        var results;
        results = [];
        for (name in o) {
          if (hasOwnProperty.call(o, name)) {
            results.push(name);
          }
        }
        return results;
      })();
      if (hasDontEnumBug) {
        for (j = 0, len = NOT_ENUM.length; j < len; j++) {
          nonEnum = NOT_ENUM[j];
          if (hasOwnProperty.call(o, nonEnum)) {
            keys.push(nonEnum);
          }
        }
      }
      return keys;
    };
  }

  if (Array.prototype.map == null) {
    Array.prototype.map = function(f) {
      var j, len, ref, results, x;
      ref = this;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        x = ref[j];
        results.push(f(x));
      }
      return results;
    };
  }

  if (Array.prototype.filter == null) {
    Array.prototype.filter = function(f) {
      var j, len, ref, results, x;
      ref = this;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        x = ref[j];
        if (f(x)) {
          results.push(x);
        }
      }
      return results;
    };
  }

  if (Array.prototype.reduce == null) {
    Array.prototype.reduce = function(f, initValue) {
      var j, len, ret, x, xs;
      xs = this.slice();
      ret = arguments.length < 2 ? xs.pop() : initValue;
      for (j = 0, len = xs.length; j < len; j++) {
        x = xs[j];
        ret = f(ret, x);
      }
      return ret;
    };
  }

  if (Array.prototype.forEach == null) {
    Array.prototype.forEach = function(f, ctx) {
      var i, j, len, ref, results, x;
      if (!f) {
        throw new Error("No function provided");
      }
      ref = this;
      results = [];
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        x = ref[i];
        results.push(f.call(ctx != null ? ctx : this, x, i, this));
      }
      return results;
    };
  }

  if (!HAS_CONSOLE) {
    this.console = {
      log: (function() {}),
      error: (function() {}),
      debug: (function() {})
    };
    if (typeof window !== "undefined" && window !== null) {
      window.console = this.console;
    }
  }

  if (console.log == null) {
    console.log = function() {};
  }

  if (console.error == null) {
    console.error = function() {};
  }

  if (console.debug == null) {
    console.debug = function() {};
  }

  if (console.log.apply == null) {
    console.log("Your console needs patching.");
    ref = ['log', 'error', 'debug'];
    fn = function(m) {
      var oldM;
      oldM = console[m];
      return console[m] = function(args) {
        return oldM(args);
      };
    };
    for (j = 0, len = ref.length; j < len; j++) {
      m = ref[j];
      fn(m);
    }
  }

}).call(this);
