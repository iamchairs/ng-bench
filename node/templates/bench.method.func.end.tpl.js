var endTime = new Date().getTime();
var diff = endTime - startTime;
var bench = $NgBenchPageRecorder.getActiveRecord().bench('<%= benchName %>');
bench.addTime(diff);
bench.benchExpression(<%= expressionVar %>, diff);
bench.recordExpressionFunction(<%= expressionVar %>, <%= functionVar %>, diff);