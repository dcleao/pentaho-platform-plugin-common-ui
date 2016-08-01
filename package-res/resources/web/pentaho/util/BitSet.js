define([
  "pentaho/lang/Base"
], function(Base) {

  "use strict";

  // Allow ~0
  // jshint -W016

  return Base.extend(/** @lends pentaho.util.BitSet# */{

    constructor: function(bits) {
      this.set(bits || 0);
    },

    get isEmpty() {
      return this._bits === 0;
    },

    get: function() {
      return this._bits;
    },

    is: function(mask) {
      return this._bits === mask;
    },

    set: function(mask) {
      this._bits = (mask == null) ? ~0 : (this._bits | mask);
    },

    clear: function(mask) {
      this._bits = (mask == null) ? 0 : (this._bits & ~mask);
    },

    isSubsetOf: function(mask) {
      var bits = this._bits;
      return (bits !== 0) && ((bits | mask) === mask);
    }
  });
});