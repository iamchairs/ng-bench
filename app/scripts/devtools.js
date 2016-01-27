'use strict';

chrome.devtools.panels.create('ngBench', 'images/icon-38.png', 'panel.html', function(panel) {
    var _window; // Going to hold the reference to panel.html's `window`

    var data = [];
    var port = chrome.runtime.connect({name: 'ngBench'});
    var messageHandlers = [];

    port.onMessage.addListener(function(msg) {
        // Write information to the panel, if exists.
        // If we don't have a panel reference (yet), queue the data.
        if (_window) {
            _window.propogateMessage(msg);
        } else {
            data.push(msg);
        }
    });

    panel.onShown.addListener(function tmp(panelWindow) {
        panel.onShown.removeListener(tmp); // Run once only
        _window = panelWindow;

        // Release queued data
        var msg;
        while (msg = data.shift()) {
          _window.propogateMessage(msg);
        }
            
        // Just to show that it's easy to talk to pass a message back:
        _window.sendMessage = function(msg) {
            port.postMessage(msg);
        };
    });
});