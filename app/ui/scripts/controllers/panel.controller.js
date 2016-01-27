(function() {

  function PanelCtrl($scope, $q, proxyFiles) {
    var vm = this;

    this.files = [];
    this.proxyFiles = proxyFiles;
    this.file = '';
    this.proxyFile = proxyFiles[0].url;
    this.$NgBenchPageRecorder = null;
    this.activeRecord = null;

    this.setActiveRecord = setActiveRecord;
    this.clearActiveRecord = clearActiveRecord;
    this.proxy = proxy;
    this.clearProxy = clearProxy;
    this.start = start;
    this.stop = stop;
    this.isRecording = isRecording;
    this.reloadResources = reloadResources;
    this.proxyLoaded = false;

    this.selectedTab = null;
    this.selectTab = selectTab;

    onMessage(function(request) {
      if(request.message === 'PROXY_MADE') {
        initProxy();
      }
    });

    chrome.devtools.inspectedWindow.onResourceAdded.addListener(function() {
      vm.reloadResources();
    });

    reloadResources();
    initProxy();

    function initProxy() {
      chrome.storage.sync.get('ngBenchProxy', function(data) {
        var ngBenchProxy = this.ngBenchProxy = data.ngBenchProxy;

        if(!ngBenchProxy) {
          ngBenchProxy = this.ngBenchProxy = {};
        }

        chrome.devtools.inspectedWindow.eval('window.location.hostname', function(hostname) {
          this.file = '';
          vm.proxyLoaded = false;
          this.proxyFile = proxyFiles[0].url;

          if(ngBenchProxy[hostname]) {
            vm.proxyLoaded = ngBenchProxy[hostname].proxied || false;
            vm.file = ngBenchProxy[hostname].file;
            vm.proxyFile = ngBenchProxy[hostname].proxy;
          }

          if(vm.proxyLoaded) {
            reloadNgBenchPageRecorder();
          } else {
            $scope.$apply();
          }
        });
      });
    }

    function reloadNgBenchPageRecorder () {
      chrome.devtools.inspectedWindow.eval('$NgBenchPageRecorder', function($NgBenchPageRecorder) {
        if(vm.$NgBenchPageRecorder !== $NgBenchPageRecorder) {
          vm.$NgBenchPageRecorder = $NgBenchPageRecorder;
          $scope.$apply();
        }

        if($NgBenchPageRecorder) {
          if(vm.activeRecord) {
            reloadActiveRecord();
          }
        } else {
          setTimeout(reloadNgBenchPageRecorder, 1000);
        }
      });
    }

    function reloadActiveRecord () {
      for(var i = 0; i < vm.$NgBenchPageRecorder.records.length; i++) {
        var record = vm.$NgBenchPageRecorder.records[i];
        if(record.name === vm.activeRecord.name) {
          vm.activeRecord = record;
        }
      }
    }

    function stopNgBenchPageRecorder() {
      var defer = $q.defer();

      chrome.devtools.inspectedWindow.eval('$NgBenchPageRecorder.stop()', function(res) {
        defer.resolve();
      });

      return defer.promise;
    }

    function startNgBenchPageRecorder(nm) {
      var defer = $q.defer();

      chrome.devtools.inspectedWindow.eval('$NgBenchPageRecorder.start("' + nm + '")', function() {
        defer.resolve();
      });

      return defer.promise;
    }

    function reloadResources() {
      chrome.devtools.inspectedWindow.getResources(function(resources) {
        vm.files.length = 0;
        for(var i = 0; i < resources.length; i++) {
          var name = resources[i].url.split('/').pop();
          resources[i].name = name;

          if(resources[i].type === 'script' && name.indexOf('.js') !== -1 && name.indexOf('?') === -1) {
            vm.files.push(resources[i]);
          }

          /* im feeling lucky */
          if(!vm.file && name === 'angular.js') {
            vm.file = resources[i].url;
          }
        }

        vm.files.sort(function(a, b) {
          return (a.name.toLowerCase() < b.name.toLowerCase()) ? -1 : 1;
        });

        /**
         * If the background page told we proxied, check to see if it's still valid
         */
        var proxyFound = false;
        for(var i = 0; i < resources.length; i++) {
          var resource = resources[i];
          if(resources[i].url === vm.file) {
            proxyFound = true;
          }
        }

        $scope.$apply();
      });
    }

    function setActiveRecord (record) {
      vm.activeRecord = record;
      vm.selectedTab = null;
    }

    function clearActiveRecord () {
      vm.activeRecord = null;
      console.log('cleared');
    }

    function proxy(silent) {

      var originalFile = null;

      if(vm.file) {
        for(var i = 0; i < vm.files.length; i++) {
          if(vm.files[i].url === vm.file) {
            originalFile = vm.files[i];
          }
        }
      }

      if(originalFile) {
        chrome.storage.sync.get('ngBenchProxy', function(data) {
          var ngBenchProxy = data.ngBenchProxy;

          if(!ngBenchProxy) {
            ngBenchProxy = {};
          }

          chrome.devtools.inspectedWindow.eval('window.location.hostname', function(hostname) {
            ngBenchProxy[hostname] = {
              name: originalFile.name,
              file: originalFile.url,
              proxy: vm.proxyFile,
              proxied: false
            };

            chrome.storage.sync.set({ngBenchProxy: ngBenchProxy}, function() {
              sendMessage({message: 'PROXY_UPDATE'});
              chrome.devtools.inspectedWindow.reload(true);
            });

          });
        });
      } else {
        alert('could not find file: ' + vm.file);
      }

    }

    function clearProxy(silent) {
      chrome.storage.sync.get('ngBenchProxy', function(data) {
        var ngBenchProxy = data.ngBenchProxy;

        if(!ngBenchProxy) {
          ngBenchProxy = {};
        }

        chrome.devtools.inspectedWindow.eval('window.location.hostname', function(hostname) {
          delete ngBenchProxy[hostname];

          chrome.storage.sync.set({ngBenchProxy: ngBenchProxy}, function() {
            sendMessage({message: 'PROXY_UPDATE'});
            chrome.devtools.inspectedWindow.reload(true);
          });

        });
      });
    }

    function start() {
      var name = 'Record ' + vm.$NgBenchPageRecorder.records.length;
      startNgBenchPageRecorder(name).then(reloadNgBenchPageRecorder).then($scope.apply);
    }

    function stop() {
      stopNgBenchPageRecorder().then(reloadNgBenchPageRecorder).then($scope.apply);
    }

    /**
     * $NgBenchPageRecorder will always have an active record.
     *
     * If the active record isn't in the records array then $NgBenchPageRecorder will
     * not save that running record and we can assume $NgBenchPageRecorder isn't recording.
     */
    function isRecording() {
      if(vm.$NgBenchPageRecorder) {
        for(var i = 0; i < vm.$NgBenchPageRecorder.records.length; i++) {
          var record = vm.$NgBenchPageRecorder.records[i];
          if(record.name === vm.$NgBenchPageRecorder.activeRecord.name) {
            return true;
          }
        }
      }

      return false;
    }

    function selectTab (tab) {
      vm.selectedTab = tab;
    }

  }

  PanelCtrl.$inject = ['$scope', '$q', 'proxyFiles'];

  angular.module('panel')
    .controller('PanelCtrl', PanelCtrl);

})();

// Joys of chrome extension dev
var messageHandlers = [];

function onMessage(fn) {
  messageHandlers.push(fn); 
}

function propogateMessage(msg) {
  for(var i = 0; i < messageHandlers.length; i++) {
    messageHandlers[i](msg);
  }
}