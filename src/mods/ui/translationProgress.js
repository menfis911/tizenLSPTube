let panel;
export default function showTranslationProgress(message) {
    if (!message) {
        if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
        panel = null; return;
    }
    if (!panel) {
        panel = document.createElement('div');
        panel.setAttribute('role', 'status'); panel.setAttribute('aria-live', 'polite');
        panel.style.cssText = 'position:fixed;left:5vw;bottom:7vh;max-width:80vw;z-index:2147483646;background:#182128;color:#f4f0e6;padding:18px 26px;font-size:28px;line-height:1.4;pointer-events:none';
        document.body.appendChild(panel);
    }
    panel.textContent = 'Яндекс Перевод · ' + message;
}
