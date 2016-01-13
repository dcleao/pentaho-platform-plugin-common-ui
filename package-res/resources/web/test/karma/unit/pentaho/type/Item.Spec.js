/*!
 * Copyright 2010 - 2015 Pentaho Corporation.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define([
  "pentaho/type/Item"
], function(Item) {

  "use strict";

  /*global describe:true, it:true, expect:true, beforeEach:true*/

  describe("pentaho/type/Item -", function() {
    it("is a function", function() {
      expect(typeof Item).toBe("function");
    });

    it("should have .Meta as a different function", function() {
      expect(Item).not.toBe(Item.Meta);
      expect(typeof Item.Meta).toBe("function");
    });

    it("should have .meta be Item.Meta#", function() {
      expect(Item.meta).toBe(Item.Meta.prototype);
    });

    describe(".extend({...})", function() {
      var Derived;
      beforeEach(function() {
        Derived = Item.extend();
      });

      it("should return a function", function() {
        expect(typeof Derived).toBe("function");
      });

      it("should return a sub-class of Item", function() {
        expect(Derived.prototype instanceof Item).toBe(true);
      });

      it("should have .Meta as a function", function() {
        expect(typeof Derived.Meta).toBe("function");
      });

      it("should have .Meta as a sub-class of Item.Meta", function() {
        expect(Derived.Meta.prototype instanceof Item.Meta).toBe(true);
      });

      it("should have .meta be Derived.Meta#", function() {
        expect(Derived.meta).toBe(Derived.Meta.prototype);
      });
    }); // .extend({...})

    describe("pentaho/type/Item.Meta", function() {

      describe("#view -", function() {
        it("should default to `null`", function() {
          var Derived = Item.extend({meta: {id: "fake/id"}});

          expect(Derived.meta.view).toBe(null);
        });

        it("should leave absolute ids intact", function() {
          var Derived = Item.extend({meta: {id: "fake/id", view: "/foo"}});

          expect(Derived.meta.view).toBe("/foo");

          // ---

          Derived = Item.extend({meta: {view: "foo:"}});

          expect(Derived.meta.view).toBe("foo:");

          // ---

          Derived = Item.extend({meta: {view: "bar.js"}});

          expect(Derived.meta.view).toBe("bar.js");
        });

        it("should convert relative ids to absolute", function() {
          var Derived = Item.extend({meta: {id: "fake/id", view: "foo"}});

          expect(Derived.meta.view).toBe("fake/id/foo");

          // ---

          Derived = Item.extend({meta: {id: "fake/id", view: "foo/bar"}});

          expect(Derived.meta.view).toBe("fake/id/foo/bar");

          // ---

          Derived = Item.extend({meta: {id: "fake/id", view: "./bar"}});

          expect(Derived.meta.view).toBe("fake/id/./bar");

          // ---

          Derived = Item.extend({meta: {id: "fake/id", view: "../bar"}});

          expect(Derived.meta.view).toBe("fake/id/../bar");

          // ---
          // no base folder..

          Derived = Item.extend({meta: {id: "id", view: "../bar"}});

          expect(Derived.meta.view).toBe("id/../bar");

          // ---

          Derived = Item.extend({meta: {view: "../bar"}});

          expect(Derived.meta.view).toBe("../bar");
        });

        it("should inherit the base type's view, when unspecified", function() {
          var A = Item.extend({meta: {view: "foo"}});

          expect(A.meta.view).toBe("foo");

          var B = A.extend();

          expect(B.meta.view).toBe("foo");
        });

        it("should inherit the base type's view, when spec is undefined", function() {
          var A = Item.extend({meta: {view: "foo"}});

          expect(A.meta.view).toBe("foo");

          var B = A.extend({meta: {view: undefined}});

          expect(B.meta.view).toBe("foo");
        });

        it("should respect a null spec value", function() {
          var A = Item.extend({meta: {view: "foo"}});

          expect(A.meta.view).toBe("foo");

          var B = A.extend({meta: {view: null}});

          expect(B.meta.view).toBe(null);
        });

        it("should convert an empty string value to null", function() {
          var A = Item.extend({meta: {view: "foo"}});

          expect(A.meta.view).toBe("foo");

          var B = A.extend({meta: {view: ""}});

          expect(B.meta.view).toBe(null);
        });

        it("should respect a specified non-empty string", function() {
          var A = Item.extend({meta: {view: "foo"}});

          expect(A.meta.view).toBe("foo");

          var B = A.extend({meta: {id: "baba/dudu", view: "bar"}});

          expect(B.meta.view).toBe("baba/dudu/bar");
        });

        it("should inherit a base function", function() {
          var FA = function() {};
          var A = Item.extend({meta: {view: FA}});

          expect(A.meta.view).toBe(FA);

          var B = A.extend({meta: {id: "baba/dudu"}});

          expect(B.meta.view).toBe(FA);
        });

        it("should respect a specified function", function() {
          var FA = function() {};
          var A = Item.extend({meta: {view: FA}});

          expect(A.meta.view).toBe(FA);

          var FB = function() {};
          var B = A.extend({meta: {id: "baba/dudu", view: FB}});

          expect(B.meta.view).toBe(FB);
        });
      }); // end view

      describe("viewClass -", function() {

        afterEach(function() {
          require.undef("foo/bar");
          require.undef("foo/dude");
        });

        it("should return `null` when view is `null`", function() {
          var A = Item.extend();

          expect(A.meta.viewClass).toBe(null);
        });

        it("should return a Promise, when view is a function, and resolve to it", function(done) {
          var View = function() {};
          var A = Item.extend({meta: {view: View}});
          var p = A.meta.viewClass;

          expect(p instanceof Promise).toBe(true);

          p.then(function(V) {
            expect(V).toBe(View);
            done();
          });
        });

        it("should return a Promise, when view is an object, and resolve to it", function(done) {
          var View = {};
          var A = Item.extend({meta: {view: View}});
          var p = A.meta.viewClass;

          expect(p instanceof Promise).toBe(true);

          p.then(function(V) {
            expect(V).toBe(View);
            done();
          });
        });

        it("should return a Promise, when view is a string, and resolve to that module", function(done) {

          var View = function() {};

          define("foo/bar", function() { return View; });

          var A = Item.extend({meta: {view: "foo/bar"}});

          var p = A.meta.viewClass;

          expect(p instanceof Promise).toBe(true);

          p.then(function(V) {
            expect(V).toBe(View);

            done();
          });
        });

        it("should return a Promise even if view is inherited from the base class", function(done) {

          var View = function() {};

          define("foo/bar", function() { return View; });

          var A = Item.extend({meta: {view: "foo/bar"}});

          var B = A.extend();

          var pb = B.meta.viewClass;

          var pa = A.meta.viewClass;

          expect(pa).toBe(pb);
          expect(pa instanceof Promise).toBe(true);

          pa.then(function(V) {
            expect(V).toBe(View);

            done();
          });
        });

        it("should return the same Promise multiple times", function(done) {

          var View = function() {};

          define("foo/bar", function() { return View; });

          var A = Item.extend({meta: {view: "foo/bar"}});

          var pa = A.meta.viewClass;

          expect(pa).toBe(A.meta.viewClass);

          pa.then(function(V) {
            expect(V).toBe(View);
            expect(pa).toBe(A.meta.viewClass);
            done();
          });
        });

        it("should return an new Promise and resolve to the new View when the view changes", function(done) {

          var ViewBar  = function() {};
          var ViewDude = function() {};

          define("foo/bar",  function() { return ViewBar;  });
          define("foo/dude", function() { return ViewDude; });

          var A = Item.extend({meta: {view: "foo/bar"}});

          var pa = A.meta.viewClass;

          A.meta.view = "foo/dude";

          var pb = A.meta.viewClass;

          expect(pb instanceof Promise).toBe(true);

          expect(pa).not.toBe(pb);

          Promise.all([pa, pb]).then(function(views) {

            expect(views[0]).toBe(ViewBar);
            expect(views[1]).toBe(ViewDude);

            done();
          });
        });

      }); // end viewClass
    });
  }); // pentaho/type/Item
});
