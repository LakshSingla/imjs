(function() {
  var CategoryResults, IDResolutionJob, IdResults, ONE_MINUTE, concatMap, defer, difference, fold, funcutils, get, id, intermine, uniqBy, withCB,
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  funcutils = require('./util');

  intermine = exports;

  uniqBy = funcutils.uniqBy, difference = funcutils.difference, defer = funcutils.defer, withCB = funcutils.withCB, id = funcutils.id, get = funcutils.get, fold = funcutils.fold, concatMap = funcutils.concatMap;

  ONE_MINUTE = 60 * 1000;

  CategoryResults = (function() {
    var getIssueMatches;

    function CategoryResults(results) {
      var k, v;
      for (k in results) {
        if (!hasProp.call(results, k)) continue;
        v = results[k];
        this[k] = v;
      }
    }

    CategoryResults.prototype.getStats = function(type) {
      if (type != null) {
        return this.stats[type];
      } else {
        return this.stats;
      }
    };

    getIssueMatches = concatMap(get('matches'));

    CategoryResults.prototype.getMatches = function(k) {
      var ref;
      if (k === 'MATCH') {
        return this.matches[k];
      } else {
        return (ref = getIssueMatches(this.matches[k])) != null ? ref : [];
      }
    };

    CategoryResults.prototype.getMatchIds = function(k) {
      if (k != null) {
        return this.getMatches(k).map(get('id'));
      } else {
        return this.allMatchIds();
      }
    };

    CategoryResults.prototype.goodMatchIds = function() {
      return this.getMatchIds('MATCH');
    };

    CategoryResults.prototype.allMatchIds = function() {
      var combineIds;
      combineIds = fold((function(_this) {
        return function(res, issueSet) {
          return res.concat(_this.getMatchIds(issueSet));
        };
      })(this));
      return combineIds(this.goodMatchIds(), ['DUPLICATE', 'WILDCARD', 'TYPE_CONVERTED', 'OTHER']);
    };

    return CategoryResults;

  })();

  IdResults = (function() {
    var flatten, getReasons, isGood, unique;

    unique = uniqBy(id);

    flatten = concatMap(id);

    getReasons = function(match) {
      var k, vals;
      return flatten((function() {
        var ref, results1;
        ref = match.identifiers;
        results1 = [];
        for (k in ref) {
          vals = ref[k];
          results1.push(vals);
        }
        return results1;
      })());
    };

    isGood = function(match, k) {
      return (k == null) || indexOf.call(getReasons(match), k) >= 0;
    };

    function IdResults(results) {
      var k, v;
      for (k in results) {
        if (!hasProp.call(results, k)) continue;
        v = results[k];
        this[k] = v;
      }
    }

    IdResults.prototype.getStats = function(type) {
      switch (type) {
        case 'objects':
          return this.getObjectStats();
        case 'identifiers':
          return this.getIdentifierStats();
        default:
          return {
            objects: this.getObjectStats(),
            identifiers: this.getIdentifierStats()
          };
      }
    };

    IdResults.prototype.getIdentifierStats = function() {
      var all, allIdents, issues, matchIdents, matches, toIdents;
      toIdents = function(ms) {
        var ident, match;
        return unique(flatten((function() {
          var i, len, results1;
          results1 = [];
          for (i = 0, len = ms.length; i < len; i++) {
            match = ms[i];
            results1.push((function() {
              var results2;
              results2 = [];
              for (ident in match != null ? match.identifiers : void 0) {
                results2.push(ident);
              }
              return results2;
            })());
          }
          return results1;
        })()));
      };
      matchIdents = toIdents(this.getMatches('MATCH'));
      allIdents = toIdents(this.getMatches());
      matches = matchIdents.length;
      all = allIdents.length;
      issues = (difference(allIdents, matchIdents)).length;
      return {
        matches: matches,
        all: all,
        issues: issues
      };
    };

    IdResults.prototype.getObjectStats = function() {
      var all, issues, match, matches;
      matches = this.goodMatchIds().length;
      all = this.allMatchIds().length;
      issues = ((function() {
        var ref, results1;
        ref = this;
        results1 = [];
        for (id in ref) {
          if (!hasProp.call(ref, id)) continue;
          match = ref[id];
          if (indexOf.call(getReasons(match), 'MATCH') < 0) {
            results1.push(id);
          }
        }
        return results1;
      }).call(this)).length;
      return {
        matches: matches,
        all: all,
        issues: issues
      };
    };

    IdResults.prototype.getMatches = function(k) {
      var match, ref, results1;
      ref = this;
      results1 = [];
      for (id in ref) {
        if (!hasProp.call(ref, id)) continue;
        match = ref[id];
        if (isGood(match, k)) {
          results1.push(match);
        }
      }
      return results1;
    };

    IdResults.prototype.getMatchIds = function(k) {
      var match, ref, results1;
      ref = this;
      results1 = [];
      for (id in ref) {
        if (!hasProp.call(ref, id)) continue;
        match = ref[id];
        if (isGood(match, k)) {
          results1.push(id);
        }
      }
      return results1;
    };

    IdResults.prototype.goodMatchIds = function() {
      return this.getMatchIds('MATCH');
    };

    IdResults.prototype.allMatchIds = function() {
      return this.getMatchIds();
    };

    return IdResults;

  })();

  IDResolutionJob = (function() {
    function IDResolutionJob(uid1, service1) {
      this.uid = uid1;
      this.service = service1;
      this.del = bind(this.del, this);
      this.fetchResults = bind(this.fetchResults, this);
      this.fetchErrorMessage = bind(this.fetchErrorMessage, this);
      this.fetchStatus = bind(this.fetchStatus, this);
    }

    IDResolutionJob.prototype.fetchStatus = function(cb) {
      return withCB(cb, this.service.get("ids/" + this.uid + "/status").then(get('status')));
    };

    IDResolutionJob.prototype.fetchErrorMessage = function(cb) {
      return withCB(cb, this.service.get("ids/" + this.uid + "/status").then(get('message')));
    };

    IDResolutionJob.prototype.fetchResults = function(cb) {
      var gettingRes, gettingVer;
      gettingRes = this.service.get("ids/" + this.uid + "/result").then(get('results'));
      gettingVer = this.service.fetchVersion();
      return gettingVer.then(function(v) {
        return gettingRes.then(function(results) {
          if (v >= 16) {
            return new CategoryResults(results);
          } else {
            return new IdResults(results);
          }
        });
      });
    };

    IDResolutionJob.prototype.del = function(cb) {
      return withCB(cb, this.service.makeRequest('DELETE', "ids/" + this.uid));
    };

    IDResolutionJob.prototype.decay = 50;

    IDResolutionJob.prototype.poll = function(onSuccess, onError, onProgress) {
      var backOff, notify, promise, ref, reject, resolve, resp;
      ref = defer(), promise = ref.promise, resolve = ref.resolve, reject = ref.reject;
      promise.then(onSuccess, onError);
      notify = onProgress != null ? onProgress : (function() {});
      resp = this.fetchStatus();
      resp.then(null, reject);
      backOff = this.decay;
      this.decay = Math.min(ONE_MINUTE, backOff * 1.25);
      resp.then((function(_this) {
        return function(status) {
          notify(status);
          switch (status) {
            case 'SUCCESS':
              return _this.fetchResults().then(resolve, reject);
            case 'ERROR':
              return _this.fetchErrorMessage().then(reject, reject);
            default:
              return setTimeout((function() {
                return _this.poll(resolve, reject, notify);
              }), backOff);
          }
        };
      })(this));
      return promise;
    };

    return IDResolutionJob;

  })();

  IDResolutionJob.prototype.wait = IDResolutionJob.prototype.poll;

  IDResolutionJob.create = function(service) {
    return function(uid) {
      return new IDResolutionJob(uid, service);
    };
  };

  intermine.IDResolutionJob = IDResolutionJob;

  intermine.CategoryResults = CategoryResults;

  intermine.IdResults = IdResults;

}).call(this);
