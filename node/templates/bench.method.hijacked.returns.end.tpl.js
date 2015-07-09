var $$retVal = $2

var endTime = new Date().getTime();
var diff = endTime - startTime;
var bench = $NgBenchPageRecorder.getActiveRecord().bench('<%= benchName %>');
bench.addTime(diff);
bench.benchExpression(<%= expressionVar %>, diff);

return $$retVal