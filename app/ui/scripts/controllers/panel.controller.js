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
    this.proxyLoaded = false;

    this.selectedTab = null;
    this.selectTab = selectTab;

    chrome.devtools.network.onNavigated.addListener(function() {
      /**
       * I hate it, but it looks like we need to wait for chrome to refresh it's resources
       */
      setTimeout(function() {
        reload();
      }, 1000);
    });

    reload();

    function initProxy() {
      var defer = $q.defer();

      chrome.storage.sync.get('ngBenchProxy', function(data) {
        var ngBenchProxy = data.ngBenchProxy;

        if(!ngBenchProxy) {
          ngBenchProxy = {};
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

          defer.resolve();
        });
      });

      return defer.promise;
    }

    function reloadNgBenchPageRecorder () {
      var defer = $q.defer();

      chrome.devtools.inspectedWindow.eval('$NgBenchPageRecorder', function($NgBenchPageRecorder) {
        vm.$NgBenchPageRecorder = $NgBenchPageRecorder;

        if(vm.activeRecord) {
          reloadActiveRecord();
        }
        
        defer.resolve();
      });

      return defer.promise;
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
      var defer = $q.defer();

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

        if(!proxyFound) {
          clearProxy(true).then(function() {
            defer.resolve();
          });
        } else {
          defer.resolve();
        }
      });
      
      return defer.promise;
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
      var defer = $q.defer();

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
              chrome.runtime.sendMessage({message: 'PROXY_UPDATE'});

              if(!silent) {
                alert('Reload page to begin.');
              }

              defer.resolve();
            });

          });
        });
      } else {
        alert('could not find file: ' + vm.file);
        defer.reject();
      }

      return defer;
    }

    function clearProxy(silent) {
      var defer = $q.defer();

      chrome.storage.sync.get('ngBenchProxy', function(data) {
        var ngBenchProxy = data.ngBenchProxy;

        if(!ngBenchProxy) {
          ngBenchProxy = {};
        }

        chrome.devtools.inspectedWindow.eval('window.location.hostname', function(hostname) {
          delete ngBenchProxy[hostname];

          chrome.storage.sync.set({ngBenchProxy: ngBenchProxy}, function() {
            if(!silent) {
              alert('Proxy cleared. Reload page to return to normal.');
            }

            chrome.runtime.sendMessage({message: 'PROXY_UPDATE'});

            defer.resolve();
          });

        });
      });

      return defer.promise;
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

    function reload () {
      return reloadResources()
        .then(initProxy)
        .then(reloadNgBenchPageRecorder)
        .then($scope.apply);
    }
  }

  PanelCtrl.$inject = ['$scope', '$q', 'proxyFiles'];

  angular.module('panel')
    .controller('PanelCtrl', PanelCtrl);

})();