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
  "pentaho/type/DomainRefinementMixin",
  "pentaho/type/Context",
  "pentaho/util/error",
  "pentaho/i18n!/pentaho/type/i18n/types"
], function(DomainRefinementMixin, Context, error, bundle) {

  "use strict";

  /*global describe:true, it:true, expect:true, beforeEach:true*/

  var context = new Context(),
      List    = context.get("pentaho/type/list"),
      Number  = context.get("pentaho/type/number");

  describe("pentaho/type/DomainRefinementMixinSpec -", function() {
    it("should be a function", function() {
      expect(typeof DomainRefinementMixin).toBe("function");
    });

    describe("#domain -", function() {
      it("should have a default null domain", function() {
        var B = Number.refine();

        expect(B.meta.domain).toBe(null);
      });

      it("should respect a specified root/base domain", function() {
        var B = Number.refine({
          meta: {
            domain: [1, 2, 3]
          }
        });

        var domain = B.meta.domain;
        expect(domain instanceof List).toBe(true);
        expect(domain.count).toBe(3);

        expect(domain.at(0) instanceof Number).toBe(true);
        expect(domain.at(1) instanceof Number).toBe(true);
        expect(domain.at(2) instanceof Number).toBe(true);

        expect(domain.at(0).value).toBe(1);
        expect(domain.at(1).value).toBe(2);
        expect(domain.at(2).value).toBe(3);
      });

      it("should inherit the base domain elements when unspecified", function() {
        var B = Number.refine({
          meta: {
            domain: [1, 2, 3]
          }
        });

        var C = B.refine();

        expect(C.meta.domain).toBe(B.meta.domain);
      });

      it("should throw if the specified domain is not a subset of the base domain", function() {
        var B = Number.refine({
          meta: {
            domain: [1, 2, 3]
          }
        });

        expect(function() {
          B.refine({
            meta: {
              domain: [1, 4]
            }
          });
        }).toThrowError(
            error.argInvalid("domain", bundle.structured.errors.type.domainIsNotSubsetOfBase)
                .message);
      });

      it("should respect a specified domain that is a subset of the base domain", function() {
        var B = Number.refine({
          meta: {
            domain: [1, 2, 3]
          }
        });

        var C = B.refine({
          meta: {
            domain: [1, 2]
          }
        });

        var domain = C.meta.domain;
        expect(domain instanceof List).toBe(true);
        expect(domain.count).toBe(2);

        expect(domain.at(0).value).toBe(1);
        expect(domain.at(1).value).toBe(2);
      });

      it("should set the root domain to null when set to nully", function() {

        function expectIt(newDomain) {
          var B = Number.refine({
            meta: {
              domain: [1, 2, 3]
            }
          });

          var domain = B.meta.domain;
          expect(domain instanceof List).toBe(true);
          expect(domain.count).toBe(3);

          B.meta.domain = newDomain;

          expect(B.meta.domain).toBe(null);
        }

        expectIt(null);
        expectIt(undefined);
      });

      it("should inherit the base domain when later set to nully", function() {

        function expectIt(newDomain) {
          var B = Number.refine({
            meta: {
              domain: [1, 2, 3]
            }
          });

          var C = B.refine({
            meta: {
              domain: [1, 2]
            }
          });

          var domain = C.meta.domain;
          expect(domain instanceof List).toBe(true);
          expect(domain.count).toBe(2);

          C.meta.domain = newDomain;

          domain = C.meta.domain;
          expect(domain instanceof List).toBe(true);
          expect(domain.count).toBe(3);
        }

        expectIt(null);
        expectIt(undefined);
      });

      it("should respect a specified domain on an refined type without domain", function() {
        var B = Number.refine();
        var C = B.refine({
          meta: {
            domain: [1, 2]
          }
        });

        var domain = C.meta.domain;
        expect(domain instanceof List).toBe(true);
        expect(domain.count).toBe(2);
        expect(domain.at(0).value).toBe(1);
        expect(domain.at(1).value).toBe(2);
      });

      it("should allow specifying the base domain", function() {
        var B = Number.refine({
          meta: {
            domain: [1, 2, 3]
          }
        });

        var C = B.refine({
          meta: {
            domain: [B.meta.domain.at(1)]
          }
        });

        var domain = C.meta.domain;
        expect(domain instanceof List).toBe(true);
        expect(domain.count).toBe(1);

        expect(domain.at(0).value).toBe(2);
      });
    }); // #domain

    describe(".validate(value)", function() {
      it("should be defined", function() {
        expect(typeof DomainRefinementMixin.validate).toBe("function");
      });

      it("should return null on a value that is equal to one of the domain values", function() {
        var B = Number.refine({
          meta: {
            domain: [1, 2, 3]
          }
        });

        var v = new Number(1);

        expect(DomainRefinementMixin.validate.call(B.meta, v)).toBe(null);
      });

      it("should return an Error on a value that is not equal to one of the domain values", function() {
        var B = Number.refine({
          meta: {
            domain: [1, 2, 3]
          }
        });

        var v = new Number(4);

        expect(DomainRefinementMixin.validate.call(B.meta, v) instanceof Error).toBe(true);
      });
    });
  });
});
