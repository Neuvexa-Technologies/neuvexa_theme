/* Neuvexa ERP — shared front-end app layer (loaded on every NAT page)
   Provides: white-label theming, working company switcher, Cmd/Ctrl-K command
   palette, and slide-in record drawers (hijacks existing row clicks).
   One file, included via <script src="/assets/neuvexa_theme/js/neuvexa_app.js">. */
(function(){
  "use strict";
  if (window.NX) return;

  // ---- White-label config -------------------------------------------------
  // Change these per client to re-brand the whole product in one place.
  var CONFIG = {
    brand:   "Neuvexa ERP",
    tagline: "by Neuvexa",
    accent:  "#2563EB",            // primary colour (--blue)
    accentInk: "#1e40af",
    defaultCompany: "Gulf Mobile & Accessories LLC"
  };

  var LS_COMPANY = "nx_company";
  function company(){ try { return localStorage.getItem(LS_COMPANY) || CONFIG.defaultCompany; } catch(e){ return CONFIG.defaultCompany; } }
  function setCompany(c){ try { localStorage.setItem(LS_COMPANY, c); } catch(e){} }

  var AED = function(n){ return "AED " + (Math.round(n)).toLocaleString("en-US"); };
  function esc(s){ return (s==null?"":(""+s)).replace(/[&<>"]/g, function(c){ return ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;" })[c]; }); }
  async function api(path){ var r = await fetch(path, {credentials:"include"}); if(!r.ok) throw new Error(path+" -> "+r.status); return r.json(); }

  window.NX = { config: CONFIG, get company(){ return company(); }, setCompany: setCompany };

  // ---- Theming ------------------------------------------------------------
  function applyTheme(){
    var root = document.documentElement;
    if (CONFIG.accent)    root.style.setProperty("--blue", CONFIG.accent);
    if (CONFIG.accentInk) root.style.setProperty("--blue-ink", CONFIG.accentInk);
    var b = document.querySelector(".brand .txt b"); if (b && CONFIG.brand) b.textContent = CONFIG.brand;
    var s = document.querySelector(".brand .txt span"); if (s && CONFIG.tagline) s.textContent = CONFIG.tagline;
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

  // ---- Boot ---------------------------------------------------------------
  function boot(){
    injectCSS();
    applyTheme();
    buildSwitcher();
    wirePalette();
    wireDrawers();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
