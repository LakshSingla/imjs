(function() {
  var IS_NODE, __root__, buildArray, buildDict, intermine,
    slice = [].slice;

  IS_NODE = typeof exports !== 'undefined';

  __root__ = typeof exports !== "undefined" && exports !== null ? exports : this;

  if (IS_NODE) {
    intermine = __root__;
  } else {
    intermine = __root__.intermine;
    if (intermine == null) {
      intermine = __root__.intermine = {};
    }
  }

  if (intermine.compression == null) {
    intermine.compression = {};
  }

  buildDict = function(size) {
    var dict, i, j, ref;
    dict = {};
    for (i = j = 0, ref = size; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
      dict[String.fromCharCode(i)] = i;
    }
    return dict;
  };

  buildArray = function(size) {
    var j, ref, results, x;
    results = [];
    for (x = j = 0, ref = size; 0 <= ref ? j <= ref : j >= ref; x = 0 <= ref ? ++j : --j) {
      results.push(String.fromCharCode(x));
    }
    return results;
  };

  intermine.compression.LZW = {
    encode: function(s) {
      var char, currPhrase, data, dict, dictSize, j, len, out, phrase;
      data = (s + "").split("");
      out = [];
      phrase = '';
      dictSize = 256;
      dict = buildDict(dictSize);
      for (j = 0, len = data.length; j < len; j++) {
        char = data[j];
        currPhrase = phrase + char;
        if (currPhrase in dict) {
          phrase = currPhrase;
        } else {
          out.push(dict[phrase]);
          dict[currPhrase] = dictSize++;
          phrase = String(char);
        }
      }
      if (phrase !== '') {
        out.push(dict[phrase]);
      }
      return out;
    },
    decode: function(data) {
      var code, dict, dictSize, entry, head, j, len, result, tail, word;
      dictSize = 256;
      dict = buildArray(dictSize);
      entry = '';
      head = data[0], tail = 2 <= data.length ? slice.call(data, 1) : [];
      word = String.fromCharCode(head);
      result = [word];
      for (j = 0, len = tail.length; j < len; j++) {
        code = tail[j];
        entry = (function() {
          if (dict[code]) {
            return dict[code];
          } else if (code === dictSize) {
            return word + word.charAt(0);
          } else {
            throw new Error("Key is " + code);
          }
        })();
        result.push(entry);
        dict[dictSize++] = word + entry.charAt(0);
        word = entry;
      }
      return result.join('');
    }
  };

}).call(this);
