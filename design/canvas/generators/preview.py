"""Make standalone previews of .dc.html boards with a tiny stand-in runtime (holes, sc-if, events, setState).
Usage: python3 preview.py <canvas_dir>  -> writes <canvas_dir>/preview/<Board>.html"""
import sys, os, re

d = sys.argv[1]
os.makedirs(d + "/preview", exist_ok=True)

RUNTIME = r"""
<script>
class DCLogic { constructor(p){ this.props=p||{}; this.state={}; } setState(p){ this.state=Object.assign({}, this.state, typeof p==='function'?p(this.state):p); window.__render(); } }
window.addEventListener('DOMContentLoaded', () => {
  const tpl = document.getElementById('tpl'); const root = document.getElementById('root');
  const comp = new Component({});
  const val = (expr, v) => { expr = expr.trim(); if (expr==='true') return true; if (expr==='false') return false; return expr.split('.').reduce((o, k) => (o == null ? undefined : o[k]), v); };
  const expandFor = (box, v) => {
    let el; let n = 0;
    while ((el = box.querySelector('sc-for'))) {
      const m = /\{\{(.*?)\}\}/.exec(el.getAttribute('list') || ''); const list = (m ? val(m[1], v) : []) || [];
      const alias = el.getAttribute('as') || 'item'; const frag = document.createDocumentFragment();
      list.forEach((it) => {
        const holder = document.createElement('div'); holder.innerHTML = el.innerHTML;
        const sub = (str) => str.replace(new RegExp('\\{\\{\\s*' + alias + '\\.([a-zA-Z0-9_]+)\\s*\\}\\}', 'g'), (_, k) => {
          const x = it[k]; if (typeof x === 'function') { const key = '__fn' + (n++); v[key] = x; return '{{' + key + '}}'; } return String(x ?? ''); });
        const w = document.createTreeWalker(holder, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT); let q;
        while ((q = w.nextNode())) { if (q.nodeType === 3) { q.nodeValue = sub(q.nodeValue); } else { [...q.attributes].forEach(a => q.setAttribute(a.name, sub(a.value))); } }
        frag.append(...holder.childNodes);
      });
      el.replaceWith(frag);
    }
  };
  window.__render = () => {
    const v = comp.renderVals ? comp.renderVals() : {};
    const box = document.createElement('div'); box.appendChild(tpl.content.cloneNode(true)); expandFor(box, v);
    box.querySelectorAll('sc-if').forEach(el => {
      if (!box.contains(el)) return;
      const m = /\{\{(.*?)\}\}/.exec(el.getAttribute('value') || ''); const ok = m ? val(m[1], v) : false;
      if (!ok) el.remove(); else el.replaceWith(...el.childNodes);
    });
    const walker = document.createTreeWalker(box, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    const els = []; let n; while ((n = walker.nextNode())) els.push(n);
    els.forEach(node => {
      if (node.nodeType === 3) { if (node.nodeValue.includes('{{')) node.nodeValue = node.nodeValue.replace(/\{\{(.*?)\}\}/g, (_, k) => String(val(k, v) ?? '')); return; }
      [...node.attributes].forEach(a => {
        if (!a.value.includes('{{')) return;
        if (a.name.startsWith('on')) {
          const fn = val(/\{\{(.*?)\}\}/.exec(a.value)[1], v); node.removeAttribute(a.name);
          const ev = { onclick: 'click', onchange: 'input', onsubmit: 'submit' }[a.name] || a.name.slice(2);
          if (typeof fn === 'function') node.addEventListener(ev, fn);
          return;
        }
        const out = a.value.replace(/\{\{(.*?)\}\}/g, (_, k) => String(val(k, v) ?? ''));
        if (a.name === 'value' && (node.tagName === 'TEXTAREA' || node.tagName === 'INPUT')) { node.removeAttribute('value'); node.value = out; }
        else node.setAttribute(a.name, out);
      });
    });
    root.replaceChildren(...box.childNodes);
  };
  window.__render(); if (comp.componentDidMount) comp.componentDidMount();
});
</script>"""

for f in sorted(os.listdir(d + "/project")):
    if not ((f.startswith("V4") or f == "Main.dc.html") and f.endswith(".dc.html")):
        continue
    t = open(d + "/project/" + f).read()
    helmet = re.search(r"<helmet>(.*?)</helmet>", t, re.S).group(1)
    xdc = re.search(r"<x-dc>(.*?)</x-dc>", t, re.S).group(1)
    xdc = re.sub(r"<helmet>.*?</helmet>", "", xdc, flags=re.S)
    js = re.search(r'<script type="text/x-dc"[^>]*>(.*?)</script>', t, re.S).group(1)
    out = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{f}</title>{helmet}
{RUNTIME}<script>{js}</script></head><body><template id="tpl">{xdc}</template><div id="root"></div></body></html>"""
    open(d + "/preview/" + f.replace(".dc.html", ".html"), "w").write(out)
print(sorted(os.listdir(d + "/preview")))
