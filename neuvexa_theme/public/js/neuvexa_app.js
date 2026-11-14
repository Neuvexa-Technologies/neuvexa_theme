/* Neuvexa ERP — shared front-end app layer (loaded on every NAT page)
   Provides: white-label theming, working company switcher, Cmd/Ctrl-K command
   palette, and slide-in record drawers (hijacks existing row clicks).
   One file, included via <script src="/assets/neuvexa_theme/js/neuvexa_app.js">. */
(function(){
  "use strict";
  if (window.NX) return;

  // ---- White-label brand registry ----------------------------------------
  // Re-brand the whole product in ONE place. To ship a new reseller brand,
  // add a preset here (name, tagline, two accent colours) — nothing else.
  // The active brand is picked, in order, from:  ?brand=<key>  →  localStorage
  // "nx_brand"  →  DEFAULT_BRAND. So a single deployment can preview any brand
  // live (great for per-prospect demos) and a client install just sets its own.
  var BRANDS = {
    neuvexa: { brand:"Neuvexa ERP", tagline:"by Neuvexa", accent:"#2563EB", accentInk:"#1e40af", accent2:"#6d5ef5" },
    lumina:  { brand:"Lumina ERP",  tagline:"by Lumina",  accent:"#0ea5a4", accentInk:"#0f766e", accent2:"#22c55e" },
    vantage: { brand:"Vantage ERP", tagline:"by Vantage", accent:"#7c3aed", accentInk:"#5b21b6", accent2:"#ec4899" }
  };
  var DEFAULT_BRAND = "neuvexa";
  var DEFAULT_COMPANY = "Gulf Mobile & Accessories LLC";
  function brandKey(){
    try {
      var q = new URLSearchParams(location.search).get("brand");
      if(q && BRANDS[q]){ localStorage.setItem("nx_brand", q); return q; }
      return localStorage.getItem("nx_brand") || DEFAULT_BRAND;
    } catch(e){ return DEFAULT_BRAND; }
  }
  function brand(){ return BRANDS[brandKey()] || BRANDS[DEFAULT_BRAND]; }
  function setBrand(k){ if(!BRANDS[k]) return; try { localStorage.setItem("nx_brand", k); } catch(e){} applyTheme(); }
  var CONFIG = brand(); // active brand (kept for back-compat references)

  var LS_COMPANY = "nx_company";
  function company(){ try { return localStorage.getItem(LS_COMPANY) || DEFAULT_COMPANY; } catch(e){ return DEFAULT_COMPANY; } }
  function setCompany(c){ try { localStorage.setItem(LS_COMPANY, c); } catch(e){} }

  var AED = function(n){ return "AED " + (Math.round(n)).toLocaleString("en-US"); };
  function esc(s){ return (s==null?"":(""+s)).replace(/[&<>"]/g, function(c){ return ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;" })[c]; }); }
  async function api(path){ var r = await fetch(path, {credentials:"include"}); if(!r.ok) throw new Error(path+" -> "+r.status); return r.json(); }

  window.NX = {
    config: CONFIG, brands: BRANDS,
    get company(){ return company(); }, setCompany: setCompany,
    get brand(){ return brandKey(); }, setBrand: setBrand
  };

  // ---- Theming ------------------------------------------------------------
  function applyTheme(){
    var c = brand(); var root = document.documentElement;
    if (c.accent)    root.style.setProperty("--blue", c.accent);
    if (c.accentInk) root.style.setProperty("--blue-ink", c.accentInk);
    root.style.setProperty("--accent2", c.accent2 || c.accent);
    var b = document.querySelector(".brand .txt b"); if (b && c.brand) b.textContent = c.brand;
    var s = document.querySelector(".brand .txt span"); if (s && c.tagline) s.textContent = c.tagline;
    try { document.title = document.title.replace(/Neuvexa ERP/g, c.brand); } catch(e){}
  }

  // ---- Dark "cockpit" mode ------------------------------------------------
  var LS_DARK = "nx_dark";
  function isDark(){ try { return localStorage.getItem(LS_DARK) === "1"; } catch(e){ return false; } }
  function applyDark(){ document.documentElement.classList.toggle("nx-dark", isDark()); updateDarkBtn(); }
  function toggleDark(){ try { localStorage.setItem(LS_DARK, isDark() ? "0" : "1"); } catch(e){} applyDark(); }
  NX.toggleDark = toggleDark;
  var _darkBtn=null;
  var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg>';
  function updateDarkBtn(){ if(_darkBtn) _darkBtn.innerHTML = isDark() ? SUN : MOON; }
  function wireDarkMode(){
    var acts = document.querySelector(".top-actions"); if(!acts) return;
    _darkBtn = document.createElement("button");
    _darkBtn.className = "bell nx-darktoggle"; _darkBtn.title = "Toggle dark mode";
    _darkBtn.addEventListener("click", toggleDark);
    acts.insertBefore(_darkBtn, acts.firstChild);
    updateDarkBtn();
  }
  function injectDarkCSS(){
    var d = "html.nx-dark";
    var css = ""
    + d+"{--bg:#0a0e1a;--card:#111728;--ink:#e8edf7;--ink2:#c7d0e2;--muted:#808bA1;--muted2:#5f6b82;--line:#1c2437;--line2:#283350;--navy:#eef2fb;}"
    + d+" body{background:radial-gradient(1100px 560px at 82% -12%,rgba(37,99,235,.12),transparent),radial-gradient(900px 500px at 0% 110%,rgba(109,94,245,.10),transparent),var(--bg);color:var(--ink);}"
    + d+" .topbar{background:#0d1324;border-bottom-color:var(--line2);}"
    + d+" .search{background:#0a0f1e;border-color:var(--line2);color:var(--muted);}"
    + d+" .search svg{stroke:var(--muted2);}"
    + d+" .wswitch{border-color:var(--line2);background:#0d1324;}"
    + d+" .wswitch .l b{color:var(--ink);}"
    + d+" .bell,"+d+" .nx-darktoggle{background:#0d1324;border-color:var(--line2);}"
    + d+" .bell svg,"+d+" .nx-darktoggle svg{stroke:#9aa6bd;}"
    + d+" .nx-darktoggle{cursor:pointer;}"
    + d+" .ask{background:rgba(37,99,235,.16);color:#9ec2ff;}"
    + d+" .me .l b{color:var(--ink);}"
    + d+" .page-head h1{color:var(--navy);}"
    + d+" .kpi,"+d+" .panel{background:var(--card);border-color:var(--line2);box-shadow:0 1px 2px rgba(0,0,0,.45),0 0 0 1px rgba(37,99,235,.05);}"
    + d+" .kpi .val{color:var(--navy);}"
    + d+" thead th{background:#0e1527;color:var(--muted);border-bottom-color:var(--line2);}"
    + d+" tbody td{border-bottom-color:var(--line);color:var(--ink2);}"
    + d+" tbody tr:hover td{background:rgba(37,99,235,.09);}"
    + d+" .btn{background:#0d1324;color:var(--ink2);border-color:var(--line2);}"
    + d+" .btn svg{stroke:#9aa6bd;}"
    + d+" .finder{background:#0d1324;border-color:var(--line2);}"
    + d+" .finder input{color:var(--ink);background:transparent;}"
    + d+" .tag{background:#1a2238;color:#aab6cc;}"
    + d+" .cust b{color:var(--navy);}"
    + d+" .src{background:rgba(10,14,26,.82);border-color:var(--line2);color:#6b7791;}"
    // overlays
    + d+" .nx-drawer,"+d+" .nx-menu,"+d+" .nx-pal{background:#111728;border-color:var(--line2);color:var(--ink);}"
    + d+" .nx-menu .nx-mi{color:var(--ink2);}"
    + d+" .nx-menu .nx-mi:hover,"+d+" .nx-menu .nx-mi.on{background:rgba(37,99,235,.14);}"
    + d+" .nx-drawer .dh h2,"+d+" .nx-pal .r b{color:var(--ink);}"
    + d+" .nx-drawer .fr{border-bottom-color:var(--line);}"
    + d+" .nx-drawer .fr .v{color:var(--ink2);}"
    + d+" .nx-drawer .fr .v.big{color:var(--ink);}"
    + d+" .nx-drawer .dh,"+d+" .nx-drawer .df,"+d+" .nx-pal .hd,"+d+" .nx-pal .bd{border-color:var(--line);}"
    + d+" .nx-drawer .dh .x,"+d+" .nx-drawer .df a{background:#0d1324;border-color:var(--line2);color:var(--ink2);}"
    + d+" .nx-drawer .df a.pri{background:var(--blue);color:#fff;}"
    + d+" .nx-pal .hd input{color:var(--ink);}"
    + d+" .nx-pal .hd svg{stroke:var(--muted);}"
    + d+" .nx-pal .r:hover,"+d+" .nx-pal .r.sel{background:rgba(37,99,235,.14);}"
    + d+" .nx-form .ff input,"+d+" .nx-form .ff select,"+d+" .nx-form .ff textarea{background:#0d1324;border-color:var(--line2);color:var(--ink);}"
    + d+" .nx-form .lg{background:#0d1324;border-color:var(--line2);}"
    + d+" .nx-form .lg-row select,"+d+" .nx-form .lg-row input{background:#0a0f1e;border-color:var(--line2);color:var(--ink);}"
    + d+" .nx-form .lg-add{background:#0d1324;}"
    + d+" .nx-form .lg-tot b{color:var(--ink);}";
    var st=document.createElement("style"); st.textContent=css; document.head.appendChild(st);
  }

  // ---- Responsive (tablet / phone) ---------------------------------------
  function injectResponsiveCSS(){
    var css = ""
    + ".nx-burger{display:none;width:38px;height:38px;border-radius:9px;border:1px solid var(--line2,#e6eaf1);background:#fff;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;}"
    + ".nx-burger svg{width:18px;height:18px;stroke:#5a6578;}"
    + ".nx-backdrop{position:fixed;inset:0;background:rgba(10,14,26,.45);z-index:88;opacity:0;pointer-events:none;transition:opacity .2s;}"
    + "html.nx-sb-open .nx-backdrop{opacity:1;pointer-events:auto;}"
    + "@media(max-width:920px){"
    + "  .kpis{grid-template-columns:repeat(2,1fr)!important;}"
    + "}"
    + "@media(max-width:760px){"
    + "  .nx-burger{display:flex;}"
    + "  .sidebar{position:fixed;left:0;top:0;bottom:0;transform:translateX(-100%);transition:transform .24s cubic-bezier(.4,0,.2,1);z-index:92;box-shadow:0 0 60px rgba(0,0,0,.4);}"
    + "  html.nx-sb-open .sidebar{transform:none;}"
    + "  .topbar{gap:10px;padding:0 14px;}"
    + "  .wswitch{min-width:0;flex:1;max-width:none;padding:7px 10px;}"
    + "  .wswitch .l span{display:none;}"
    + "  .search{display:none;}"
    + "  .top-actions{gap:9px;}"
    + "  .me .l{display:none;}"
    + "  .ask span,.ask{font-size:0;padding:8px;}"
    + "  .ask svg{width:17px;height:17px;}"
    + "  .content{padding:16px 14px;}"
    + "  .page-head{flex-direction:column;gap:12px;}"
    + "  .page-head h1{font-size:20px;}"
    + "  .kpis{grid-template-columns:1fr!important;}"
    + "  .panel{overflow-x:auto;}"
    + "  table{min-width:560px;}"
    + "  .nx-pal{width:94vw;top:64px;}"
    + "  .nx-drawer,.nx-form{width:100vw;max-width:100vw;}"
    + "}";
    var st=document.createElement("style"); st.textContent=css; document.head.appendChild(st);
  }
  function wireResponsive(){
    var tb = document.querySelector(".topbar"); if(!tb) return;
    var burger = document.createElement("button");
    burger.className = "nx-burger"; burger.title = "Menu";
    burger.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>';
    burger.addEventListener("click", function(e){ e.stopPropagation(); document.documentElement.classList.toggle("nx-sb-open"); });
    tb.insertBefore(burger, tb.firstChild);
    var bd = document.createElement("div"); bd.className = "nx-backdrop";
    bd.addEventListener("click", function(){ document.documentElement.classList.remove("nx-sb-open"); });
    document.body.appendChild(bd);
  }

  // ---- Injected styles ----------------------------------------------------
  function injectCSS(){
    var css = ""
    + ".nx-menu{position:absolute;z-index:60;background:#fff;border:1px solid var(--line2,#e6eaf1);border-radius:12px;box-shadow:0 12px 34px rgba(16,24,40,.16);padding:6px;min-width:260px;max-height:320px;overflow:auto;}"
    + ".nx-menu .nx-mt{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#8a94a6;font-weight:700;padding:8px 10px 4px;}"
    + ".nx-menu .nx-mi{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:9px;cursor:pointer;font-size:13px;color:#1d2a44;}"
    + ".nx-menu .nx-mi:hover,.nx-menu .nx-mi.on{background:var(--blue-soft,#eaf0fe);}"
    + ".nx-menu .nx-mi .ck{margin-left:auto;color:var(--blue,#2563EB);font-weight:700;opacity:0;}"
    + ".nx-menu .nx-mi.cur .ck{opacity:1;}"
    + ".nx-menu .nx-mi .ic{width:26px;height:26px;border-radius:7px;background:var(--blue-soft,#eaf0fe);color:var(--blue,#2563EB);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;}"
    + ".nx-mask{position:fixed;inset:0;background:rgba(15,27,51,.32);z-index:70;opacity:0;transition:opacity .15s;}"
    + ".nx-mask.show{opacity:1;}"
    // command palette
    + ".nx-pal{position:fixed;left:50%;top:84px;transform:translateX(-50%);width:600px;max-width:92vw;z-index:80;background:#fff;border:1px solid var(--line2,#e6eaf1);border-radius:16px;box-shadow:0 24px 60px rgba(16,24,40,.28);overflow:hidden;}"
    + ".nx-pal .hd{display:flex;align-items:center;gap:11px;padding:15px 18px;border-bottom:1px solid var(--line,#edf0f5);}"
    + ".nx-pal .hd svg{width:17px;height:17px;stroke:#8a94a6;}"
    + ".nx-pal .hd input{border:none;outline:none;flex:1;font-size:15px;color:#101828;background:transparent;}"
    + ".nx-pal .hd .esc{font-size:11px;color:#aeb6c4;border:1px solid var(--line2,#e6eaf1);border-radius:6px;padding:2px 7px;}"
    + ".nx-pal .bd{max-height:48vh;overflow:auto;padding:6px;}"
    + ".nx-pal .g{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#8a94a6;font-weight:700;padding:10px 10px 4px;}"
    + ".nx-pal .r{display:flex;align-items:center;gap:11px;padding:9px 10px;border-radius:9px;cursor:pointer;}"
    + ".nx-pal .r:hover,.nx-pal .r.sel{background:var(--blue-soft,#eaf0fe);}"
    + ".nx-pal .r .ic{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}"
    + ".nx-pal .r .ic svg{width:15px;height:15px;}"
    + ".nx-pal .r b{font-size:13.5px;font-weight:600;color:#0f1b33;display:block;}"
    + ".nx-pal .r span{font-size:11.5px;color:#8a94a6;}"
    + ".nx-pal .r .meta{margin-left:auto;font-size:12px;font-weight:700;color:#1d2a44;}"
    + ".nx-pal .hint{padding:16px;text-align:center;color:#8a94a6;font-size:13px;}"
    // drawer
    + ".nx-drawer{position:fixed;top:0;right:0;height:100%;width:460px;max-width:94vw;z-index:80;background:#fff;box-shadow:-18px 0 50px rgba(16,24,40,.18);transform:translateX(100%);transition:transform .22s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;}"
    + ".nx-drawer.show{transform:none;}"
    + ".nx-drawer .dh{padding:20px 22px 16px;border-bottom:1px solid var(--line,#edf0f5);}"
    + ".nx-drawer .dh .tp{display:flex;align-items:center;justify-content:space-between;}"
    + ".nx-drawer .dh .kind{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:#8a94a6;font-weight:700;}"
    + ".nx-drawer .dh .x{width:30px;height:30px;border-radius:8px;border:1px solid var(--line2,#e6eaf1);background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#5a6578;font-size:16px;}"
    + ".nx-drawer .dh h2{font-size:19px;font-weight:800;color:#0f1b33;margin-top:7px;}"
    + ".nx-drawer .chip{display:inline-block;margin-top:9px;padding:3px 11px;border-radius:999px;font-size:11px;font-weight:700;background:#eef1f6;color:#5a6578;}"
    + ".nx-drawer .db{flex:1;overflow:auto;padding:8px 22px 22px;}"
    + ".nx-drawer .fr{display:flex;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid var(--line,#edf0f5);font-size:13.5px;}"
    + ".nx-drawer .fr .k{color:#8a94a6;}"
    + ".nx-drawer .fr .v{font-weight:600;color:#1d2a44;text-align:right;}"
    + ".nx-drawer .fr .v.big{font-size:16px;font-weight:800;color:#0f1b33;}"
    + ".nx-drawer .df{padding:16px 22px;border-top:1px solid var(--line,#edf0f5);display:flex;gap:10px;}"
    + ".nx-drawer .df a{flex:1;text-align:center;border:1px solid var(--line2,#e6eaf1);border-radius:9px;padding:10px;font-size:13px;font-weight:600;color:#1d2a44;text-decoration:none;}"
    + ".nx-drawer .df a.pri{background:var(--blue,#2563EB);color:#fff;border-color:var(--blue,#2563EB);}"
    + ".nx-pulse{color:#8a94a6;font-size:13px;padding:24px 0;text-align:center;}";
    var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  }

  // ---- Company switcher ---------------------------------------------------
  async function buildSwitcher(){
    var sw = document.querySelector(".wswitch"); if(!sw) return;
    sw.style.cursor = "pointer";
    var label = sw.querySelector(".l b"); if(label) label.textContent = company();
    var companies = [];
    try { companies = ((await api("/api/resource/Company?fields=[\"name\"]&limit_page_length=0")).data || []).map(function(c){ return c.name; }); } catch(e){}
    if (companies.indexOf(company()) < 0 && companies.length) { /* keep stored even if list fails */ }
    var open = false, menu = null;
    function close(){ if(menu){ menu.remove(); menu=null; } open=false; }
    sw.addEventListener("click", function(e){
      e.stopPropagation();
      if(open){ close(); return; }
      open = true;
      menu = document.createElement("div"); menu.className = "nx-menu";
      var list = companies.length ? companies : [company()];
      menu.innerHTML = '<div class="nx-mt">Switch company</div>' + list.map(function(c){
        var ini = c.split(" ").map(function(w){return w[0];}).join("").slice(0,2).toUpperCase();
        return '<div class="nx-mi '+(c===company()?'cur':'')+'" data-c="'+esc(c)+'"><div class="ic">'+esc(ini)+'</div>'+esc(c)+'<span class="ck">&#10003;</span></div>';
      }).join("");
      document.body.appendChild(menu);
      var r = sw.getBoundingClientRect();
      menu.style.left = r.left + "px"; menu.style.top = (r.bottom + 6) + "px"; menu.style.minWidth = Math.max(260, r.width) + "px";
      menu.addEventListener("click", function(ev){
        var mi = ev.target.closest(".nx-mi"); if(!mi) return;
        var c = mi.getAttribute("data-c");
        if(c && c !== company()){ setCompany(c); location.reload(); }
        close();
      });
    });
    document.addEventListener("click", close);
  }

  // ---- Command palette ----------------------------------------------------
  var SEARCH = [
    { dt:"Customer", route:"customers", label:"Customers", name:"customer_name", icon:'<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>', tint:"#2563EB" },
    { dt:"Item", route:"items", label:"Items", name:"item_name", icon:'<path d="M21 16V8a2 2 0 00-1-1.7l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.7l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>', tint:"#16a34a" },
    { dt:"Sales Invoice", route:"app/sales-invoice", label:"Invoices", name:"customer", icon:'<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/>', tint:"#6d5ef5", amt:"grand_total", drawer:true }
  ];
  function paletteBuild(){
    var mask = document.createElement("div"); mask.className = "nx-mask";
    var pal = document.createElement("div"); pal.className = "nx-pal";
    pal.innerHTML = '<div class="hd"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>'
      + '<input id="nxq" placeholder="Search customers, items, invoices…" autocomplete="off"><span class="esc">esc</span></div>'
      + '<div class="bd" id="nxbd"><div class="hint">Start typing to search across your company.</div></div>';
    document.body.appendChild(mask); document.body.appendChild(pal);
    var inp = pal.querySelector("#nxq"), bd = pal.querySelector("#nxbd");
    var results = [], sel = 0, t = null, open = true;
    function close(){ open=false; mask.classList.remove("show"); pal.remove(); mask.remove(); }
    function go(r){
      if(r.drawer){ close(); NX.openDrawer(r.dt, r.name); return; }
      if(r.route.indexOf("app/")===0){ location.href = "/"+r.route+"/"+encodeURIComponent(r.name); }
      else { location.href = "/"+r.route; }
    }
    function render(){
      if(!results.length){ bd.innerHTML = inp.value.trim() ? '<div class="hint">No matches for “'+esc(inp.value)+'”.</div>' : '<div class="hint">Start typing to search across your company.</div>'; return; }
      var html = "", g = "";
      results.forEach(function(r,i){
        if(r.group!==g){ g=r.group; html += '<div class="g">'+esc(g)+'</div>'; }
        html += '<div class="r '+(i===sel?'sel':'')+'" data-i="'+i+'"><div class="ic" style="background:'+r.tint+'1f">'
          + '<svg viewBox="0 0 24 24" fill="none" stroke="'+r.tint+'" stroke-width="2">'+r.icon+'</svg></div>'
          + '<div><b>'+esc(r.title)+'</b><span>'+esc(r.sub)+'</span></div>'
          + (r.meta?'<span class="meta">'+esc(r.meta)+'</span>':'')+'</div>';
      });
      bd.innerHTML = html;
    }
    async function search(q){
      if(!q){ results=[]; sel=0; render(); return; }
      var out = [];
      await Promise.all(SEARCH.map(async function(s){
        try{
          var fields = ["name"]; if(s.name && s.name!=="name") fields.push(s.name); if(s.amt) fields.push(s.amt);
          var filters = [["name","like","%"+q+"%"]];
          if(s.name && s.name!=="name") filters = [[s.name,"like","%"+q+"%"]];
          if(s.dt==="Sales Invoice") filters.push(["company","=",company()]);
          var p = new URLSearchParams(); p.set("fields", JSON.stringify(fields)); p.set("filters", JSON.stringify(filters)); p.set("limit_page_length","5");
          var rows = (await api("/api/resource/"+encodeURIComponent(s.dt)+"?"+p)).data || [];
          rows.forEach(function(d){
            out.push({ group:s.label, dt:s.dt, route:s.route, drawer:s.drawer, name:d.name, tint:s.tint, icon:s.icon,
              title: d[s.name] || d.name, sub: d.name,
              meta: s.amt && d[s.amt]!=null ? AED(d[s.amt]) : "" });
          });
        }catch(e){}
      }));
      results = out; sel = 0; render();
    }
    inp.addEventListener("input", function(){ clearTimeout(t); var q=inp.value.trim(); t=setTimeout(function(){ search(q); }, 180); });
    bd.addEventListener("click", function(e){ var r=e.target.closest(".r"); if(r) go(results[+r.getAttribute("data-i")]); });
    document.addEventListener("keydown", function k(e){
      if(!open){ document.removeEventListener("keydown",k); return; }
      if(e.key==="Escape"){ close(); }
      else if(e.key==="ArrowDown"){ e.preventDefault(); sel=Math.min(sel+1,results.length-1); render(); }
      else if(e.key==="ArrowUp"){ e.preventDefault(); sel=Math.max(sel-1,0); render(); }
      else if(e.key==="Enter"){ if(results[sel]) go(results[sel]); }
    });
    mask.addEventListener("click", close);
    requestAnimationFrame(function(){ mask.classList.add("show"); inp.focus(); });
  }
  function wirePalette(){
    document.addEventListener("keydown", function(e){
      if((e.metaKey||e.ctrlKey) && (e.key==="k"||e.key==="K")){ e.preventDefault(); paletteBuild(); }
    });
    var s = document.querySelector(".topbar .search"); if(s){ s.style.cursor="text"; s.addEventListener("click", paletteBuild); }
    var btns = document.querySelectorAll(".topbar .ask"); // keep Ask button as-is
  }

  // ---- Record drawers (hijack existing row clicks) ------------------------
  var ROUTE2DT = {
    "sales-invoice":"Sales Invoice","purchase-invoice":"Purchase Invoice","customer":"Customer",
    "supplier":"Supplier","item":"Item","quotation":"Quotation","payment-entry":"Payment Entry",
    "warehouse":"Warehouse","account":"Account"
  };
  var FIELDSETS = {
    "Sales Invoice":[["customer","Customer"],["posting_date","Date"],["due_date","Due"],["status","Status","chip"],["grand_total","Amount","amt big"],["outstanding_amount","Outstanding","amt"]],
    "Purchase Invoice":[["supplier","Supplier"],["posting_date","Date"],["due_date","Due"],["status","Status","chip"],["grand_total","Amount","amt big"],["outstanding_amount","Payable","amt"]],
    "Customer":[["customer_group","Group"],["territory","Territory"],["customer_type","Type"],["tax_id","Tax ID"],["email_id","Email"],["mobile_no","Mobile"]],
    "Supplier":[["supplier_group","Group"],["country","Country"],["supplier_type","Type"],["tax_id","Tax ID"]],
    "Item":[["item_group","Group"],["stock_uom","UoM"],["standard_rate","Price","amt"],["is_stock_item","Stock item","bool"],["description","Description"]],
    "Quotation":[["party_name","Customer"],["transaction_date","Date"],["valid_till","Valid till"],["status","Status","chip"],["grand_total","Amount","amt big"]],
    "Payment Entry":[["party_name","Party"],["party_type","Party type"],["payment_type","Type"],["posting_date","Date"],["paid_amount","Amount","amt big"],["status","Status","chip"]],
    "Warehouse":[["warehouse_name","Name"],["is_group","Group","bool"],["parent_warehouse","Parent"],["disabled","Disabled","bool"]],
    "Account":[["account_name","Name"],["account_type","Type"],["root_type","Root"],["report_type","Category"],["is_group","Group","bool"]]
  };
  var TITLEFIELD = { "Customer":"customer_name","Supplier":"supplier_name","Item":"item_name","Warehouse":"warehouse_name","Account":"account_name" };
  function fmt(v, mode){
    if(v==null||v==="") return "&mdash;";
    if(mode && mode.indexOf("amt")>=0) return AED(v);
    if(mode==="bool") return v?"Yes":"No";
    if(/^\d{4}-\d{2}-\d{2}/.test(v)){ var p=(""+v).slice(0,10).split("-"); return p[2]+"/"+p[1]+"/"+p[0]; }
    return esc(v);
  }
  NX.openDrawer = async function(dt, name){
    var mask = document.createElement("div"); mask.className = "nx-mask";
    var dr = document.createElement("div"); dr.className = "nx-drawer";
    dr.innerHTML = '<div class="dh"><div class="tp"><span class="kind">'+esc(dt)+'</span><div class="x">&times;</div></div><h2>'+esc(name)+'</h2></div><div class="db"><div class="nx-pulse">Loading…</div></div>';
    document.body.appendChild(mask); document.body.appendChild(dr);
    function close(){ mask.classList.remove("show"); dr.classList.remove("show"); setTimeout(function(){ dr.remove(); mask.remove(); }, 220); }
    dr.querySelector(".x").addEventListener("click", close);
    mask.addEventListener("click", close);
    document.addEventListener("keydown", function k(e){ if(e.key==="Escape"){ close(); document.removeEventListener("keydown",k); } });
    requestAnimationFrame(function(){ mask.classList.add("show"); dr.classList.add("show"); });
    try{
      var doc = (await api("/api/resource/"+encodeURIComponent(dt)+"/"+encodeURIComponent(name))).data;
      var title = doc[TITLEFIELD[dt]] || doc.name;
      var fs = FIELDSETS[dt] || [];
      var rowsHtml = fs.filter(function(f){ return doc[f[0]]!=null && doc[f[0]]!==""; }).map(function(f){
        return '<div class="fr"><span class="k">'+esc(f[1])+'</span><span class="v '+(f[2]||"")+'">'+fmt(doc[f[0]], f[2])+'</span></div>';
      }).join("");
      var route = Object.keys(ROUTE2DT).filter(function(r){ return ROUTE2DT[r]===dt; })[0] || dt.toLowerCase().replace(/ /g,"-");
      var hdChip = doc.status ? '<span class="chip">'+esc(doc.status)+'</span>' : '';
      dr.querySelector(".dh h2").textContent = title;
      dr.querySelector(".dh").insertAdjacentHTML("beforeend", hdChip);
      dr.querySelector(".db").innerHTML = rowsHtml || '<div class="nx-pulse">No preview fields.</div>';
      dr.insertAdjacentHTML("beforeend", '<div class="df"><a href="/app/'+route+'/'+encodeURIComponent(name)+'">Edit in ERP</a><a class="pri" href="/app/'+route+'/'+encodeURIComponent(name)+'">Open full record</a></div>');
    }catch(e){
      dr.querySelector(".db").innerHTML = '<div class="nx-pulse">Could not load this record.</div>';
    }
  };
  function wireDrawers(){
    document.addEventListener("click", function(e){
      var tr = e.target.closest("tbody tr[onclick]"); if(!tr) return;
      var oc = tr.getAttribute("onclick") || "";
      var m = oc.match(/\/app\/([^\/']+)\/([^']+)/);
      if(!m) return;
      var dt = ROUTE2DT[m[1]]; if(!dt) return;
      e.preventDefault(); e.stopImmediatePropagation();
      NX.openDrawer(dt, decodeURIComponent(m[2]));
    }, true); // capture phase — runs before the inline onclick
  }

  // ---- Toasts -------------------------------------------------------------
  var _toastWrap=null;
  function toast(msg, kind){
    if(!_toastWrap){ _toastWrap=document.createElement("div"); _toastWrap.className="nx-toasts"; document.body.appendChild(_toastWrap); }
    var t=document.createElement("div"); t.className="nx-toast "+(kind||"ok");
    var ic = kind==="err" ? "&#10005;" : (kind==="info" ? "&#8505;" : "&#10003;");
    t.innerHTML='<span class="ti">'+ic+'</span><span class="tm">'+esc(msg)+'</span>';
    _toastWrap.appendChild(t);
    requestAnimationFrame(function(){ t.classList.add("show"); });
    setTimeout(function(){ t.classList.remove("show"); setTimeout(function(){ t.remove(); }, 260); }, 3800);
  }
  NX.toast = toast;

  // ---- CSRF + write helpers ----------------------------------------------
  var _csrf=null;
  async function csrf(){
    if(_csrf) return _csrf;
    try{ var html = await (await fetch("/app",{credentials:"include"})).text();
      var m = html.match(/csrf_token\s*[=:]\s*["']([^"']+)["']/); _csrf = m ? m[1] : "None";
    }catch(e){ _csrf="None"; }
    return _csrf;
  }
  NX.csrf = csrf;
  function serverMsg(j){
    try{ if(j._server_messages){ var arr=JSON.parse(j._server_messages); return arr.map(function(s){ try{ return JSON.parse(s).message; }catch(e){ return s; } }).join(" "); } }catch(e){}
    if(j.exception) return (""+j.exception).replace(/^[^:]*:\s*/,"");
    return null;
  }
  async function createDoc(doctype, payload){
    var token = await csrf();
    var r = await fetch("/api/resource/"+encodeURIComponent(doctype),{
      method:"POST", credentials:"include",
      headers:{"Content-Type":"application/json","X-Frappe-CSRF-Token":token},
      body: JSON.stringify(payload)
    });
    var j = await r.json().catch(function(){ return {}; });
    if(!r.ok || !j.data) throw new Error(serverMsg(j) || ("Could not save ("+r.status+")"));
    return j.data;
  }
  NX.create = createDoc;
  async function submitDoc(doctype, name){
    try{
      var token = await csrf();
      var doc = (await api("/api/resource/"+encodeURIComponent(doctype)+"/"+encodeURIComponent(name))).data;
      var r = await fetch("/api/method/frappe.client.submit",{
        method:"POST", credentials:"include",
        headers:{"Content-Type":"application/json","X-Frappe-CSRF-Token":token},
        body: JSON.stringify({ doc: JSON.stringify(doc) })
      });
      return r.ok;
    }catch(e){ return false; }
  }

  // ---- Create-form engine -------------------------------------------------
  function today(){ var d=new Date(); return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2); }
  var ITEMCACHE=null;
  async function itemOptions(){
    if(ITEMCACHE) return ITEMCACHE;
    var p=new URLSearchParams(); p.set("fields", JSON.stringify(["name","item_name","standard_rate"])); p.set("limit_page_length","0");
    ITEMCACHE = ((await api("/api/resource/Item?"+p)).data)||[];
    return ITEMCACHE;
  }
  async function sourceOptions(src){
    var lbl = src.label || "name";
    var fields = lbl==="name" ? ["name"] : ["name",lbl];
    var p=new URLSearchParams(); p.set("fields", JSON.stringify(fields));
    if(src.filters) p.set("filters", JSON.stringify(src.filters));
    if(src.company) p.set("filters", JSON.stringify((src.filters||[]).concat([["company","=",NX.company]])));
    p.set("limit_page_length","0"); p.set("order_by", lbl+" asc");
    var rows = ((await api("/api/resource/"+encodeURIComponent(src.doctype)+"?"+p)).data)||[];
    return rows.map(function(r){ return { value:r.name, label:r[lbl]||r.name }; });
  }

  NX.openForm = async function(spec){
    var mask=document.createElement("div"); mask.className="nx-mask";
    var dr=document.createElement("div"); dr.className="nx-drawer nx-form";
    dr.innerHTML='<div class="dh"><div class="tp"><span class="kind">New record</span><div class="x">&times;</div></div><h2>'+esc(spec.title||"New record")+'</h2></div>'
      +'<div class="db"><div class="nx-pulse">Loading form&hellip;</div></div>'
      +'<div class="df"><a class="cancelbtn">Cancel</a><a class="pri createbtn">Create</a></div>';
    document.body.appendChild(mask); document.body.appendChild(dr);
    function close(){ mask.classList.remove("show"); dr.classList.remove("show"); setTimeout(function(){ dr.remove(); mask.remove(); }, 220); }
    dr.querySelector(".x").addEventListener("click", close);
    dr.querySelector(".cancelbtn").addEventListener("click", close);
    mask.addEventListener("click", close);
    requestAnimationFrame(function(){ mask.classList.add("show"); dr.classList.add("show"); });

    // resolve select sources + item options in parallel
    var selFields = spec.fields.filter(function(f){ return f.type==="select" && f.source; });
    var needItems = spec.fields.some(function(f){ return f.type==="items"; });
    try{
      var loaded = await Promise.all(selFields.map(function(f){ return sourceOptions(f.source); }).concat(needItems?[itemOptions()]:[]));
      selFields.forEach(function(f,i){ f._opts = loaded[i]; });
      var items = needItems ? loaded[loaded.length-1] : [];

      var body = dr.querySelector(".db"); body.innerHTML="";
      spec.fields.forEach(function(f){
        var wrap=document.createElement("div"); wrap.className="ff";
        var lab='<label>'+esc(f.label)+(f.required?' <i>*</i>':'')+'</label>';
        if(f.type==="items"){
          wrap.innerHTML=lab+'<div class="lg"><div class="lg-rows"></div><button type="button" class="lg-add">+ Add line</button><div class="lg-tot">Total <b>AED 0</b></div></div>';
          wrap._kind="items";
        } else if(f.type==="select"){
          var opts = (f._opts || (f.options||[]).map(function(o){ return {value:o,label:o}; }));
          var sel='<select data-k="'+f.key+'"'+(f.required?' data-req="1"':'')+'>';
          sel+='<option value="">Select&hellip;</option>';
          opts.forEach(function(o){ sel+='<option value="'+esc(o.value)+'"'+(f.default===o.value?' selected':'')+'>'+esc(o.label)+'</option>'; });
          sel+='</select>'; wrap.innerHTML=lab+sel;
        } else if(f.type==="textarea"){
          wrap.innerHTML=lab+'<textarea data-k="'+f.key+'"'+(f.required?' data-req="1"':'')+' placeholder="'+esc(f.placeholder||"")+'"></textarea>';
        } else {
          var it = f.type==="number" ? "number" : (f.type==="date"?"date":"text");
          wrap.innerHTML=lab+'<input type="'+it+'" data-k="'+f.key+'"'+(f.required?' data-req="1"':'')+' placeholder="'+esc(f.placeholder||"")+'" value="'+esc(f.default||(f.type==="date"?today():""))+'">';
        }
        body.appendChild(wrap);
      });

      // line-items grid behaviour
      var grid = body.querySelector(".lg");
      if(grid){
        var rowsEl = grid.querySelector(".lg-rows"), totEl = grid.querySelector(".lg-tot b");
        function addRow(){
          var row=document.createElement("div"); row.className="lg-row";
          var osel='<option value="">Item&hellip;</option>'+items.map(function(o){ return '<option value="'+esc(o.name)+'" data-rate="'+(o.standard_rate||0)+'">'+esc(o.item_name||o.name)+'</option>'; }).join("");
          row.innerHTML='<select class="li-item">'+osel+'</select>'
            +'<input class="li-qty" type="number" min="0" value="1" placeholder="Qty">'
            +'<input class="li-rate" type="number" min="0" value="0" placeholder="Rate">'
            +'<span class="li-amt">AED 0</span><button type="button" class="li-x">&times;</button>';
          rowsEl.appendChild(row);
          row.querySelector(".li-item").addEventListener("change", function(e){ var o=e.target.selectedOptions[0]; if(o && o.dataset.rate && +row.querySelector(".li-rate").value===0) row.querySelector(".li-rate").value=o.dataset.rate; recalc(); });
          row.querySelector(".li-qty").addEventListener("input", recalc);
          row.querySelector(".li-rate").addEventListener("input", recalc);
          row.querySelector(".li-x").addEventListener("click", function(){ row.remove(); recalc(); });
          recalc();
        }
        function recalc(){
          var tot=0;
          rowsEl.querySelectorAll(".lg-row").forEach(function(r){ var a=(+r.querySelector(".li-qty").value||0)*(+r.querySelector(".li-rate").value||0); r.querySelector(".li-amt").textContent=AED(a); tot+=a; });
          totEl.textContent=AED(tot);
        }
        grid.querySelector(".lg-add").addEventListener("click", addRow);
        addRow();
      }

      // Create handler
      dr.querySelector(".createbtn").addEventListener("click", async function(){
        var btn=this; if(btn._busy) return;
        var values={}, bad=null;
        spec.fields.forEach(function(f){
          if(f.type==="items"){
            var lines=[];
            body.querySelectorAll(".lg-row").forEach(function(r){ var code=r.querySelector(".li-item").value; var qty=+r.querySelector(".li-qty").value||0; var rate=+r.querySelector(".li-rate").value||0; if(code && qty>0) lines.push({item_code:code, qty:qty, rate:rate}); });
            values[f.key]=lines; if(f.required && !lines.length) bad=bad||"Add at least one line item";
          } else {
            var ctl=body.querySelector('[data-k="'+f.key+'"]'); var v=ctl?ctl.value.trim():"";
            if(f.required && !v) bad=bad||("“"+f.label+"” is required");
            values[f.key]=v;
          }
        });
        if(bad){ toast(bad,"err"); return; }
        btn._busy=true; btn.textContent="Saving…"; btn.style.opacity=".65";
        try{
          var payload = spec.transform ? spec.transform(values) : values;
          var doc = await createDoc(spec.doctype, payload);
          if(spec.submittable) await submitDoc(spec.doctype, doc.name);
          toast((spec.title||"Record")+" created · "+doc.name, "ok");
          close();
          if(spec.afterCreate) spec.afterCreate(doc); else setTimeout(function(){ location.reload(); }, 650);
        }catch(e){ toast(e.message||"Could not save","err"); btn._busy=false; btn.textContent="Create"; btn.style.opacity=""; }
      });
    }catch(e){
      dr.querySelector(".db").innerHTML='<div class="nx-pulse">Could not load the form — sign in to the ERP first.</div>';
    }
  };

  // Per-doctype form specs, keyed by the /app/<route>/new route
  var FORMS = {
    "customer": { doctype:"Customer", title:"New customer", fields:[
      {key:"customer_name",label:"Customer name",type:"text",required:true,placeholder:"e.g. Al Noor Trading"},
      {key:"customer_type",label:"Type",type:"select",options:["Company","Individual"],default:"Company"},
      {key:"customer_group",label:"Group",type:"select",required:true,source:{doctype:"Customer Group",filters:[["is_group","=",0]]}},
      {key:"territory",label:"Territory",type:"select",required:true,source:{doctype:"Territory",filters:[["is_group","=",0]]}},
      {key:"email_id",label:"Email",type:"text"},
      {key:"mobile_no",label:"Mobile",type:"text"}
    ]},
    "supplier": { doctype:"Supplier", title:"New supplier", fields:[
      {key:"supplier_name",label:"Supplier name",type:"text",required:true,placeholder:"e.g. Gulf Components FZE"},
      {key:"supplier_type",label:"Type",type:"select",options:["Company","Individual"],default:"Company"},
      {key:"supplier_group",label:"Group",type:"select",required:true,source:{doctype:"Supplier Group",filters:[["is_group","=",0]]}},
      {key:"country",label:"Country",type:"select",default:"United Arab Emirates",source:{doctype:"Country"}}
    ]},
    "item": { doctype:"Item", title:"New item", fields:[
      {key:"item_name",label:"Item name",type:"text",required:true,placeholder:"e.g. USB-C Cable 1m"},
      {key:"item_group",label:"Group",type:"select",required:true,source:{doctype:"Item Group",filters:[["is_group","=",0]]}},
      {key:"stock_uom",label:"Unit",type:"select",required:true,default:"Nos",source:{doctype:"UOM"}},
      {key:"standard_rate",label:"Standard rate",type:"number"},
      {key:"description",label:"Description",type:"textarea"}
    ], transform:function(v){ return {item_code:v.item_name, item_name:v.item_name, item_group:v.item_group, stock_uom:v.stock_uom, standard_rate:+v.standard_rate||0, description:v.description, is_stock_item:1}; } },
    "sales-invoice": { doctype:"Sales Invoice", title:"New invoice", submittable:false, fields:[
      {key:"customer",label:"Customer",type:"select",required:true,source:{doctype:"Customer",label:"customer_name"}},
      {key:"posting_date",label:"Invoice date",type:"date"},
      {key:"due_date",label:"Due date",type:"date"},
      {key:"items",label:"Line items",type:"items",required:true}
    ], transform:function(v){ return {customer:v.customer, company:NX.company, posting_date:v.posting_date, due_date:v.due_date, items:v.items}; } },
    "quotation": { doctype:"Quotation", title:"New quotation", fields:[
      {key:"party_name",label:"Customer",type:"select",required:true,source:{doctype:"Customer",label:"customer_name"}},
      {key:"transaction_date",label:"Date",type:"date"},
      {key:"valid_till",label:"Valid till",type:"date"},
      {key:"items",label:"Line items",type:"items",required:true}
    ], transform:function(v){ return {quotation_to:"Customer", party_name:v.party_name, company:NX.company, transaction_date:v.transaction_date, valid_till:v.valid_till, items:v.items}; } },
    "purchase-invoice": { doctype:"Purchase Invoice", title:"New bill", fields:[
      {key:"supplier",label:"Supplier",type:"select",required:true,source:{doctype:"Supplier",label:"supplier_name"}},
      {key:"posting_date",label:"Bill date",type:"date"},
      {key:"due_date",label:"Due date",type:"date"},
      {key:"items",label:"Line items",type:"items",required:true}
    ], transform:function(v){ return {supplier:v.supplier, company:NX.company, posting_date:v.posting_date, due_date:v.due_date, items:v.items}; } }
  };
  function wireCreate(){
    document.addEventListener("click", function(e){
      var a = e.target.closest('a[href*="/app/"][href$="/new"]'); if(!a) return;
      var m = (a.getAttribute("href")||"").match(/\/app\/([^\/]+)\/new$/); if(!m) return;
      var spec = FORMS[m[1]]; if(!spec) return;
      e.preventDefault(); e.stopImmediatePropagation();
      NX.openForm(spec);
    }, true);
  }

  function injectFormCSS(){
    var css=""
    + ".nx-form .db{padding:14px 22px 20px;}"
    + ".nx-form .ff{margin-bottom:14px;}"
    + ".nx-form .ff label{display:block;font-size:12px;font-weight:700;color:#5a6578;margin-bottom:6px;}"
    + ".nx-form .ff label i{color:var(--blue,#2563EB);font-style:normal;}"
    + ".nx-form .ff input,.nx-form .ff select,.nx-form .ff textarea{width:100%;border:1px solid var(--line2,#e6eaf1);border-radius:10px;padding:10px 12px;font-size:13.5px;color:#101828;outline:none;background:#fff;transition:border-color .12s,box-shadow .12s;}"
    + ".nx-form .ff textarea{min-height:64px;resize:vertical;}"
    + ".nx-form .ff input:focus,.nx-form .ff select:focus,.nx-form .ff textarea:focus{border-color:var(--blue,#2563EB);box-shadow:0 0 0 3px rgba(37,99,235,.13);}"
    + ".nx-form .lg{border:1px solid var(--line2,#e6eaf1);border-radius:12px;padding:10px;background:#fbfcfe;}"
    + ".nx-form .lg-row{display:grid;grid-template-columns:1fr 64px 84px 86px 24px;gap:8px;align-items:center;margin-bottom:8px;}"
    + ".nx-form .lg-row select,.nx-form .lg-row input{border:1px solid var(--line2,#e6eaf1);border-radius:8px;padding:8px 9px;font-size:12.5px;outline:none;background:#fff;width:100%;}"
    + ".nx-form .lg-row .li-amt{font-size:12px;font-weight:700;color:#1d2a44;text-align:right;}"
    + ".nx-form .lg-row .li-x{border:none;background:#eef1f6;color:#8a94a6;border-radius:7px;width:24px;height:28px;cursor:pointer;font-size:15px;}"
    + ".nx-form .lg-add{border:1px dashed var(--line2,#cfd6e4);background:#fff;color:var(--blue,#2563EB);border-radius:8px;padding:8px;width:100%;font-size:12.5px;font-weight:700;cursor:pointer;margin-top:2px;}"
    + ".nx-form .lg-tot{text-align:right;margin-top:10px;font-size:13px;color:#5a6578;}"
    + ".nx-form .lg-tot b{color:#0f1b33;font-size:16px;font-weight:800;margin-left:8px;}"
    + ".nx-form .df a{cursor:pointer;}"
    + ".nx-toasts{position:fixed;right:18px;bottom:18px;z-index:120;display:flex;flex-direction:column;gap:10px;}"
    + ".nx-toast{display:flex;align-items:center;gap:10px;background:#0f1b33;color:#fff;border-radius:12px;padding:12px 16px;font-size:13px;font-weight:600;box-shadow:0 14px 40px rgba(16,24,40,.28);transform:translateY(14px);opacity:0;transition:transform .24s cubic-bezier(.4,0,.2,1),opacity .24s;max-width:360px;}"
    + ".nx-toast.show{transform:none;opacity:1;}"
    + ".nx-toast .ti{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;}"
    + ".nx-toast.ok .ti{background:rgba(22,163,74,.22);color:#4ade80;}"
    + ".nx-toast.err{background:#3a0f12;}.nx-toast.err .ti{background:rgba(239,68,68,.25);color:#fda4a4;}"
    + ".nx-toast.info .ti{background:rgba(37,99,235,.25);color:#93c5fd;}";
    var st=document.createElement("style"); st.textContent=css; document.head.appendChild(st);
  }

  // ---- Boot ---------------------------------------------------------------
  // ---- Auth gate: send guests to the branded login -----------------------
  function guardAuth(){
    var m = document.cookie.match(/(?:^|;\s*)user_id=([^;]+)/);
    var uid = m ? decodeURIComponent(m[1]) : "";
    if(!uid || uid === "Guest"){
      var here = location.pathname + location.search;
      location.replace("/neuvexa_login?redirect-to=" + encodeURIComponent(here));
      return false;
    }
    return true;
  }

  function boot(){
    if(!guardAuth()) return;
    injectCSS();
    injectFormCSS();
    injectDarkCSS();
    injectResponsiveCSS();
    applyTheme();
    applyDark();
    wireDarkMode();
    wireResponsive();
    buildSwitcher();
    wirePalette();
    wireDrawers();
    wireCreate();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
