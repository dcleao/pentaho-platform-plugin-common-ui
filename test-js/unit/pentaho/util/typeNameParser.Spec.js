/*!
 * Copyright 2010 - 2017 Pentaho Corporation.  All rights reserved.
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
  "pentaho/util/typeNameParser",
  "./errorMatch"
], function(typeNameParser, errorMatch) {

  "use strict";

  function itParses(typeName, typeNameInfo) {

    it("should parse '" + typeName + "' correctly", function() {

      var result = typeNameParser(typeName);

      expect(result).toEqual(typeNameInfo);
    });
  }

  function itParsesNot(typeName, message) {

    it("should not parse '" + typeName + "'", function() {
      expect(function() {
        typeNameParser(typeName);
      }).toThrow(errorMatch.argInvalid("typeName", message));
    });
  }

  var MSG_EXPECTED_IDENT_GOT_CLOSE   = "Expected 'identifier' but got '>'.";
  var MSG_EXPECTED_IDENT_GOT_COMMA   = "Expected 'identifier' but got ','.";
  var MSG_EXPECTED_IDENT_GOT_NOTHING = "Expected 'identifier' but got nothing.";
  var MSG_EXPECTED_NOTHING_GOT_COMMA = "Expected nothing but got ','.";
  var MSG_GOT_CLOSE_WITHOUT_OPEN     = "Got '>' without a matching '<'.";

  describe("pentaho.util.typeNameParser", function() {

    it("should not parse ''", function() {
      expect(function() {
        typeNameParser("");
      }).toThrow(errorMatch.argRequired("typeName"));
    });

    it("should not parse null", function() {
      expect(function() {
        typeNameParser(null);
      }).toThrow(errorMatch.argRequired("typeName"));
    });

    describe("identifiers", function() {

      itParses("a", {name: "a"});
      itParses("A", {name: "A"});
      itParses("abc", {name: "abc"});
      itParses(" a ", {name: "a"});

      itParses("a.b", {name: "a.b"});
      itParses("abc.def", {name: "abc.def"});
      itParses("  abc.def  ", {name: "abc.def"});
    });

    describe("generics with one level", function() {

      itParsesNot("a<>", MSG_EXPECTED_IDENT_GOT_CLOSE);
      itParsesNot(" a < > ", MSG_EXPECTED_IDENT_GOT_CLOSE);

      itParses("a<b>", {name: "a", args: [{name: "b"}]});
      itParses(" a<b> ", {name: "a", args: [{name: "b"}]});
      itParses(" a < b > ", {name: "a", args: [{name: "b"}]});
      itParses("abc.cde<fgh.ijk>", {name: "abc.cde", args: [{name: "fgh.ijk"}]});

      itParsesNot("a<,>", MSG_EXPECTED_IDENT_GOT_COMMA);
      itParsesNot(" a < , > ", MSG_EXPECTED_IDENT_GOT_COMMA);

      itParses("a<b,c>", {name: "a", args: [{name: "b"}, {name: "c"}]});
      itParses(" a < b , c > ", {name: "a", args: [{name: "b"}, {name: "c"}]});

      itParses("abc.cde<fgh.ijk,lmn.opq>", {name: "abc.cde", args: [{name: "fgh.ijk"}, {name: "lmn.opq"}]});
    });

    describe("generics with two levels", function() {

      itParses("a<b<c>>", {name: "a", args: [{name: "b", args: [{name: "c"}]}]});
      itParses(" a < b < c > > ", {name: "a", args: [{name: "b", args: [{name: "c"}]}]});

      itParses("abc.cde<fgh.ijk<lmn.opq>>", {name: "abc.cde", args: [{name: "fgh.ijk", args: [{name: "lmn.opq"}]}]});

      itParses("a<b<c>,d>", {name: "a", args: [{name: "b", args: [{name: "c"}]}, {name: "d"}]});
    });

    itParsesNot("a<", MSG_EXPECTED_IDENT_GOT_NOTHING);

    itParsesNot("a,", MSG_EXPECTED_NOTHING_GOT_COMMA);
    itParsesNot("a<b>,", MSG_EXPECTED_NOTHING_GOT_COMMA);
    itParsesNot("a<b,>", MSG_EXPECTED_IDENT_GOT_CLOSE);

    itParsesNot("a>", MSG_GOT_CLOSE_WITHOUT_OPEN);
    itParsesNot("a<b>>", MSG_GOT_CLOSE_WITHOUT_OPEN);
  });
});
