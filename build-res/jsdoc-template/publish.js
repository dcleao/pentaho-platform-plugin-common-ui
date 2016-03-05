/*global env: true */
'use strict';

var doop = require('jsdoc/util/doop');
var fs = require('jsdoc/fs');
var helper = require('jsdoc/util/templateHelper');
var logger = require('jsdoc/util/logger');
var path = require('jsdoc/path');
var taffy = require('taffydb').taffy;
var template = require('jsdoc/template');
var util = require('util');

//override htmlsafe function
helper.htmlsafeOrig = helper.htmlsafe;
helper.htmlsafe = function(str){
    return helper.htmlsafeOrig(str).replace(/>/g, '&gt;').replace(/\n/g, '<br>');
};

var htmlsafe = helper.htmlsafe;
var linkto = helper.linkto;
var resolveAuthorLinks = helper.resolveAuthorLinks;
var scopeToPunc = helper.scopeToPunc;
var hasOwnProp = Object.prototype.hasOwnProperty;

var data;
var view;

var version = '' + env.opts.githubConfig.branch;
var github = '' + env.opts.githubConfig.name;

var outdir = path.normalize(env.opts.destination);

registerStandardJsTypes();

function registerStandardJsTypes() {

  var typeNames = [
    ["string",  "String"],
    ["number",  "Number"],
    ["boolean", "Boolean"],
    ["array",   "Array"],
    ["object",  "Object"],
    ["function", "Function"],
    "null",
    "undefined",
    "RegExp",
    "DataView",
    "Promise",
    "Generator",
    "GeneratorFunction",
    "Proxy",
    "JSON",
    "Error",
    "EvalError",
    "TypeError",
    "SyntaxError",
    "RangeError",
    "InternalError",
    "ReferenceError",
    "URIError",
    "Reflect",
    "Date",
    "Function",
    "Object",
    "Array",
    "ArrayBuffer",
    "Float32Array",
    "Float64Array",
    "Int8Array",
    "Int16Array",
    "Int32Array",
    "Uint8Array",
    "Uint8ClampedArray",
    "Uint16Array",
    "Uint32Array",
    "TypedArray",
    "Boolean",
    "Number",
    "String",
    "Intl",
    "Map",
    "WeakMap",
    "Math",
    "Set",
    "WeakSet",
    "Symbol"
  ];

  var baseUrl = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/";

  typeNames.forEach(function(typeNameSpec) {
    var typeName, urlName;
    if(Array.isArray(typeNameSpec)) {
      typeName = typeNameSpec[0];
      urlName  = typeNameSpec[1];
    } else {
      typeName = urlName = typeNameSpec;
    }

    helper.registerLink(typeName, baseUrl + urlName);
  });
}

function trimDoubleQuotes(s) {
    var pattern = /^\"(.+)\"$/;
    var m = pattern.exec(s);
    return m != null ? m[1] : s;
}

function find(spec) {
    return helper.find(data, spec);
}

function tutoriallink(tutorial) {
    return helper.toTutorial(tutorial, null, { tag: 'em', classname: 'disabled', prefix: 'Tutorial: ' });
}

function getAncestorLinks(doclet) {
    return helper.getAncestorLinks(data, doclet);
}

