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
  var ACT_PLUS = '<path d="M12 5v14M5 12h14"/>';
  var ACT_SPARK = '<path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15l-1.9-4.1L5.5 9l4.6-1.4z"/>';
  var ACT_MOON = '<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/>';
  var ACT_ARROW = '<path d="M5 12h14M13 6l6 6-6 6"/>';
  function ACTIONS(){ return [
    { group:"Actions", title:"New invoice", sub:"Create a sales invoice", tint:"#6d5ef5", icon:ACT_PLUS, run:function(){ NX.newDoc("sales-invoice"); } },
    { group:"Actions", title:"New customer", sub:"Add a customer", tint:"#2563EB", icon:ACT_PLUS, run:function(){ NX.newDoc("customer"); } },
    { group:"Actions", title:"New item", sub:"Add a stock item", tint:"#16a34a", icon:ACT_PLUS, run:function(){ NX.newDoc("item"); } },
    { group:"Actions", title:"Ask Neuvexa", sub:"AI answers from your data", tint:"#6d5ef5", icon:ACT_SPARK, run:function(){ NX.openCopilot(); } },
    { group:"Actions", title:"Toggle dark mode", sub:"Switch light / dark", tint:"#e9a23b", icon:ACT_MOON, run:function(){ NX.toggleDark(); } },
    { group:"Go to", title:"Dashboard", sub:"/neuvexa", tint:"#2563EB", icon:ACT_ARROW, nav:"/neuvexa" },
    { group:"Go to", title:"Invoices", sub:"/invoices", tint:"#2563EB", icon:ACT_ARROW, nav:"/invoices" },
    { group:"Go to", title:"Customers", sub:"/customers", tint:"#2563EB", icon:ACT_ARROW, nav:"/customers" },
    { group:"Go to", title:"Items & Stock", sub:"/items", tint:"#2563EB", icon:ACT_ARROW, nav:"/items" },
    { group:"Go to", title:"Reports", sub:"/reports", tint:"#2563EB", icon:ACT_ARROW, nav:"/reports" }
  ]; }
  function paletteBuild(){
    var mask = document.createElement("div"); mask.className = "nx-mask";
    var pal = document.createElement("div"); pal.className = "nx-pal";
    pal.innerHTML = '<div class="hd"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>'
      + '<input id="nxq" placeholder="Search or type a command…" autocomplete="off"><span class="esc">esc</span></div>'
      + '<div class="bd" id="nxbd"></div>';
    document.body.appendChild(mask); document.body.appendChild(pal);
    var inp = pal.querySelector("#nxq"), bd = pal.querySelector("#nxbd");
    var results = [], sel = 0, t = null, open = true;
    function close(){ open=false; mask.classList.remove("show"); pal.remove(); mask.remove(); }
    function go(r){
      if(r.run){ close(); r.run(); return; }
      if(r.nav){ close(); location.href = r.nav; return; }
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
      if(!q){ results = ACTIONS(); sel=0; render(); return; }
      var out = [], ql = q.toLowerCase();
      ACTIONS().forEach(function(a){ if(a.title.toLowerCase().indexOf(ql)>=0 || (a.sub||"").toLowerCase().indexOf(ql)>=0) out.push(a); });
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
    search("");
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
  NX.newDoc = function(route){ var spec = FORMS[route]; if(spec) NX.openForm(spec); else location.href = "/app/"+route+"/new"; };
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

  // ---- Extra polish CSS (copilot, shortcuts, count-up, hover) -------------
  function injectAiCSS(){
    var css = ""
    // hover micro-interactions
    + ".kpi{transition:transform .16s cubic-bezier(.4,0,.2,1),box-shadow .16s;}"
    + ".kpi:hover{transform:translateY(-3px);box-shadow:0 12px 30px rgba(16,24,40,.12);}"
    + "html.nx-dark .kpi:hover{box-shadow:0 12px 34px rgba(0,0,0,.5),0 0 0 1px rgba(37,99,235,.14);}"
    + "tbody tr{transition:background .12s;}"
    + ".btn,.ask,.bell,.nx-darktoggle{transition:transform .08s,filter .15s,background .15s;}"
    + ".btn:hover,.ask:hover,.bell:hover,.nx-darktoggle:hover{filter:brightness(1.04);}"
    + ".btn.primary:active,.ask:active{transform:translateY(1px);}"
    // copilot panel
    + ".nx-cop{position:fixed;top:0;right:0;height:100%;width:430px;max-width:94vw;z-index:85;background:#fff;box-shadow:-18px 0 50px rgba(16,24,40,.18);transform:translateX(100%);transition:transform .24s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;}"
    + ".nx-cop.show{transform:none;}"
    + "html.nx-dark .nx-cop{background:#111728;color:var(--ink);}"
    + ".nx-cop .ch{display:flex;align-items:center;gap:11px;padding:18px 20px;border-bottom:1px solid var(--line,#edf0f5);}"
    + ".nx-cop .ch .spark{width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,var(--blue,#2563EB),var(--accent2,#6d5ef5));display:flex;align-items:center;justify-content:center;flex-shrink:0;}"
    + ".nx-cop .ch .spark svg{width:17px;height:17px;stroke:#fff;}"
    + ".nx-cop .ch b{font-size:15px;font-weight:800;color:var(--navy,#0f1b33);display:block;}html.nx-dark .nx-cop .ch b{color:var(--ink);}"
    + ".nx-cop .ch span{font-size:11px;color:var(--muted,#8a94a6);}"
    + ".nx-cop .ch .x{margin-left:auto;width:30px;height:30px;border-radius:8px;border:1px solid var(--line2,#e6eaf1);background:#fff;cursor:pointer;color:#5a6578;font-size:16px;display:flex;align-items:center;justify-content:center;}html.nx-dark .nx-cop .ch .x{background:#0d1324;border-color:var(--line2);}"
    + ".nx-cop .body{flex:1;overflow:auto;padding:16px 18px;display:flex;flex-direction:column;gap:12px;}"
    + ".nx-cop .bub{max-width:90%;padding:11px 14px;border-radius:14px;font-size:13.5px;line-height:1.5;}"
    + ".nx-cop .bub.me{align-self:flex-end;background:var(--blue,#2563EB);color:#fff;border-bottom-right-radius:5px;}"
    + ".nx-cop .bub.ai{align-self:flex-start;background:var(--blue-soft,#eaf0fe);color:#1d2a44;border-bottom-left-radius:5px;}html.nx-dark .nx-cop .bub.ai{background:#1a2440;color:var(--ink2);}"
    + ".nx-cop .bub.ai .big{font-size:22px;font-weight:800;color:var(--navy,#0f1b33);display:block;margin:2px 0 2px;}html.nx-dark .nx-cop .bub.ai .big{color:#fff;}"
    + ".nx-cop .bub.ai .rw{display:flex;justify-content:space-between;gap:12px;padding:4px 0;border-top:1px solid rgba(0,0,0,.06);font-size:12.5px;}"
    + ".nx-cop .bub.ai .rw:first-of-type{border-top:none;}"
    + ".nx-cop .bub.ai .rw b{font-weight:700;}"
    + ".nx-cop .chips{display:flex;flex-wrap:wrap;gap:8px;padding:2px 2px 0;}"
    + ".nx-cop .chip{border:1px solid var(--line2,#e6eaf1);background:#fff;border-radius:999px;padding:7px 12px;font-size:12px;font-weight:600;color:var(--blue-ink,#1e40af);cursor:pointer;}html.nx-dark .nx-cop .chip{background:#0d1324;border-color:var(--line2);color:#9ec2ff;}"
    + ".nx-cop .chip:hover{background:var(--blue-soft,#eaf0fe);}html.nx-dark .nx-cop .chip:hover{background:#17213c;}"
    + ".nx-cop .foot{padding:12px 16px;border-top:1px solid var(--line,#edf0f5);display:flex;gap:9px;}"
    + ".nx-cop .foot input{flex:1;border:1px solid var(--line2,#e6eaf1);border-radius:11px;padding:11px 13px;font-size:13.5px;outline:none;background:#fff;color:#101828;}html.nx-dark .nx-cop .foot input{background:#0d1324;border-color:var(--line2);color:var(--ink);}"
    + ".nx-cop .foot button{border:none;border-radius:11px;width:44px;background:var(--blue,#2563EB);color:#fff;cursor:pointer;font-size:16px;}"
    + ".nx-cop .think{align-self:flex-start;color:var(--muted,#8a94a6);font-size:13px;padding:4px 2px;}"
    // shortcuts overlay
    + ".nx-keys-mask{position:fixed;inset:0;background:rgba(10,14,26,.5);z-index:95;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .15s;}"
    + ".nx-keys-mask.show{opacity:1;}"
    + ".nx-keys{background:#fff;border-radius:16px;padding:22px 24px;width:380px;max-width:92vw;box-shadow:0 24px 70px rgba(16,24,40,.3);}html.nx-dark .nx-keys{background:#141b2e;color:var(--ink);}"
    + ".nx-keys h3{font-size:16px;font-weight:800;color:var(--navy,#0f1b33);margin-bottom:14px;}html.nx-dark .nx-keys h3{color:#fff;}"
    + ".nx-keys .kr{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--line,#edf0f5);font-size:13.5px;color:#1d2a44;}html.nx-dark .nx-keys .kr{color:var(--ink2);border-color:#232c44;}"
    + ".nx-keys .kr:last-child{border-bottom:none;}"
    + ".nx-keys kbd{background:var(--bg,#f7f8fb);border:1px solid var(--line2,#e6eaf1);border-radius:6px;padding:2px 8px;font-size:12px;font-weight:700;color:#5a6578;}html.nx-dark .nx-keys kbd{background:#0d1324;border-color:#2a3550;color:#aab6cc;}"
    // collapsible sidebar (icon rail)
    + ".sidebar{transition:width .2s cubic-bezier(.4,0,.2,1);}"
    + "@media(min-width:761px){"
    + "  html.nx-collapsed .sidebar{width:72px;}"
    + "  html.nx-collapsed .sidebar .brand .txt,html.nx-collapsed .sidebar .side-foot span{display:none;}"
    + "  html.nx-collapsed .sidebar .nav .group{font-size:0;height:6px;}"
    + "  html.nx-collapsed .sidebar .nav a{font-size:0;gap:0;justify-content:center;padding-left:0;padding-right:0;}"
    + "  html.nx-collapsed .sidebar .nav a svg{width:19px;height:19px;}"
    + "  html.nx-collapsed .sidebar .brand{justify-content:center;padding:18px 0 16px;}"
    + "  html.nx-collapsed .sidebar .side-foot{justify-content:center;}"
    + "}"
    // page-load entrance animation
    + "@keyframes nxUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}"
    + ".nx-anim .kpis .kpi{animation:nxUp .44s both;}"
    + ".nx-anim .kpis .kpi:nth-child(2){animation-delay:.05s;}"
    + ".nx-anim .kpis .kpi:nth-child(3){animation-delay:.1s;}"
    + ".nx-anim .kpis .kpi:nth-child(4){animation-delay:.15s;}"
    + ".nx-anim .panel{animation:nxUp .5s .12s both;}"
    // skeleton shimmer
    + ".nx-skrow td{padding:14px 18px;border-bottom:1px solid var(--line,#edf0f5);}"
    + ".nx-sk{height:12px;border-radius:6px;background:linear-gradient(90deg,#eef1f6 25%,#e3e8f0 37%,#eef1f6 63%);background-size:400% 100%;animation:nxsh 1.3s ease infinite;}"
    + "@keyframes nxsh{0%{background-position:100% 0;}100%{background-position:0 0;}}"
    + "html.nx-dark .nx-sk{background:linear-gradient(90deg,#1a2238 25%,#243049 37%,#1a2238 63%);background-size:400% 100%;}"
    // notification bell dropdown
    + ".nx-bell-menu{position:absolute;z-index:70;background:#fff;border:1px solid var(--line2,#e6eaf1);border-radius:14px;box-shadow:0 16px 44px rgba(16,24,40,.18);width:330px;max-width:92vw;overflow:hidden;}"
    + "html.nx-dark .nx-bell-menu{background:#111728;border-color:var(--line2);color:var(--ink);}"
    + ".nx-bell-menu .bh{padding:13px 16px;border-bottom:1px solid var(--line,#edf0f5);font-size:13px;font-weight:800;color:var(--navy,#0f1b33);display:flex;justify-content:space-between;align-items:center;}html.nx-dark .nx-bell-menu .bh{color:#fff;}"
    + ".nx-bell-menu .bh span{font-size:11px;font-weight:600;color:var(--muted,#8a94a6);}"
    + ".nx-bell-menu .bi{display:flex;align-items:center;gap:11px;padding:11px 16px;cursor:pointer;border-bottom:1px solid var(--line,#edf0f5);}"
    + ".nx-bell-menu .bi:last-child{border-bottom:none;}"
    + ".nx-bell-menu .bi:hover{background:var(--blue-soft,#eaf0fe);}html.nx-dark .nx-bell-menu .bi:hover{background:#17213c;}"
    + ".nx-bell-menu .bi .ic{width:30px;height:30px;border-radius:8px;background:var(--blue-soft,#eaf0fe);display:flex;align-items:center;justify-content:center;flex-shrink:0;}html.nx-dark .nx-bell-menu .bi .ic{background:#1a2440;}"
    + ".nx-bell-menu .bi .ic svg{width:15px;height:15px;stroke:var(--blue,#2563EB);}"
    + ".nx-bell-menu .bi b{font-size:13px;font-weight:700;color:#1d2a44;display:block;}html.nx-dark .nx-bell-menu .bi b{color:var(--ink);}"
    + ".nx-bell-menu .bi span{font-size:11.5px;color:var(--muted,#8a94a6);}"
    + ".nx-bell-menu .bi .amt{margin-left:auto;font-size:12.5px;font-weight:800;color:#0f1b33;}html.nx-dark .nx-bell-menu .bi .amt{color:#fff;}"
    + ".nx-bell-menu .be{padding:22px 16px;text-align:center;color:var(--muted,#8a94a6);font-size:13px;}";
    var st=document.createElement("style"); st.textContent=css; document.head.appendChild(st);
  }

  // ---- Skeleton loaders ---------------------------------------------------
  function wireSkeleton(){
    document.querySelectorAll("tbody").forEach(function(tb){
      var e = tb.querySelector("td.empty");
      if(e && /load/i.test(e.textContent)){
        var tbl = tb.closest("table");
        var cols = tbl ? tbl.querySelectorAll("thead th").length : 0; if(!cols) cols = 5;
        var row = '<tr class="nx-skrow">';
        for(var i=0;i<cols;i++){ row += '<td><div class="nx-sk" style="width:'+(i===0?70:(40+((i*17)%45)))+'%"></div></td>'; }
        row += '</tr>';
        var html=""; for(var r=0;r<6;r++){ html += row; }
        tb.innerHTML = html;
      }
    });
  }

  // ---- Notification bell (recent activity) --------------------------------
  function wireBell(){
    var bell = document.querySelector(".topbar .bell"); if(!bell) return;
    bell.style.cursor = "pointer";
    var menu = null;
    function close(){ if(menu){ menu.remove(); menu=null; } }
    bell.addEventListener("click", async function(e){
      e.stopPropagation();
      if(menu){ close(); return; }
      menu = document.createElement("div"); menu.className = "nx-bell-menu";
      menu.innerHTML = '<div class="bh">Recent activity <span>live</span></div><div class="be">Loading…</div>';
      document.body.appendChild(menu);
      var r = bell.getBoundingClientRect();
      menu.style.top = (r.bottom + 8) + "px"; menu.style.right = (window.innerWidth - r.right) + "px";
      var invIcon = '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/>';
      try{
        var p = new URLSearchParams();
        p.set("fields", JSON.stringify(["name","customer","grand_total","status","posting_date"]));
        p.set("filters", JSON.stringify([["company","=",company()]]));
        p.set("order_by","creation desc"); p.set("limit_page_length","6");
        var rows = ((await api("/api/resource/Sales Invoice?"+p)).data)||[];
        if(!rows.length){ menu.querySelector(".be").textContent = "No recent activity."; return; }
        menu.innerHTML = '<div class="bh">Recent activity <span>latest invoices</span></div>' + rows.map(function(d){
          return '<div class="bi" data-n="'+esc(d.name)+'"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke-width="2">'+invIcon+'</svg></div>'
            + '<div><b>'+esc(d.customer||d.name)+'</b><span>'+esc(d.name)+(d.status?' · '+esc(d.status):'')+'</span></div>'
            + '<span class="amt">'+AED(d.grand_total||0)+'</span></div>';
        }).join("");
        menu.addEventListener("click", function(ev){
          var bi = ev.target.closest(".bi"); if(!bi) return;
          close(); NX.openDrawer("Sales Invoice", bi.getAttribute("data-n"));
        });
      }catch(err){ menu.querySelector(".be").textContent = "Couldn’t load activity."; }
    });
    document.addEventListener("click", close);
  }

  // ---- Collapsible sidebar ------------------------------------------------
  function applyCollapse(){ try { document.documentElement.classList.toggle("nx-collapsed", localStorage.getItem("nx_collapsed")==="1"); } catch(e){} }
  function wireCollapse(){
    applyCollapse();
    var f = document.querySelector(".side-foot"); if(!f) return;
    f.style.cursor = "pointer";
    f.addEventListener("click", function(){
      var on = document.documentElement.classList.toggle("nx-collapsed");
      try { localStorage.setItem("nx_collapsed", on?"1":"0"); } catch(e){}
    });
  }

  // ---- Count-up animation for KPI numbers ---------------------------------
  function wireCountUp(){
    function parse(t){ var m=(t||"").replace(/,/g,"").match(/-?\d[\d.]*/); return m?parseFloat(m[0]):null; }
    function animate(el){
      if(el._nxAnim) return;
      var raw=el.textContent, target=parse(raw); if(target===null) return;
      if(el._nxLast===raw) return; el._nxLast=raw;
      var prefix=raw.slice(0, raw.search(/-?\d/)); var hasComma=/,/.test(raw) || target>=1000;
      el._nxAnim=true; var dur=680, start=performance.now();
      function step(now){ var p=Math.min(1,(now-start)/dur); var v=Math.round(target*(1-Math.pow(1-p,3)));
        el.textContent=prefix+(hasComma?v.toLocaleString("en-US"):v);
        if(p<1) requestAnimationFrame(step); else { el.textContent=raw; el._nxAnim=false; } }
      requestAnimationFrame(step);
    }
    document.querySelectorAll(".kpi .val").forEach(function(el){
      try { new MutationObserver(function(){ animate(el); }).observe(el,{childList:true,characterData:true,subtree:true}); } catch(e){}
      animate(el);
    });
  }

  // ---- Keyboard shortcuts overlay (press ?) -------------------------------
  function openKeys(){
    if(document.querySelector(".nx-keys-mask")) return;
    var mask=document.createElement("div"); mask.className="nx-keys-mask";
    mask.innerHTML='<div class="nx-keys"><h3>Keyboard shortcuts</h3>'
      +'<div class="kr"><span>Search anything</span><kbd>⌘ K</kbd></div>'
      +'<div class="kr"><span>Ask Neuvexa (AI)</span><kbd>⌘ J</kbd></div>'
      +'<div class="kr"><span>New invoice</span><kbd>N</kbd></div>'
      +'<div class="kr"><span>Toggle dark mode</span><kbd>⌘ ⇧ D</kbd></div>'
      +'<div class="kr"><span>Open a record</span><kbd>Click a row</kbd></div>'
      +'<div class="kr"><span>This panel</span><kbd>?</kbd></div>'
      +'<div class="kr"><span>Close</span><kbd>Esc</kbd></div></div>';
    document.body.appendChild(mask);
    function close(){ mask.classList.remove("show"); setTimeout(function(){ mask.remove(); }, 160); }
    mask.addEventListener("click", function(e){ if(e.target===mask) close(); });
    document.addEventListener("keydown", function k(e){ if(e.key==="Escape"){ close(); document.removeEventListener("keydown",k); } });
    requestAnimationFrame(function(){ mask.classList.add("show"); });
  }

  // ---- Ask Neuvexa copilot (answers from live ERP data) -------------------
  function todayStr(){ var d=new Date(); return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2); }
  function monthStart(){ var d=new Date(); return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-01"; }
  async function rows(dt, fields, filters, extra){
    var p=new URLSearchParams(); p.set("fields", JSON.stringify(fields));
    if(filters) p.set("filters", JSON.stringify(filters));
    p.set("limit_page_length", (extra&&extra.limit)||"0");
    if(extra&&extra.order) p.set("order_by", extra.order);
    return ((await api("/api/resource/"+encodeURIComponent(dt)+"?"+p)).data)||[];
  }
  async function runQuery(q){
    var s=q.toLowerCase(), co=company();
    var money = function(n){ return AED(n||0); };
    // revenue this month
    if(/revenu|sales|turnover|income/.test(s)){
      var r=await rows("Sales Invoice",["grand_total"],[["company","=",co],["docstatus","=",1],["posting_date",">=",monthStart()]]);
      var t=r.reduce(function(a,x){return a+(x.grand_total||0);},0);
      return {title:"Revenue this month", big:money(t), note:r.length+" invoice"+(r.length===1?"":"s")+" since "+monthStart()+"."};
    }
    // receivables / outstanding
    if(/receivable|outstanding|owed to me|who owes|unpaid|owing/.test(s) && !/supplier|pay|bill/.test(s)){
      var r=await rows("Sales Invoice",["customer","outstanding_amount","due_date","name"],[["company","=",co],["docstatus","=",1],["outstanding_amount",">",0]],{order:"outstanding_amount desc"});
      var t=r.reduce(function(a,x){return a+(x.outstanding_amount||0);},0);
      var top=r.slice(0,5).map(function(x){return {a:x.customer, b:money(x.outstanding_amount)};});
      return {title:"Total receivables", big:money(t), rows:top, note:r.length+" open invoice"+(r.length===1?"":"s")+"."};
    }
    // overdue
    if(/overdue|late|past due/.test(s)){
      var r=await rows("Sales Invoice",["customer","outstanding_amount","due_date","name"],[["company","=",co],["docstatus","=",1],["outstanding_amount",">",0],["due_date","<",todayStr()]],{order:"due_date asc"});
      var t=r.reduce(function(a,x){return a+(x.outstanding_amount||0);},0);
      var top=r.slice(0,6).map(function(x){return {a:x.customer+" · "+x.name, b:money(x.outstanding_amount)};});
      return {title:"Overdue", big:money(t)+" across "+r.length, rows:top, note:r.length?"Oldest first.":"Nothing overdue — nice."};
    }
    // payables / bills
    if(/payable|bills? (due|to pay)|owe (supplier|to)|supplier.*owe|accounts payable/.test(s) || (/payable|owe/.test(s)&&/supplier|bill/.test(s))){
      var r=await rows("Purchase Invoice",["supplier","outstanding_amount"],[["company","=",co],["docstatus","=",1],["outstanding_amount",">",0]],{order:"outstanding_amount desc"});
      var t=r.reduce(function(a,x){return a+(x.outstanding_amount||0);},0);
      var top=r.slice(0,5).map(function(x){return {a:x.supplier, b:money(x.outstanding_amount)};});
      return {title:"Total payables", big:money(t), rows:top, note:r.length+" bill"+(r.length===1?"":"s")+" to pay."};
    }
    // top customers
    if(/top customer|best customer|biggest customer|who buys/.test(s)){
      var r=await rows("Sales Invoice",["customer","grand_total"],[["company","=",co],["docstatus","=",1]]);
      var m={}; r.forEach(function(x){ m[x.customer]=(m[x.customer]||0)+(x.grand_total||0); });
      var arr=Object.keys(m).map(function(k){return {a:k,b:money(m[k]),v:m[k]};}).sort(function(a,b){return b.v-a.v;}).slice(0,6);
      return {title:"Top customers by revenue", rows:arr, note:"All submitted invoices."};
    }
    // low stock
    if(/low stock|out of stock|running (low|out)|reorder|stock level/.test(s)){
      var whs=(await rows("Warehouse",["name"],[["company","=",co]])).map(function(w){return w.name;});
      var set={}; whs.forEach(function(w){set[w]=1;});
      var bins=await rows("Bin",["item_code","warehouse","actual_qty"],null);
      var q={}; bins.forEach(function(b){ if(set[b.warehouse]) q[b.item_code]=(q[b.item_code]||0)+(b.actual_qty||0); });
      var low=Object.keys(q).filter(function(k){return q[k]<=5;}).sort(function(a,b){return q[a]-q[b];}).slice(0,8)
        .map(function(k){return {a:k, b:Math.round(q[k])+" left"};});
      return {title:"Low / out of stock (≤5)", big:low.length+" item"+(low.length===1?"":"s"), rows:low, note:low.length?"Lowest first.":"Healthy stock levels."};
    }
    // counts
    if(/how many|number of|count of|total (customer|client|item|product|invoice|supplier)/.test(s)){
      if(/customer|client/.test(s)){ var r=await rows("Customer",["name"]); return {title:"Customers", big:""+r.length}; }
      if(/item|product|sku/.test(s)){ var r=await rows("Item",["name"],[["is_stock_item","=",1]]); return {title:"Stock items", big:""+r.length}; }
      if(/supplier|vendor/.test(s)){ var r=await rows("Supplier",["name"]); return {title:"Suppliers", big:""+r.length}; }
      if(/invoice/.test(s)){ var r=await rows("Sales Invoice",["name"],[["company","=",co]]); return {title:"Invoices", big:""+r.length}; }
    }
    // find / search fallback
    var term=q.replace(/^(find|search|show me|look up|lookup|where is|who is)\s+/i,"").trim();
    if(term && term.length>=2){
      var hits=[];
      try{ (await rows("Customer",["name","customer_name"],[["customer_name","like","%"+term+"%"]],{limit:"4"})).forEach(function(c){ hits.push({a:c.customer_name||c.name, b:"Customer"}); }); }catch(e){}
      try{ (await rows("Item",["name","item_name"],[["item_name","like","%"+term+"%"]],{limit:"4"})).forEach(function(c){ hits.push({a:c.item_name||c.name, b:"Item"}); }); }catch(e){}
      if(hits.length) return {title:"Matches for “"+term+"”", rows:hits};
    }
    return {title:null, note:"I can answer things like: revenue this month, who's overdue, top customers, payables, low stock, or how many customers. Try one of the chips below."};
  }
  function renderAnswer(a){
    var h="";
    if(a.title) h+='<b style="display:block;margin-bottom:2px;">'+esc(a.title)+'</b>';
    if(a.big) h+='<span class="big">'+esc(a.big)+'</span>';
    if(a.rows&&a.rows.length) h+=a.rows.map(function(r){return '<div class="rw"><span>'+esc(r.a)+'</span><b>'+esc(r.b)+'</b></div>';}).join("");
    if(a.note) h+='<div style="margin-top:6px;color:#8a94a6;font-size:12px;">'+esc(a.note)+'</div>';
    return h;
  }
  function openCopilot(){
    if(document.querySelector(".nx-cop")){ document.querySelector(".nx-cop .foot input").focus(); return; }
    var p=document.createElement("div"); p.className="nx-cop";
    p.innerHTML='<div class="ch"><div class="spark"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15l-1.9-4.1L5.5 9l4.6-1.4z"/></svg></div>'
      +'<div><b>Ask Neuvexa</b><span>Answers from your live data</span></div><div class="x">&times;</div></div>'
      +'<div class="body" id="nxcbody"><div class="bub ai">Hi! Ask me about your business — revenue, who’s overdue, top customers, stock, and more.</div>'
      +'<div class="chips">'
      +'<div class="chip">Revenue this month</div><div class="chip">Who’s overdue?</div>'
      +'<div class="chip">Top customers</div><div class="chip">Low stock</div><div class="chip">Total payables</div></div></div>'
      +'<div class="foot"><input id="nxcq" placeholder="Ask anything…" autocomplete="off"><button id="nxcsend">&#10148;</button></div>';
    document.body.appendChild(p);
    var body=p.querySelector("#nxcbody"), inp=p.querySelector("#nxcq");
    function close(){ p.classList.remove("show"); setTimeout(function(){ p.remove(); }, 240); }
    p.querySelector(".x").addEventListener("click", close);
    async function ask(q){
      if(!q) return;
      body.insertAdjacentHTML("beforeend",'<div class="bub me">'+esc(q)+'</div>');
      var t=document.createElement("div"); t.className="think"; t.textContent="Neuvexa is looking…"; body.appendChild(t); body.scrollTop=body.scrollHeight;
      var ans; try{ ans=await runQuery(q); }catch(e){ ans={title:null,note:"I couldn’t reach the data just now — try again."}; }
      t.remove();
      body.insertAdjacentHTML("beforeend",'<div class="bub ai">'+renderAnswer(ans)+'</div>');
      body.scrollTop=body.scrollHeight;
    }
    p.addEventListener("click", function(e){ var c=e.target.closest(".chip"); if(c){ inp.value=""; ask(c.textContent); } });
    p.querySelector("#nxcsend").addEventListener("click", function(){ var q=inp.value.trim(); inp.value=""; ask(q); });
    inp.addEventListener("keydown", function(e){ if(e.key==="Enter"){ var q=inp.value.trim(); inp.value=""; ask(q); } });
    requestAnimationFrame(function(){ p.classList.add("show"); inp.focus(); });
  }
  NX.openCopilot = openCopilot;
  function wireCopilot(){
    document.querySelectorAll(".topbar .ask, .nav a[href='#']").forEach(function(el){
      if((el.textContent||"").toLowerCase().indexOf("ask")>=0 || el.classList.contains("ask")){
        el.style.cursor="pointer";
        el.addEventListener("click", function(e){ e.preventDefault(); openCopilot(); });
      }
    });
    document.addEventListener("keydown", function(e){
      var tag=(e.target.tagName||"").toLowerCase(), typing=(tag==="input"||tag==="textarea"||e.target.isContentEditable);
      if((e.metaKey||e.ctrlKey) && (e.key==="j"||e.key==="J")){ e.preventDefault(); openCopilot(); return; }
      if(typing) return;
      if(e.key==="?"){ e.preventDefault(); openKeys(); }
      else if(e.key==="n"||e.key==="N"){ var b=document.querySelector('a.btn.primary[href$="/new"]'); if(b){ e.preventDefault(); b.click(); } }
    });
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
    injectAiCSS();
    applyTheme();
    applyDark();
    wireDarkMode();
    wireResponsive();
    buildSwitcher();
    wirePalette();
    wireDrawers();
    wireCreate();
    wireCopilot();
    wireCollapse();
    wireSkeleton();
    wireBell();
    if(document.body) document.body.classList.add("nx-anim");
    setTimeout(wireCountUp, 300);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
