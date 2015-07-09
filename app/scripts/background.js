(function() {
  'use strict';

  var localData;

  updateLocalData();
  
  chrome.webRequest.onBeforeRequest.addListener(function(details) {
    var ngBenchProxy = localData.ngBenchProxy;

    if(ngBenchProxy) {
      for(var hostname in ngBenchProxy) {

        var hostnameSettings = ngBenchProxy[hostname];
        var file = hostnameSettings.file;
        var proxy = hostnameSettings.proxy;

        if(proxy) {
          if(file === details.url) {
            hostnameSettings.proxied = true;
            chrome.storage.sync.set({ngBenchProxy: ngBenchProxy});

            return {
              redirectUrl: chrome.extension.getURL(proxy),
            };
          }
        }

      }
    }
    
  }, {
    urls: ['http://*/*', 'https://*/*']
  }, ['blocking']);

  chrome.runtime.onMessage.addListener(function(request) {
    if(request.message === 'PROXY_UPDATE') {
      updateLocalData();
    }
  });

  function updateLocalData() {
    chrome.storage.sync.get('ngBenchProxy', function(data) {
      localData = data;
    });
  }

})();