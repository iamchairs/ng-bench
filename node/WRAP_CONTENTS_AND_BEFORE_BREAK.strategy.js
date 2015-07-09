var fs = require('fs');
var _ = require('lodash');
var util = require('./util');

module.exports = strategy;

function strategy (injectedFile, genericInjectPoint) {
  var pullData = util.pullMethod(injectedFile, genericInjectPoint.indexOf);
  var injectedMethod = injectMethod(genericInjectPoint.benchName, genericInjectPoint.expressionVar, genericInjectPoint.functionVar, pullData.method);
  return pullData.firstHalf + injectedMethod + pullData.lastHalf;
}

function injectMethod(benchName, expressionVar, functionVar, method) {
  var breakRegex = /\n(\s*break\s*)/g;

  var benchMethodStart = fs.readFileSync('templates/bench.method.start.tpl.js', {encoding: 'utf8'});
  var benchMethodEnd = _.template(fs.readFileSync('templates/bench.method.func.end.tpl.js', {encoding: 'utf8'}))({
    benchName: benchName,
    expressionVar: expressionVar,
    functionVar: functionVar
  });

  var methodStart = -1;
  var methodEnd = -1;

  for(var i = 0; i < method.length; i++) {
    var chr = method[i];
    if(chr === '{' && methodStart === -1) {
      methodStart = i;
    } else if(chr === '}') {
      methodEnd = i;
    }
  }

  var head = method.substr(0, methodStart+1);
  var contents = method.substr(methodStart+1, methodEnd - methodStart - 1);
  var end = method.substr(methodEnd, method.length - methodEnd);

  contents = contents.replace(breakRegex, '\n\n' + benchMethodEnd + '\n$1');
  contents = '\n' + benchMethodStart + '\n' + contents + '\n' + benchMethodEnd + '\n';

  return head + contents + end;
}