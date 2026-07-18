// Утилиты для inf-web
export function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

export function setResultText(el, text) {
    el.textContent = text;
    el.className = 'result-box show';
}

export function setResultHTML(el, html) {
    el.innerHTML = html;
    el.className = 'result-box show';
}