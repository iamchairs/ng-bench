function $NgBenchFunction(fn) {
  this.time = 0;
  this.calls = 0;
  this.fn = fn;
}

function $NgBenchExpression(exp) {
  this.time = 0;
  this.calls = 0;
  this.exp = exp;
  this.isFunction = typeof exp === 'function';
  this.functionCount = 0;
  this.functions = {};
}

function $NgBench(name) {
  var self = this;

  this.totalTime = 0;
  this.recordExpressionFunction = recordExpressionFunction;
  this.benchExpression = benchExpression;
  this.addTime = addTime;
  this.expressions = {};

  function recordExpressionFunction (expression, fn, time) {
    fn = fn+'';

    if(!self.expressions[expression].functions[fn]) {
      self.expressions[expression].functions[fn] = new $NgBenchFunction(fn);
      self.expressions[expression].functionCount++;
    }

    self.expressions[expression].functions[fn].calls++;
    self.expressions[expression].functions[fn].time += time;
  }

  function addTime (t) {
    self.totalTime += t;
  }

  function benchExpression (expression, time) {
    if(!self.expressions[expression]) {
      this.expressions[expression] = new $NgBenchExpression(expression);
    }

    self.expressions[expression].time += time;
    self.expressions[expression].calls++;
  }
}

function $NgBenchRecord(nm) {
  var self = this;

  this.name = nm;
  this.getName = getName;
  this.getBench = getBench;
  this.getBenches = getBenches;
  this.bench = bench;
  this.finish = finish;
  this.benches = {};
  this.running = true;

  function getName () {
    return self.name;
  }

  function bench(nm) {
    if(!self.benches[nm]) {
      self.benches[nm] = new $NgBench(nm);
    }

    return getBench(nm);
  }

  function getBench (nm) {
    return self.benches[nm];
  }

  function getBenches () {
    return self.benches;
  }

  function finish () {
    self.running = false;
  }
}

function $NgBenchRecorder () {
  var self = this;

  this.records = [];
  this.activeRecord = null;

  this.start = start 
  this.stop = stop;
  this.getName = getName;
  this.getActiveRecord = getActiveRecord;
  this.getRecords = getRecords;

  start('Startup Record');

  function start (nm) {
    if(self.activeRecord) {
      self.activeRecord.finish();
    }

    self.activeRecord  = new $NgBenchRecord(nm);
    self.records.push(self.activeRecord);
  }

  function stop () {
    /**
     * You can't actually stop recording but we can set a dummy record to record to.
     */

    if(self.activeRecord) {
      self.activeRecord.finish();
    }

    self.activeRecord = new $NgBenchRecord('dummy dumbo');
  }

  function getActiveRecord () {
    return self.activeRecord;
  }

  function getRecords () {
    return self.records;
  }

  function getName () {
    return self.name;
  }
}

var $NgBenchPageRecorder = window.top.$NgBenchPageRecorder = new $NgBenchRecorder();