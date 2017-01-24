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
  "../lang/ArgumentRequiredError",
  "../lang/ArgumentInvalidError"
], function(ArgumentRequiredError, ArgumentInvalidError) {

  "use strict";

  var reWhiteSpace = /\s/;

  return typeNameParser;

  /**
   * @name pentaho.util.ITypeNameInfo
   * @interface
   * @private
   *
   * @property {string} name - The name of the type.
   * @property {?Array.<pentaho.util.ITypeNameInfo>} - The array of generic type arguments.
   */

  /**
   * Parses a type name.
   *
   * @memberOf pentaho.util
   * @private
   *
   * @param {nonEmptyString} typeName - The type name to parse.
   * @return {!pentaho.util.ITypeNameInfo} The parsed type name info.
   *
   * @throws {pentaho.lang.ArgumentInvalidError} When `typeName` has an invalid syntax.
   */
  function typeNameParser(typeName) {

    if(!typeName) throw new ArgumentRequiredError("typeName");

    return parse(new TokenReader(tokenize(typeName)), false)[0];
  }

  function createTypeNameInfo(name, args) {
    var typeInfo = {name: name};
    if(args) typeInfo.args = args;
    return typeInfo;
  }

  function tokenize(text) {
    var i = 0;
    var L = text.length;

    var tokens = [];
    var tokenStart;
    var endCurrent = function() {
      if(tokenStart != null) {
        tokens.push({type: "identifier", value: text.substring(tokenStart, i)});
        tokenStart = null;
      }
    };
    var addToken = function(tk) {
      endCurrent();
      tokens.push(tk);
    };

    while(i < L) {
      var c = text[i];

      switch(c) {
        case ",":
        case "<":
        case ">":
          addToken({type: c});
          break;

        default:
          if(reWhiteSpace.test(c)) {
            endCurrent();
          } else if(tokenStart == null) {
            tokenStart = i;
          }
          // else include in current token
      }

      i++;
    }

    endCurrent();

    return tokens;
  }

  function TokenReader(tokens) {
    var index = -1;
    var L = tokens.length;

    this.next = function() {
      var i = index + 1;
      if(i < L) return tokens[(index = i)];
    };
  }

  function expectToken(tk, type) {

    if(!tk)
      throw new ArgumentInvalidError("typeName", "Expected '" + type + "' but got nothing.");

    if(tk.type !== type)
      throw new ArgumentInvalidError("typeName", "Expected '" + type + "' but got '" + tk.type + "'.");

    return tk;
  }

  function parse(tr, isNested) {
    /* eslint default-case: 0 */

    var types = null;

    do {
      var tk = expectToken(tr.next(), "identifier");
      var name = tk.value;
      var args = null;

      // ? "<" ">"
      tk = tr.next();

      if(tk && tk.type === "<") {
        args = parse(tr, true);
        // > already read
        tk = tr.next();
      }

      (types || (types = [])).push(createTypeNameInfo(name, args));

      if(tk) {
        // end of nested generic
        if(tk.type === ">") {
          if(!isNested) throw new ArgumentInvalidError("typeName", "Got '>' without a matching '<'.");
          return types;
        }

        // continues , ?
        if(!isNested) throw new ArgumentInvalidError("typeName", "Expected nothing but got '" + tk.type + "'.");
        expectToken(tk, ",");
      }
    } while(tk);

    return types;
  }
});
