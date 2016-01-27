(function() {
  'use strict';

  var localData;
  var ports = [];
  var messageHandlers = [];

  updateLocalData();

  onMessage(function(request) {
    if(request.message === 'PROXY_UPDATE') {
      updateLocalData();
    }
  });

  chrome.runtime.onConnect.addListener(function(port) {
    if(port.name === 'ngBench') {
      ports.push(port);

      port.onDisconnect.addListener(function() {
        var i = ports.indexOf(port);
        if (i !== -1) {
          ports.splice(i, 1);
        }
      });

      port.onMessage.addListener(function(msg) {
        for(var i = 0; i < messageHandlers.length; i++) {
          messageHandlers[i](msg);
        }
      });
    }
  });
  
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
            sendMessage({message: 'PROXY_MADE', data: {url: details.url, proxy: chrome.extension.getURL(proxy)}});

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

  

  function sendMessage(msg) {
    for(var i = 0; i < ports.length; i++) {
      ports[i].postMessage(msg);
    }
  }

  function updateLocalData() {
    chrome.storage.sync.get('ngBenchProxy', function(data) {
      localData = data;
    });
  }

  function onMessage(fn) {
    messageHandlers.push(fn);
  }

})();