function hashToLink(doclet, hash) {
    if ( !/^(#.+)/.test(hash) ) { return hash; }

    var url = helper.createLink(doclet);

    url = url.replace(/(#.+|$)/, hash);
    return '<a href="' + url + '">' + hash + '</a>';
}

function needsSignature(doclet) {
    var needsSig = false;

    // function and class definitions always get a signature
    if (doclet.kind === 'function' || doclet.kind === 'class') {
        needsSig = true;
    }
    // typedefs that contain functions get a signature, too
    else if (doclet.kind === 'typedef' && doclet.type && doclet.type.names &&
        doclet.type.names.length) {
        for (var i = 0, l = doclet.type.names.length; i < l; i++) {
            if (doclet.type.names[i].toLowerCase() === 'function') {
                needsSig = true;
                break;
            }
        }
    }

    return needsSig;
}

function getSignatureAttributes(item) {
    var attributes = [];

    if (item.optional) {
        attributes.push('opt');
    }

    if (item.nullable === true) {
        attributes.push('nullable');
    }
    else if (item.nullable === false) {
        attributes.push('non-null');
    }

    return attributes;
}

function updateItemName(item) {
    var itemName = item.name || '';
    return itemName;
}

function addParamAttributes(params) {
    return params.filter(function(param) {
        return param.name && param.name.indexOf('.') === -1;
    }).map(updateItemName);
}

function buildItemTypeStrings(item) {
    var types = [];

    if (item && item.type && item.type.names) {
        item.type.names.forEach(function(name) {
            types.push( linkto(name, htmlsafe(name)) );
        });
    }

    return types;
}

function buildAttribsString(attribs) {
    var attribsString = '';

    if (attribs && attribs.length) {
        attribsString = htmlsafe( util.format('(%s) ', attribs.join(', ')) );
    }

    return attribsString;
}

function addNonParamAttributes(items) {
    var types = [];

    items.forEach(function(item) {
        types = types.concat( buildItemTypeStrings(item) );
    });

    return types;
}

function addSignatureParams(f) {
    var params = f.params ? addParamAttributes(f.params) : [];

    f.signature = util.format( '%s(%s)', (f.signature || ''), params.join(', ') );
}

function addSignatureReturns(f) {
    var attribs = [];
    var attribsString = '';
    var returnTypes = [];
    var returnTypesString = '';

    // jam all the return-type attributes into an array. this could create odd results (for example,
    // if there are both nullable and non-nullable return types), but let's assume that most people
    // who use multiple @return tags aren't using Closure Compiler type annotations, and vice-versa.
    if (f.returns) {
        f.returns.forEach(function(item) {
            helper.getAttribs(item).forEach(function(attrib) {
                if (attribs.indexOf(attrib) === -1) {
                    attribs.push(attrib);
                }
            });
        });

        attribsString = buildAttribsString(attribs);
    }

    if (f.returns) {
        returnTypes = addNonParamAttributes(f.returns);
    }
    if (returnTypes.length) {
        returnTypesString = util.format( ' &rarr; %s{%s}', attribsString, returnTypes.join('|') );
    }

    f.signature = '<span class="signature">' + (f.signature || '') + '</span>' +
        '<span class="type-signature">' + returnTypesString + '</span>';
}

function addSignatureTypes(f) {
    var types = f.type ? buildItemTypeStrings(f) : [];

    f.signature = (f.signature || '') + '<span class="type-signature">' +
        (types.length ? ' :' + types.join('|') : '') + '</span>';
}

function addAttribs(f) {
    var attribs = helper.getAttribs(f);
    var attribsString = buildAttribsString(attribs);

    f.attribs = util.format('<span class="type-signature">%s</span>', attribsString);
}

function shortenPaths(files, commonPrefix) {
    Object.keys(files).forEach(function(file) {
        files[file].shortened = files[file].resolved.replace(commonPrefix, '')
            // always use forward slashes
            .replace(/\\/g, '/');
    });

    return files;
}

function getPathFromDoclet(doclet) {
    if (!doclet.meta) {
        return null;
    }

    return doclet.meta.path && doclet.meta.path !== 'null' ?
        path.join(doclet.meta.path, doclet.meta.filename) :
        doclet.meta.filename;
}

function getLinkFromDoclet(doclet) {
    if (!doclet.meta) {
        return null;
    }
    var linkBase = 'https://github.com/webdetails/';
    var type = 'tree';

    if (doclet.meta.shortpath && doclet.meta.shortpath !== 'null'
            && doclet.meta.shortpath.indexOf('.js') != -1) {
        type = 'blob';
    }

    var cdfPath = doclet.meta.path.replace(/\\/g,"/");
    cdfPath = cdfPath.substring(cdfPath.indexOf(github) + 4, cdfPath.length);

    linkBase = linkBase + github + '/' + type + '/' + version + '/' + cdfPath;

    var fileName = doclet.meta.shortpath.indexOf('/') != -1 ?
        doclet.meta.shortpath.substr(
            doclet.meta.shortpath.lastIndexOf('/') + 1, 
            doclet.meta.shortpath.length) :
        doclet.meta.shortpath;
    var url = linkBase + '/' + fileName;

    var linkText = doclet.meta.shortpath;    

    if (doclet.meta.lineno) {
        url += '#L' + doclet.meta.lineno;
        linkText += ', line ' + doclet.meta.lineno;
    }

    return '<a href="' + url + '" target="_blank">' + linkText + '</a>';
}

function generate(title, docs, filename, resolveLinks) {
    resolveLinks = resolveLinks === false ? false : true;

    var docData = {
        title: title,
        docs: docs
    };

    var outpath = path.join(outdir, filename),
        html = view.render('container.tmpl', docData);

    if (resolveLinks) {
        html = helper.resolveLinks(html); // turn {@link foo} into <a href="foodoc.html">foo</a>
    }

    fs.writeFileSync(outpath, html, 'utf8');
}

function generateSourceFiles(sourceFiles, encoding) {
    encoding = encoding || 'utf8';
    Object.keys(sourceFiles).forEach(function(file) {
        var source;
        // links are keyed to the shortened path in each doclet's `meta.shortpath` property
        var sourceOutfile = helper.getUniqueFilename(sourceFiles[file].shortened);
        helper.registerLink(sourceFiles[file].shortened, sourceOutfile);

        try {
            source = {
                kind: 'source',
                code: helper.htmlsafe( fs.readFileSync(sourceFiles[file].resolved, encoding) )
            };
        }
        catch(e) {
            logger.error('Error while generating source file %s: %s', file, e.message);
        }

        generate('Source: ' + sourceFiles[file].shortened, [source], sourceOutfile,
            false);
    });
}

/**
 * Look for classes or functions with the same name as modules (which indicates that the module
 * exports only that class or function), then attach the classes or functions to the `module`
 * property of the appropriate module doclets. The name of each class or function is also updated
 * for display purposes. This function mutates the original arrays.
 *
 * @private
 * @param {Array.<module:jsdoc/doclet.Doclet>} doclets - The array of classes and functions to
 * check.
 * @param {Array.<module:jsdoc/doclet.Doclet>} modules - The array of module doclets to search.
 */
function attachModuleSymbols(doclets, modules) {
    var symbols = {};

    // build a lookup table
    doclets.forEach(function(symbol) {
        symbols[symbol.longname] = symbols[symbol.longname] || [];
        symbols[symbol.longname].push(symbol);
    });

    return modules.map(function(module) {
        if (symbols[module.longname]) {
            module.modules = symbols[module.longname]
                // Only show symbols that have a description. Make an exception for classes, because
                // we want to show the constructor-signature heading no matter what.
                .filter(function(symbol) {
                    return symbol.description || symbol.kind === 'class';
                })
                .map(function(symbol) {
                    symbol = doop(symbol);

                    if (symbol.kind === 'class' || symbol.kind === 'function') {
                        symbol.name = symbol.name.replace('module:', '(require("') + '"))';
                    }

                    return symbol;
                });
        }
    });
}

function linktoTutorial(longName, name) {
    return tutoriallink(name);
}

function linktoExternal(longName, name) {
    return linkto(longName, name.replace(/(^"|"$)/g, ''));
}

function findMembers(data, kind, memberOf) {
    var spec = {kind: kind, memberof: memberOf},
        search = helper.find(data, spec),
        members = [];

    search.forEach(function(_member) {
        members.push(createMemberData(data, _member, kind));

    });

    return members;
}

function createMemberData(data, member, kind) {
    var memberData = {
        name: trimDoubleQuotes(member.name),
        longname: member.longname,
        kind: kind
    };

    var hasPrefix = member.name !== member.longname;
    var prefix = hasPrefix ? member.longname.replace(member.name, '') : "";

    if(kind === 'class' || kind === 'namespace') {
        memberData.interfaces = findMembers(data, 'interface', member.longname);
        memberData.classes = findMembers(data, 'class', member.longname);
        memberData.events = findMembers(data, 'event', member.longname);
    }

    if(kind === 'namespace') {
        memberData.title = prefix + "<strong>" + linkto(member.longname, member.name) + "</strong>";
    }

    if(kind === 'event') {
        memberData.title = prefix.replace("#event:", ".html#event:").replace(/\"/g, "_") + encodeURIComponent(member.name);
    }

    return memberData;
}

function buildNav(members) {
    if(members == null || members.length === 0) return "";

    var nav = "";
    members.forEach(function(namespace, index) {
        nav += '<li class="namespaceEntry">';
        nav += '  <button id="toggle_' + index + '" class="mt-toggle-expand mt-toggle"></button>';
        nav += '  <span>' + namespace.title + '</span>';
        nav += '  <ul id="namespace_' + index + '" style="display:none;">';
        nav += buildMembers(namespace.interfaces, 'Interfaces', linkto);
        nav += buildMembers(namespace.classes, 'Classes', linkto);
        nav += buildMembers(namespace.events, 'Events', linkto);
        nav += '  </ul>';
        nav += '</li>';
    });

    return '<ul class="index-nav">' + nav + '</ul>' + buildToggleScript();
}

function buildMembers(members, title, linktoFn) {
    if(members == null || members.length === 0 ) return "";

    var memberNav = "";
    members.forEach(function(member) {
        var link = member.kind === "event" ? '<a href="' + member.title + '">' + member.name + '</a>' : linktoFn(member.longname, member.name);

        var innerNav = "";
        memberNav += '<li>' + link + '</li>';
        innerNav += buildMembers(member.interfaces, 'Interfaces', linktoFn);
        innerNav += buildMembers(member.classes, 'Classes', linktoFn);
        innerNav += buildMembers(member.events, 'Events', linktoFn);
        memberNav += innerNav !== "" ? "<ul>" + innerNav + "</ul>" : "";
    });

    return '<li class="title">' + title + '</li>' + memberNav;
}

function buildToggleScript() {
    return "<script type=\"text/javascript\">" +
        "  $(\".index-nav button[id^='toggle_']\").click(function() {" +
        "    var $this = $(this);" +
        "    var index = $this.attr('id').replace('toggle_', '');" +
        "    $this.toggleClass('mt-toggle-expand').toggleClass('mt-toggle-collapse');" +
        "    $('ul#namespace_' + index).toggleClass('namespace-collapsed').slideToggle();" +
        "  });" +
        "</script>";
}

/**
    @param {TAFFY} taffyData See <http://taffydb.com/>.
    @param {object} opts
    @param {Tutorial} tutorials
 */
exports.publish = function(taffyData, opts, tutorials) {
    data = taffyData;

    var conf = env.conf.templates || {};
    conf.default = conf.default || {};
    var templatePath = path.normalize(opts.template);
    view = new template.Template( path.join(templatePath, 'tmpl') );

    // claim some special filenames in advance, so the All-Powerful Overseer of Filename Uniqueness
    // doesn't try to hand them out later
    var indexUrl = helper.getUniqueFilename('index');
    // don't call registerLink() on this one! 'index' is also a valid longname

    var globalUrl = helper.getUniqueFilename('global');
    helper.registerLink('global', globalUrl);

    // set up templating
    view.layout = opts.layoutFile;

    // set up tutorials for helper
    helper.setTutorials(tutorials);

    data = helper.prune(data);
    data.sort('longname, version, since');
    helper.addEventListeners(data);

    var sourceFiles = {};
    var sourceFilePaths = [];
    data().each(function(doclet) {
         doclet.attribs = '';

        if (doclet.examples) {
            doclet.examples = doclet.examples.map(function(example) {
                var caption, code;

                if (example.match(/^\s*<caption>([\s\S]+?)<\/caption>(\s*[\n\r])([\s\S]+)$/i)) {
                    caption = RegExp.$1;
                    code = RegExp.$3;
                }

                return {
                    caption: caption || '',
                    code: code || example
                };
            });
        }
        if (doclet.codeExamples) {
            doclet.codeExamples = doclet.codeExamples.map(function(codeExample) {
                var caption, code;

                if (codeExample.match(/^\s*<caption>([\s\S]+?)<\/caption>(\s*[\n\r])([\s\S]+)$/i)) {
                    caption = RegExp.$1;
                    code = RegExp.$3;
                }

                return {
                    caption: caption || '',
                    code: code || codeExample
                };
            });
        }
        if (doclet.see) {
            doclet.see.forEach(function(seeItem, i) {
                doclet.see[i] = hashToLink(doclet, seeItem);
            });
        }

        // build a list of source files
        var sourcePath;
        if (doclet.meta) {
            sourcePath = getPathFromDoclet(doclet);
            sourceFiles[sourcePath] = {
                resolved: sourcePath,
                shortened: null
            };
            if (sourceFilePaths.indexOf(sourcePath) === -1) {
                sourceFilePaths.push(sourcePath);
            }
        }
    });

    /*
     * Handle the defaul values for non optional properties correctly. 
     * 
     */
    data().each(function(doclet) {
        if (doclet.properties) {
            doclet.properties = doclet.properties.map(function(property) {
                var separator = " - ",
                    separatorLength = separator.length;
                
                var defaultvalue = property.defaultvalue;
                var description = property.description;

                if( property.defaultvalue !== 'undefined' && !property.optional && description.indexOf(separator) > 0) {
                    var index = description.indexOf(separator);
                    defaultvalue += " " + description.substr(separatorLength, index-separatorLength);
                    description = "<p>" + description.substr(index + separatorLength, description.length);
                }

                return {
                    defaultvalue: defaultvalue,
                    description: description,
                    type: property.type,
                    name: property.name
                }  
            });                  
        }
    });

    // update outdir if necessary, then create outdir
    var packageInfo = ( find({kind: 'package'}) || [] ) [0];
    if (packageInfo && packageInfo.name) {
        outdir = path.join( outdir, packageInfo.name, (packageInfo.version || '') );
    }
    fs.mkPath(outdir);

    // copy the template's static files to outdir
    var fromDir = path.join(templatePath, 'static');
    var staticFiles = fs.ls(fromDir, 3);

    staticFiles.forEach(function(fileName) {
        var toDir = fs.toDir( fileName.replace(fromDir, outdir) );
        fs.mkPath(toDir);
        fs.copyFileSync(fileName, toDir);
    });

    // copy user-specified static files to outdir
    var staticFilePaths;
    var staticFileFilter;
    var staticFileScanner;
    if (conf.default.staticFiles) {
        // The canonical property name is `include`. We accept `paths` for backwards compatibility
        // with a bug in JSDoc 3.2.x.
        staticFilePaths = conf.default.staticFiles.include ||
            conf.default.staticFiles.paths ||
            [];
        staticFileFilter = new (require('jsdoc/src/filter')).Filter(conf.default.staticFiles);
        staticFileScanner = new (require('jsdoc/src/scanner')).Scanner();

        staticFilePaths.forEach(function(filePath) {
            var extraStaticFiles;

            filePath = path.resolve(env.pwd, filePath);
            extraStaticFiles = staticFileScanner.scan([filePath], 10, staticFileFilter);

            extraStaticFiles.forEach(function(fileName) {
                var sourcePath = fs.toDir(filePath);
                var toDir = fs.toDir( fileName.replace(sourcePath, outdir) );
                fs.mkPath(toDir);
                fs.copyFileSync(fileName, toDir);
            });
        });
    }

    if (sourceFilePaths.length) {
        sourceFiles = shortenPaths( sourceFiles, path.commonPrefix(sourceFilePaths) );
    }
    data().each(function(doclet) {
        var url = helper.createLink(doclet);
        helper.registerLink(doclet.longname, url);

        // add a shortened version of the full path
        var docletPath;
        if (doclet.meta) {
            docletPath = getPathFromDoclet(doclet);
            docletPath = sourceFiles[docletPath].shortened;
            if (docletPath) {
                doclet.meta.shortpath = docletPath;
            }
        }

        var sourceLink;
        if (doclet.meta) {
            sourceLink = getLinkFromDoclet(doclet);
            doclet.meta.sourceLink = sourceLink;
        }
    });

    data().each(function(doclet) {
        var url = helper.longnameToUrl[doclet.longname];

        if (url.indexOf('#') > -1) {
            doclet.id = helper.longnameToUrl[doclet.longname].split(/#/).pop();
        }
        else {
            doclet.id = doclet.name;
        }

        if ( needsSignature(doclet) ) {
            addSignatureParams(doclet);
            //addSignatureReturns(doclet);
            addAttribs(doclet);
        }
    });

    // do this after the urls have all been generated
    data().each(function(doclet) {
        doclet.ancestors = getAncestorLinks(doclet);

        if (doclet.kind === 'member') {
            addSignatureTypes(doclet);
            addAttribs(doclet);
        }

        if (doclet.kind === 'constant') {
            addSignatureTypes(doclet);
            addAttribs(doclet);
            doclet.kind = 'member';
            doclet.constant = true;
        }
    });

    data().each(function(doclet) {
        if(!doclet.ignore) {
            var parent = find({longname: doclet.memberof})[0];
            if( !parent ) {
                doclet.scopeEf = doclet.scope;
            } else {
                if(doclet.scope === 'static' && parent.kind !== 'class') {
                    doclet.scopeEf = 'instance';
                } else if(doclet.scope === 'static' && parent.static && parent.kind === 'class') {
                    doclet.scopeEf = 'instance';
                } else {
                    doclet.scopeEf = doclet.scope;
                }
            }
        }
    });

    // handle summary, description and class description default values properly
    data().each(function(doclet) {
        if(!doclet.ignore) {
            var desc;
            if(!doclet.summary && (desc = (doclet.description || doclet.classdesc))) {
                // Try to split when a "." or a ".</htmlTag>" is found.
                /*
                    ^              - start of string
                    \s*            - optional leading space
                    <tagName>      - optional tag, whose tagName is captured in m[1] and \1
                    \s*            - optional white space
                    (.|\n|\r)+?\.  - summary text, that can cross lines, and ends in a period; captured in m[2]
                    \s*            - optional white space
                    (
                      $          - the end of the string, or
                      \r|\n      - line-break, or
                      </tagName> - the closing tag from the corresponding to the beginning opening tag
                    )
                */
                var m = (/^\s*(?:<(\w+)>)?\s*((?:.|\n|\r)+?\.)\s*?($|(\r|\n)|(<\/\1>))/i).exec(desc);
                if(m) {
                  // MATCHED!
                  var tagName = m[1];
                  var summary = m[2];
                  if(tagName) summary = "<" + tagName + ">" + summary + "</" + tagName + ">";

                  doclet.summary = summary;
                  //console.log("summary: " + summary);
                  //console.log("  description: " + desc);
                  //console.log(" ");
                } else {
                  console.warn("Could not determine summary for: " + desc);
                }
            }

            var checkP = function(prop) {
                if(!prop) return;

                prop = prop.replace(/<p><p>/g, "<p>");

                if(prop.indexOf("<p>") == -1) {
                    return "<p>" + prop + "</p>";
                } 

                return prop;
            };

            var replaceCode = function(string) {
                if(!string) return;
                var flip = true;
                var idx = string.indexOf("`");
                while(idx > -1) {
                  string = string.substr(0, idx) + (flip ? "<code>" : "</code>") + string.substr(idx + 1);
                  flip = !flip;
                  idx = string.indexOf("`");
                }
                return string;
            };

            doclet.summary = replaceCode(checkP(doclet.summary));
            doclet.description = replaceCode(checkP(doclet.description));
            doclet.classdesc = replaceCode(checkP(doclet.classdesc));
        }
    });

    //handle splits and joins on names
    data().each(function(doclet) {
        if(!doclet.ignore) {
            var split = function(str, sep) {
                if(str) {
                    return str.split(sep).join('');
                } 
            }

            //dont split for code
            if(doclet.description && doclet.description.indexOf("syntax.javascript") == -1) {
                doclet.description = split(doclet.description, '<br>');
            }
            if(doclet.classdesc && doclet.classdesc.indexOf("syntax.javascript") == -1) {
                doclet.classdesc = split(doclet.classdesc, '<br>');
            }
            if(doclet.summary && doclet.summary.indexOf("syntax.javascript") == -1) { 
                doclet.summary = split(doclet.summary, '<br>');
            }
            
            doclet.parsedName = split(doclet.name, '"')
            doclet.parsedLongname = split(doclet.longname, '"')
        }
    });

    var members = helper.getMembers(data);
    members.tutorials = tutorials.children;
    
    // add template helpers
    view.find = find;
    view.linkto = linkto;
    view.resolveAuthorLinks = resolveAuthorLinks;
    view.tutoriallink = tutoriallink;
    view.htmlsafe = htmlsafe;
    
    // once for all
    view.nav = buildNav(findMembers(data, 'namespace'));
    attachModuleSymbols( find({ longname: {left: 'module:'} }), members.modules );

    if (members.globals.length) { generate('Global', [{kind: 'globalobj'}], globalUrl); }

    // index page displays information from package.json and lists files
    var files = find({kind: 'file'}),
        packages = find({kind: 'package'});

    generate('Home',
        packages.concat(
            [{kind: 'mainpage', readme: opts.readme, longname: (opts.mainpagetitle) ? opts.mainpagetitle : 'Main Page'}]
        ).concat(files),
    indexUrl);

    // set up the lists that we'll use to generate pages
    var classes = taffy(members.classes);
    var modules = taffy(members.modules);
    var namespaces = taffy(members.namespaces);
    var mixins = taffy(members.mixins);
    var externals = taffy(members.externals);
    var interfaces = taffy(members.interfaces);

    Object.keys(helper.longnameToUrl).forEach(function(longname) {
        var myModules = helper.find(modules, {longname: longname});
        if (myModules.length) {
            generate('Module: ' + myModules[0].name, myModules, helper.longnameToUrl[longname]);
        }

        var myClasses = helper.find(classes, {longname: longname});
        if (myClasses.length) {
            generate('Class: ' + myClasses[0].name, myClasses, helper.longnameToUrl[longname]);
        }

        var myNamespaces = helper.find(namespaces, {longname: longname});
        if (myNamespaces.length) {
            generate('Namespace: ' + myNamespaces[0].name, myNamespaces, helper.longnameToUrl[longname]);
        }

        var myMixins = helper.find(mixins, {longname: longname});
        if (myMixins.length) {
            generate('Mixin: ' + myMixins[0].name, myMixins, helper.longnameToUrl[longname]);
        }

        var myExternals = helper.find(externals, {longname: longname});
        if (myExternals.length) {
            generate('External: ' + myExternals[0].name, myExternals, helper.longnameToUrl[longname]);
        }

        var myInterfaces = helper.find(interfaces, {longname: longname});
        if (myInterfaces.length) {
            generate('Interface: ' + myInterfaces[0].name, myInterfaces, helper.longnameToUrl[longname]);
        }
    });

    // TODO: move the tutorial functions to templateHelper.js
    function generateTutorial(title, tutorial, filename) {
        var tutorialData = {
            title: title,
            header: tutorial.title,
            content: tutorial.parse(),
            children: tutorial.children
        };

        var tutorialPath = path.join(outdir, filename),
            html = view.render('tutorial.tmpl', tutorialData);

        // yes, you can use {@link} in tutorials too!
        html = helper.resolveLinks(html); // turn {@link foo} into <a href="foodoc.html">foo</a>

        fs.writeFileSync(tutorialPath, html, 'utf8');
    }

    // tutorials can have only one parent so there is no risk for loops
    function saveChildren(node) {
        node.children.forEach(function(child) {
            generateTutorial('Tutorial: ' + child.title, child, helper.tutorialToUrl(child.name));
            saveChildren(child);
        });
    }
    saveChildren(tutorials);
};
