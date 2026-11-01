(function () {
    'use strict';
    var status = document.getElementById('status');
    var details = document.getElementById('state');
    var deadline = Date.now() + 45000;
    function fail(message) {
        status.textContent = 'Не удалось открыть LSPTube. Посмотрите подробности и повторите запуск.';
        details.textContent = message;
    }
    function poll() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'http://127.0.0.1:18103/health');
        xhr.timeout = 6000;
        function retry() {
            if (Date.now() < deadline) setTimeout(poll, 1500);
            else fail('Сетевая служба не готова за 45 секунд.');
        }
        xhr.onerror = xhr.ontimeout = retry;
        xhr.onload = function () {
            try {
                if (xhr.status !== 200) throw new Error('HTTP ' + xhr.status);
                var state = JSON.parse(xhr.responseText);
                details.textContent = JSON.stringify(state, null, 2);
                if (state.errors.length || state.phase === 'failed') { fail(details.textContent); return; }
                if (state.proxy8100 !== 'open') { retry(); return; }
                status.textContent = 'Открываем телевизионный интерфейс…';
                // Same package and web context: no second app or SDB connection.
                location.replace('http://localhost:8100/tv');
            } catch (error) { fail(error.message); }
        };
        xhr.send();
    }
    if (typeof tizen === 'undefined') { status.textContent = 'Этот экран запуска работает на проекторе Samsung.'; return; }
    try {
        if (tizen.tvinputdevice) {
            ['ColorF0Red', 'ColorF1Green', 'ColorF2Yellow', 'ColorF3Blue', 'MediaPlayPause', 'MediaPlay', 'MediaPause', 'MediaStop', 'MediaFastForward', 'MediaRewind'].forEach(function (key) {
                try { tizen.tvinputdevice.registerKey(key); } catch (error) { /* Some remotes do not expose every media key. */ }
            });
        }
        var service = tizen.application.getCurrentApplication().appInfo.packageId + '.StandaloneService';
        tizen.application.launchAppControl(new tizen.ApplicationControl('http://tizen.org/appcontrol/operation/service'), service,
            function () { status.textContent = 'Подготавливаем просмотр…'; poll(); },
            function (error) { fail(error.name + ': ' + error.message); });
    } catch (error) { fail(error.message); }
    document.addEventListener('keydown', function (event) {
        if (event.keyCode === 10009) tizen.application.getCurrentApplication().exit();
    });
}());
