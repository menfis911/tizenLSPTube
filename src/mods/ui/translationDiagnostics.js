let closePrevious;

export default function showTranslationDiagnostics(title, details) {
    if (closePrevious) closePrevious();
    const panel = document.createElement('div');
    panel.setAttribute('role', 'alertdialog');
    panel.setAttribute('aria-label', title);
    panel.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483647;background:#182128;color:#f4f0e6;padding:5vh 6vw;font-family:sans-serif';
    const heading = document.createElement('h1');
    heading.style.cssText = 'font-size:40px;margin:0 0 20px';
    heading.textContent = 'LSPTube 0.7.2 · ' + title;
    const text = document.createElement('pre');
    text.style.cssText = 'font-size:25px;line-height:1.3;white-space:pre-wrap;margin:0';
    text.textContent = details;
    const hint = document.createElement('p');
    hint.style.cssText = 'font-size:25px;color:#ffb34d';
    hint.textContent = 'Сфотографируйте этот экран. ОК или Назад — закрыть.';
    panel.appendChild(heading); panel.appendChild(text); panel.appendChild(hint);
    function close() {
        document.removeEventListener('keydown', onKey, true);
        if (panel.parentNode) panel.parentNode.removeChild(panel);
        closePrevious = null;
    }
    function onKey(event) {
        if (![13, 27, 8, 461, 10009].includes(event.keyCode)) return;
        event.preventDefault(); event.stopImmediatePropagation(); close();
    }
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(panel);
    closePrevious = close;
}
