var fs = require('fs');
var _ = require('lodash');
var wrapContentsStrategy = require('./WRAP_CONTENTS.strategy');
var wrapContentsBeforeReturnsStrategy = require('./WRAP_CONTENTS_BEFORE_RETURNS.strategy');
var wrapContentsAndBeforeBreakStrategy = require('./WRAP_CONTENTS_AND_BEFORE_BREAK.strategy');
var wrapContentsHijackReturnsStrategy = require('./WRAP_CONTENTS_HIJACK_RETURNS.strategy');

var files = fs.readdirSync('../app/angular/src');

var genericInjectPoints = [
  {
    indexOf: /if \(watch[^E](\w|\W)*(\))/,
    benchName: 'watch',
    description: 'Benchmark for watch expressions and functions.',
    expressionVar: 'watch.exp',
    functionVar: 'watch.fn',
    strategy: 'WRAP_CONTENTS_AND_BEFORE_BREAK'
  },
  /*{
    indexOf: '$watch: function',
    benchName: 'compileWatch',
    description: 'Benchmark for $watch initialization.',
    expressionVar: 'watchExp',
    strategy: 'WRAP_CONTENTS_BEFORE_RETURNS'
  },
  {
    indexOf: '$watchGroup: function',
    benchName: 'compileWatchCollection',
    description: 'Benchmark for $watchGroup initialization.',
    expressionVar: 'watchExpressions',
    strategy: 'WRAP_CONTENTS_BEFORE_RETURNS'
  },*/
  {
    indexOf: 'function $parse(',
    benchName: 'parse',
    description: 'Benchmark for $parse.',
    expressionVar: 'exp',
    strategy: 'WRAP_CONTENTS_HIJACK_RETURNS'
  },
  {
    indexOf: 'ngIfWatchAction',
    benchName: 'ngIf',
    description: 'Benchmark for ng-if expressions.',
    expressionVar: '$attr.ngIf',
    strategy: 'WRAP_CONTENTS'
  },
  {
    indexOf: 'ngShowWatchAction',
    benchName: 'ngShow',
    description: 'Benchmark for ng-show expressions.',
    expressionVar: 'attr.ngShow',
    strategy: 'WRAP_CONTENTS'
  },
  {
    indexOf: 'ngHideWatchAction',
    benchName: 'ngHide',
    description: 'Benchmark for ng-hide expressions.',
    expressionVar: 'attr.ngHide',
    strategy: 'WRAP_CONTENTS'
  },
  {
    indexOf: 'valueWatchAction',
    benchName: 'ngValue',
    description: 'Benchmark for ng-value expressions.',
    expressionVar: 'attr.ngValue',
    strategy: 'WRAP_CONTENTS'
  },
  {
    indexOf: 'ngBindWatchAction',
    benchName: 'ngBind',
    description: 'Benchmark for ng-bind expressions.',
    expressionVar: 'attr.ngBind',
    strategy: 'WRAP_CONTENTS'
  },
  {
    indexOf: 'ngBindHtmlWatchAction',
    benchName: 'ngBindHtml',
    description: 'Benchmark for ng-bind-html expressions.',
    expressionVar: 'attr.ngBindHtml',
    strategy: 'WRAP_CONTENTS'
  },
  {
    indexOf: 'ngIncludeWatchAction',
    benchName: 'ngInclude',
    description: 'Benchmark for ng-include expressions.',
    expressionVar: '$attr.ngInclude',
    strategy: 'WRAP_CONTENTS'
  },
  {
    indexOf: 'ngPluralizeWatchAction',
    benchName: 'ngPluralize',
    description: 'Benchmark for ng-pluralize expressions.',
    expressionVar: 'numberExp',
    strategy: 'WRAP_CONTENTS'
  },
  {
    indexOf: 'ngStyleWatchAction',
    benchName: 'ngStyle',
    description: 'Benchmark for ng-style expressions.',
    expressionVar: 'attr.ngStyle',
    strategy: 'WRAP_CONTENTS'
  },
  {
    indexOf: 'ngSwitchWatchAction',
    benchName: 'ngSwitch',
    description: 'Benchmark for ng-switch expressions.',
    expressionVar: 'watchExpr',
    strategy: 'WRAP_CONTENTS'
  }
];

_.each(files, function(file) {
  console.log('injecting ' + file);

  var source = fs.readFileSync('../app/angular/src/' + file, {encoding: 'utf8'});
  var benchClass = fs.readFileSync('templates/bench.class.tpl.js', {encoding: 'utf8'});
  var injectedFile = benchClass + '\n' + source;
  var res = null;

  _.each(genericInjectPoints, function(genericInjectPoint) {
    res = executeStrategy(genericInjectPoint.strategy, injectedFile, genericInjectPoint);

    if(!res) {
      console.error('strategy failed \'' + genericInjectPoint.strategy + '\' on ' + genericInjectPoint.benchName + ' -> ' + file);
    } else {
      injectedFile = res;
    }
  });

  fs.writeFileSync('../app/angular/' + file.replace('.src', ''), injectedFile);
});

function executeStrategy(strategy, str, options) {
  switch(strategy) {
    case 'WRAP_CONTENTS':
      return wrapContentsStrategy(str, options);
    case 'WRAP_CONTENTS_BEFORE_RETURNS':
      return wrapContentsBeforeReturnsStrategy(str, options);
    case 'WRAP_CONTENTS_AND_BEFORE_BREAK':
      return wrapContentsAndBeforeBreakStrategy(str, options);
    case 'WRAP_CONTENTS_HIJACK_RETURNS':
      return wrapContentsHijackReturnsStrategy(str, options);
    default:
      console.error('unknown strategy: ' + strategy);
  }

  return str;
}