(function() {
  var DOMParser, sanitize;

  DOMParser = require('xmldom').DOMParser;

  sanitize = function(xml) {
    xml = xml.replace(/^\s*/g, '');
    xml = xml.replace(/\s$/g, '');
    if (xml.length === 0) {
      return xml;
    } else if (xml[xml.length - 1] !== '>') {
      return xml + '>';
    } else {
      return xml;
    }
  };

  exports.parse = function(xml) {
    var dom, parser;
    if (typeof xml !== 'string') {
      throw new Error("Expected a string - got " + xml);
    }
    xml = sanitize(xml);
    if (!xml) {
      throw new Error("Expected content - got empty string");
    }
    dom = (function() {
      try {
        parser = new DOMParser();
        return parser.parseFromString(xml, 'text/xml');
      } catch (error) {}
    })();
    if ((!dom) || (!dom.documentElement) || dom.getElementsByTagName('parsererror').length) {
      throw new Error("Invalid XML: " + xml);
    }
    return dom;
  };

}).call(this);
