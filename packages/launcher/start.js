(function () {
    'use strict';
    var status = document.getElementById('status');
    var stateView = document.getElementById('state');
    var deadline = Date.now() + 45000;
    var opened = false;
    function report(error) { status.textContent = 'Ошибка: ' + error.name + ': ' + error.message; }
    function poll() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'http://127.0.0.1:18103/health');
        xhr.timeout = 6000;
        function retry() {
            if (Date.now() < deadline) setTimeout(poll, 1500);
            else status.textContent = 'Прокси не готов за 45 секунд. Сфотографируйте экран.';
        }
        xhr.onload = function () {
            try {
                if (xhr.status !== 200) throw new Error('HTTP ' + xhr.status);
                var state = JSON.parse(xhr.responseText);
                stateView.textContent = JSON.stringify(state, null, 2);
                if (state.phase === 'failed' || state.errors.length) {
                    status.textContent = 'Служба сообщила ошибку. Сфотографируйте экран.';
                    return;
                }
                if (state.cobalt8101 !== 'open') { retry(); return; }
                if (opened) return;
                opened = true;
                status.textContent = 'Собственная служба готова. Открываем Cobalt…';
                tizen.application.launch('xvvl3S1TT1.TizenTubeStandalone', function () {
                    status.textContent = 'Команда запуска Player принята.';
                }, report);
            } catch (error) { report(error); }
        };
        xhr.onerror = xhr.ontimeout = retry;
        xhr.send();
    }
    try {
        var service = tizen.application.getCurrentApplication().appInfo.packageId + '.StandaloneService';
        tizen.application.launchAppControl(new tizen.ApplicationControl('http://tizen.org/appcontrol/operation/service'),
            service, function () {
                status.textContent = 'Запуск собственной службы принят. Ждём готовности прокси…';
                poll();
            }, report);
    } catch (error) { report(error); }
    document.addEventListener('keydown', function (event) {
        if (event.keyCode === 10009) tizen.application.getCurrentApplication().exit();
    });
}());
