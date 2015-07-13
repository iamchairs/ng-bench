var fs = require('fs');
var _ = require('lodash');
var util = require('./util');

module.exports = strategy;

function strategy (injectedFile, genericInjectPoint) {
  var pullData = util.pullMethod(injectedFile, genericInjectPoint.indexOf);

  if(!pullData) {
    return null;
  }

  var injectedMethod = injectMethod(genericInjectPoint.benchName, genericInjectPoint.expressionVar, pullData.method);
  return pullData.firstHalf + injectedMethod + pullData.lastHalf;
}

function injectMethod(benchName, expressionVar, method) {
  var returnRegex = /\n(\s*return\s*)/g;

  var benchMethodStart = fs.readFileSync('templates/bench.method.start.tpl.js', {encoding: 'utf8'});
  var benchMethodEnd = _.template(fs.readFileSync('templates/bench.method.end.tpl.js', {encoding: 'utf8'}))({
    benchName: benchName,
    expressionVar: expressionVar
  });

  var methodStart = -1;
  var methodEnd = -1;

  for(var i = 0; i < method.length; i++) {
    var chr = method[i];
    if(chr === '{' && methodStart === -1) {
      methodStart = i;
      break;
    }
  }

  var head = method.substr(0, methodStart+1);
  var contents = method.substr(methodStart+1, method.length - methodStart);
  
  contents = contents.replace(returnRegex, '\n\n' + benchMethodEnd + '\n$1');
  contents = '\n' + benchMethodStart + '\n' + contents;

  return head + contents;
}