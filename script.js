// -------- helpers
const $ = (q, el=document) => el.querySelector(q);
const $$ = (q, el=document) => [...el.querySelectorAll(q)];

function toast(msg){
  const t = $("#toast");
  if(!t) return;
  t.textContent = msg;
  t.style.opacity = "1";
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(()=>{ t.style.opacity = "0"; }, 2400);
}

// -------- year
// Some pages may omit the footer
const yearEl = $("#year");
if(yearEl) yearEl.textContent = new Date().getFullYear();

// -------- scroll to top (reliable)
$$('[data-scroll-top], a[href="#top"]').forEach(a=>{
  a.addEventListener('click', (e)=>{
    e.preventDefault();
    window.scrollTo({top:0, behavior:'smooth'});
  });
});

// -------- mobile menu
const burger = $("#burger");
const mobile = $("#mobileMenu");
if(burger && mobile){
  burger.addEventListener("click", ()=>{
    mobile.classList.toggle("open");
    mobile.setAttribute("aria-hidden", mobile.classList.contains("open") ? "false" : "true");
  });
  $$(".mobile__link", mobile).forEach(a=>{
    a.addEventListener("click", ()=> mobile.classList.remove("open"));
  });
}

// -------- reveal on scroll
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.classList.add("reveal--in");
      io.unobserve(e.target);
    }
  });
},{threshold: 0.12});

$$(".reveal").forEach(el=> io.observe(el));

// -------- counters
function animateCount(el, to){
  const dur = 900;
  const start = performance.now();
  const from = 0;
  const fmt = (v) => {
    // 605 -> "605", 1200 -> "1 200"
    return Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };
  function tick(t){
    const p = Math.min(1, (t-start)/dur);
    const v = from + (to-from) * (1 - Math.pow(1-p, 3));
    el.textContent = fmt(v);
    if(p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const counterIO = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      const el = e.target;
      const to = Number(el.dataset.count || "0");
      animateCount(el, to);
      counterIO.unobserve(el);
    }
  });
},{threshold:0.4});

$$("[data-count]").forEach(el=> counterIO.observe(el));

// -------- fake feed data
const baseItems = [
  {id: 1, region:"uz", route:"Ташкент → Самарканд", meta:"10т · тент · сегодня", prio:true},
  {id: 2, region:"kz", route:"Алматы → Ташкент", meta:"20т · реф · завтра", prio:false},
  {id: 3, region:"ru", route:"Москва → Ташкент", meta:"5т · борт · 2 дня", prio:false},
  {id: 4, region:"uz", route:"Андижан → Ташкент", meta:"12т · тент · сегодня", prio:true},
];

let feedItems = [...baseItems];
let activeFilter = "all";

function renderFeed(){
  const feed = $("#feed");
  if(!feed) return;

  const filtered = feedItems.filter(x => activeFilter === "all" ? true : x.region === activeFilter);

  feed.innerHTML = "";
  filtered.slice(0, 6).forEach(x=>{
    const div = document.createElement("div");
    div.className = "item" + (x.isNew ? " item--new" : "");
    div.innerHTML = `
      <div class="item__top">
        <div class="item__route">${x.route}</div>
        <div class="item__meta">${x.meta}</div>
      </div>
      <div class="item__badges">
        <span class="badge">${x.region.toUpperCase()}</span>
        ${x.prio ? `<span class="badge badge--prio">PRIORITY</span>` : ""}
        ${x.isNew ? `<span class="badge badge--new">NEW</span>` : ""}
      </div>
    `;
    feed.appendChild(div);
  });
}

renderFeed();

// -------- filter chips
$$(".chip").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    $$(".chip").forEach(b=> b.classList.remove("chip--active"));
    btn.classList.add("chip--active");
    activeFilter = btn.dataset.filter || "all";
    renderFeed();
  });
});

// -------- add feed item
$("#addItem")?.addEventListener("click", ()=>{
  const variants = [
    {region:"uz", route:"Ташкент → Бухара", meta:"8т · тент · сегодня", prio: Math.random() > .55},
    {region:"kz", route:"Астана → Ташкент", meta:"20т · тент · завтра", prio: Math.random() > .55},
    {region:"ru", route:"Казань → Ташкент", meta:"10т · борт · 3 дня", prio: Math.random() > .55},
  ];
  const x = variants[rand(0, variants.length-1)];
  const item = { id: Date.now(), ...x, isNew:true };

  // Priority items float higher (simple)
  feedItems.unshift(item);
  feedItems = feedItems
    .sort((a,b)=> (b.prio?1:0) - (a.prio?1:0))
    .slice(0, 12);

  renderFeed();
  toast("Заявка добавлена в ленту (демо).");
});

$("#resetDemo")?.addEventListener("click", ()=>{
  feedItems = [...baseItems];
  activeFilter = "all";
  $$(".chip").forEach((b,i)=> b.classList.toggle("chip--active", i===0));
  renderFeed();
  toast("Демо сброшено.");
});

// -------- FAQ accordion
$$(".faq__q").forEach((q)=>{
  q.setAttribute("aria-expanded", "false");
  q.addEventListener("click", ()=>{
    const open = q.getAttribute("aria-expanded") === "true";
    // close all
    $$(".faq__q").forEach(x=>{
      x.setAttribute("aria-expanded","false");
      const a = x.nextElementSibling;
      if(a) a.style.display = "none";
    });
    // open this if it was closed
    if(!open){
      q.setAttribute("aria-expanded","true");
      const a = q.nextElementSibling;
      if(a) a.style.display = "block";
    }
  });
});

// -------- nav active highlight (simple)
const sections = ["about","features","demo","pricing","contacts"]
  .map(id => document.getElementById(id))
  .filter(Boolean);

const navLinks = $$(".nav__link");
const spy = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(!e.isIntersecting) return;
    const id = e.target.id;
    navLinks.forEach(a=>{
      const on = a.getAttribute("href") === "#" + id;
      a.style.color = on ? "rgba(255,255,255,.92)" : "rgba(255,255,255,.68)";
      a.style.background = on ? "rgba(255,255,255,.06)" : "transparent";
    });
  });
},{rootMargin:"-35% 0px -55% 0px", threshold: 0});

sections.forEach(s=> spy.observe(s));

// -------- fake form submit
$("#leadForm")?.addEventListener("submit", (e)=>{
  e.preventDefault();
  toast("Заявка отправлена (демо). Подключим сервер — и будет реальная отправка.");
  e.target.reset();
});

// -------- theme toggle (light-ish)
const themeToggle = $("#themeToggle");
function setTheme(mode){
  document.documentElement.dataset.theme = mode;
  localStorage.setItem("theme", mode);
  toast(mode === "light" ? "Светлее ✨" : "Темнее 🌙");
}
const saved = localStorage.getItem("theme");
if(saved) document.documentElement.dataset.theme = saved;

themeToggle?.addEventListener("click", ()=>{
  const cur = document.documentElement.dataset.theme || "dark";
  setTheme(cur === "dark" ? "light" : "dark");
});

// Light theme overrides (minimal)
const style = document.createElement("style");
style.textContent = `
  :root[data-theme="light"]{
    --bg:#f6fbff; --bg2:#eaf5ff;
    --card: rgba(0,20,40,.06);
    --card2: rgba(0,20,40,.08);
    --stroke: rgba(0,20,40,.10);
    --text: rgba(0,20,40,.92);
    --muted: rgba(0,20,40,.66);
    --shadow: 0 24px 80px rgba(0,20,40,.18);
  }
  :root[data-theme="light"] body{
    background: radial-gradient(1200px 900px at 20% 10%, rgba(42,168,255,.18), transparent 50%),
                radial-gradient(900px 700px at 80% 20%, rgba(99,209,255,.10), transparent 55%),
                linear-gradient(180deg, var(--bg), var(--bg2));
  }
`;
document.head.appendChild(style);

// -------- modal system (login/register + plan details)
const modal = $("#modal");
const modalTitle = $("#modalTitle");
const modalBody = $("#modalBody");

function openModal(title, html){
  if(!modal || !modalTitle || !modalBody) return;
  modalTitle.textContent = title;
  modalBody.innerHTML = html;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden","false");
  document.body.style.overflow = "hidden";

  const first = modalBody.querySelector('input, button, textarea, a');
  first?.focus?.();
}

function closeModal(){
  if(!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden","true");
  document.body.style.overflow = "";
}

document.addEventListener('click', (e)=>{
  const t = e.target;
  if(!(t instanceof HTMLElement)) return;
  if(t.hasAttribute('data-close-modal')) closeModal();
});
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape' && modal?.classList.contains('open')) closeModal();
});

const planHtml = {
  basic: `
    <div class="muted">Возможности тарифа <b>Basic</b></div>
    <ul class="list">
      <li>Лента заявок и откликов</li>
      <li>Фильтры по направлению / тоннажу / типу транспорта</li>
      <li>Поиск по ключевым полям</li>
      <li>1 место (1 пользователь в компании)</li>
      <li>Стандартная поддержка</li>
    </ul>
    <div class="modal__actions">
      <a class="btn btn--ghost" href="tariffs.html">Подробнее</a>
      <a class="btn btn--primary" href="#contacts" data-close-modal>Оставить заявку</a>
    </div>
  `,
  full: `
    <div class="muted">Возможности тарифа <b>Full</b></div>
    <ul class="list">
      <li><b>Basic + 3 места</b></li>
      <li>Приоритет откликов</li>
      <li>Авто-ответы на заявки/отклики</li>
      <li>Приоритетная поддержка</li>
      <li>Шаблоны откликов (настраиваемые)</li>
    </ul>
    <div class="modal__actions">
      <a class="btn btn--ghost" href="tariffs.html#full">Подробнее</a>
      <a class="btn btn--primary" href="#contacts" data-close-modal>Оставить заявку</a>
    </div>
  `
};


function leadHtml(){
  return `
    <label class="field">
      <span>Имя</span>
      <input type="text" placeholder="Ваше имя" required />
    </label>
    <label class="field">
      <span>Контакт</span>
      <input type="text" placeholder="Telegram или номер" required />
    </label>
    <label class="field">
      <span>Комментарий</span>
      <textarea placeholder="Basic / Full / Custom? Сколько мест? Какие направления?"></textarea>
    </label>
    <div class="modal__actions">
      <button class="btn btn--ghost" type="button" data-close-modal>Отмена</button>
      <button class="btn btn--primary" type="button" id="leadSubmit">Отправить</button>
    </div>
    <div class="muted" style="margin-top:10px;font-size:12px;">Мы свяжемся с вами в рабочее время</div>
  `;
}

function authHtml(mode){
  const isReg = mode === 'register';
  return `
    <div class="muted">${isReg ? 'Создай аккаунт и получи доступ к демо.' : 'Войди в аккаунт.'}</div>
    <label class="field">
      <span>Email</span>
      <input type="email" placeholder="you@example.com" required />
    </label>
    <label class="field">
      <span>Пароль</span>
      <input type="password" placeholder="••••••••" required />
    </label>
    ${isReg ? `
      <label class="field">
        <span>Компания</span>
        <input type="text" placeholder="Название компании" />
      </label>
    `: ''}
    <div class="modal__actions">
      <button class="btn btn--ghost" type="button" data-close-modal>Отмена</button>
      <button class="btn btn--primary" type="button" id="authSubmit">${isReg ? 'Зарегистрироваться' : 'Войти'}</button>
    </div>
    <div class="muted" style="margin-top:10px;font-size:12px;">Мы свяжемся с вами в рабочее время</div>
  `;
}

// -------- contacts modal
// TODO: замените значения на свои реальные контакты
const CONTACTS = {
  instagram: "https://instagram.com/your_instagram",
  telegram: "https://t.me/your_telegram",
  phone: "+998 (90) 068-22-30",
  tiktok: "https://www.tiktok.com/@your_tiktok",
  youtube: "https://www.youtube.com/@your_youtube",
  email: "rivee.logistic@gmail.com"
};


const DOWNLOAD_FILES = {
  basic: 'downloads/rivee_basic.zip',
  full: 'downloads/rivee_full.zip',
  custom: 'downloads/rivee_custom.zip'
};

function buildLicenseKey(plan){
  const prefix = { basic: 'RIV-BSC', full: 'RIV-FUL', custom: 'RIV-CST' }[plan] || 'RIV-KEY';
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${stamp}-${rand}`;
}

function downloadHtml(){
  return `
    <form id="downloadForm" class="download-form">
      <div class="muted">Выберите тариф, заполните форму и получите ключ вместе со скачиванием.</div>

      <div class="download-plans" role="radiogroup" aria-label="Выбор тарифа">
        <label class="download-plan">
          <input type="radio" name="plan" value="basic" checked>
          <span>
            <b>Basic</b>
            <small>$200 / месяц · 1 место</small>
          </span>
        </label>
        <label class="download-plan">
          <input type="radio" name="plan" value="full">
          <span>
            <b>Full</b>
            <small>$500 / месяц · 3 места</small>
          </span>
        </label>
        <label class="download-plan">
          <input type="radio" name="plan" value="custom">
          <span>
            <b>Custom</b>
            <small>Индивидуальная конфигурация</small>
          </span>
        </label>
      </div>

      <div class="lead-row" style="margin-top:14px;">
        <label class="field">
          <span>Компания</span>
          <input type="text" name="company" placeholder="Название компании" required />
        </label>
        <label class="field">
          <span>Контактное лицо</span>
          <input type="text" name="person" placeholder="Как к вам обращаться" required />
        </label>
      </div>

      <div class="lead-row">
        <label class="field">
          <span>Email</span>
          <input type="email" name="email" placeholder="company@mail.com" required />
        </label>
        <label class="field">
          <span>Телефон</span>
          <input type="tel" name="phone" placeholder="+998 (__) ___-__-__" required />
        </label>
      </div>

      <div class="modal__actions">
        <button class="btn btn--ghost" type="button" data-close-modal>Отмена</button>
        <button class="btn btn--primary" type="submit">Получить ключ и скачать</button>
      </div>

      <div class="muted" style="margin-top:10px;font-size:12px;">Ключ появится сразу после отправки формы, затем автоматически начнётся скачивание.</div>
      <div id="downloadResult" style="display:none;margin-top:14px;"></div>
    </form>
  `;
}

function contactsHtml(){
  const chips = [
    { label: "Instagram", href: CONTACTS.instagram },
    { label: "Telegram", href: CONTACTS.telegram },
    { label: "TikTok", href: CONTACTS.tiktok },
    { label: "YouTube", href: CONTACTS.youtube },
  ];
  return `
    <div class="muted">Свяжитесь с нами любым удобным способом</div>
    <div class="footer__social" style="margin-top:12px;">
      ${chips.map(c => `<a class="footer__chip" href="${c.href}" target="_blank" rel="noopener">${c.label}</a>`).join('')}
    </div>
    <div style="margin-top:14px; display:grid; gap:10px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;padding:10px 12px;border-radius:14px;border:1px solid rgba(255,255,255,.10);background: rgba(0,0,0,.12);color: rgba(255,255,255,.82);">
        <span>Телефон</span>
        <a href="tel:${String(CONTACTS.phone).replace(/\s+/g,'')}" style="color:rgba(214,241,255,.95); text-decoration:none; font-weight:800;">${CONTACTS.phone}</a>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;padding:10px 12px;border-radius:14px;border:1px solid rgba(255,255,255,.10);background: rgba(0,0,0,.12);color: rgba(255,255,255,.82);">
        <span>Почта</span>
        <a href="mailto:${CONTACTS.email}" style="color:rgba(214,241,255,.95); text-decoration:none; font-weight:800;">${CONTACTS.email}</a>
      </div>
    </div>
    <div class="modal__actions" style="margin-top:14px;">
      <button class="btn btn--primary" type="button" data-close-modal>Закрыть</button>
    </div>
  `;
}

$$('[data-open-modal]').forEach(btn=>{
  btn.addEventListener('click', (e)=>{
    e.preventDefault?.();
    const key = btn.getAttribute('data-open-modal');
    if(key === 'login') openModal('Вход', authHtml('login'));
    if(key === 'register') openModal('Регистрация', authHtml('register'));
    if(key === 'plan-basic') openModal('Basic — полный список', planHtml.basic);
    if(key === 'plan-full') openModal('Full — полный список', planHtml.full);
    if(key === 'lead') openModal('Запросить демо / оставить заявку', leadHtml());
    if(key === 'contacts') openModal('Контакты', contactsHtml());
    if(key === 'download') openModal('Скачать', downloadHtml());

    // close mobile menu if open
    const mobile = document.getElementById('mobileMenu');
    if(mobile && mobile.classList.contains('open')){
      mobile.classList.remove('open');
      mobile.setAttribute('aria-hidden','true');
    }
  });
});

document.addEventListener('click', (e)=>{
  const t = e.target;
  if(!(t instanceof HTMLElement)) return;
  if(t.id === 'authSubmit'){
    toast('Готово! (демо)');
    closeModal();
  }
});

document.addEventListener('submit', (e)=>{
  const form = e.target;
  if(!(form instanceof HTMLFormElement)) return;
  if(form.id !== 'downloadForm') return;
  e.preventDefault();

  const fd = new FormData(form);
  const plan = String(fd.get('plan') || 'basic');
  const key = buildLicenseKey(plan);
  const result = form.querySelector('#downloadResult');
  if(result){
    result.style.display = 'block';
    result.innerHTML = `
      <div style="padding:12px 14px;border-radius:16px;border:1px solid rgba(80,150,255,.28);background:rgba(0,20,40,.52);">
        <div style="font-size:12px;color:rgba(214,241,255,.72);margin-bottom:6px;">Ваш ключ активации</div>
        <div style="font-size:18px;font-weight:900;letter-spacing:.08em;color:#d6f1ff;word-break:break-word;">${key}</div>
      </div>
    `;
  }

  const href = DOWNLOAD_FILES[plan] || DOWNLOAD_FILES.basic;
  const a = document.createElement('a');
  a.href = href;
  a.download = '';
  document.body.appendChild(a);
  a.click();
  a.remove();
});



// -------- pricing calculator (tariffs)
const PRICES = { basic: 200, full: 500 };
const DISCOUNTS = { 1: 0, 3: 0.05, 6: 0.10, 12: 0.15 };

function money(v){
  // 12000 -> "12 000 $"
  const s = Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return s + " $";
}

function calcTotal(plan, months){
  const base = PRICES[plan];
  const d = DISCOUNTS[months] ?? 0;
  const raw = base * months;
  const total = raw * (1 - d);
  const save = raw - total;
  return { total, save, d, raw };
}

function setCalcOutputs(key, plan, months){
  if(plan === "custom"){
    return;
  }
  const r = calcTotal(plan, months);
  const totalEl = document.querySelector(`[data-total="${key}"]`);
  const saveEl  = document.querySelector(`[data-save="${key}"]`);
  const effEl   = document.querySelector(`[data-eff="${key}"]`);

  if(totalEl) totalEl.textContent = money(r.total);
  if(saveEl){
    saveEl.textContent = r.d > 0 ? `${money(r.save)} (${Math.round(r.d*100)}%)` : "0 $ (0%)";
  }
  if(effEl){
    effEl.textContent = money(r.total / months);
  }
}

function bindDurations(){
  document.querySelectorAll(".durations").forEach(group=>{
    const plan = group.getAttribute("data-plan");
    const keyMap = {
      basic: ["basic", "basic-detail"],
      full: ["full", "full-detail"],
      custom: ["custom"]
    };
    const keys = keyMap[plan] || [];
    const buttons = [...group.querySelectorAll(".chip")];

    function activate(months){
      buttons.forEach(b=> b.classList.toggle("chip--active", b.getAttribute("data-m") === String(months)));
      keys.forEach(k=> setCalcOutputs(k, plan, months));
    }

    buttons.forEach(b=>{
      b.addEventListener("click", ()=>{
        const m = Number(b.getAttribute("data-m") || "1");
        activate(m);
      });
    });

    // initial
    activate(1);
  });
}

bindDurations();


// -------- tariffs duration selector (tariffs.html)
(function initTariffsDuration(){
  const bar = document.getElementById("durationBar");
  if(!bar) return;

  const discountByMonths = {1:0, 3:0.05, 6:0.10, 12:0.15};

  function money(n){
    // integer dollars: 1200 -> "1 200"
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  function setDuration(months){
    // toggle buttons
    bar.querySelectorAll(".segbtn").forEach(b=>{
      b.classList.toggle("is-active", Number(b.dataset.duration) === months);
    });

    const cards = document.querySelectorAll(".pricecard[data-plan][data-base]");
    cards.forEach(card=>{
      const base = Number(card.dataset.base || "0");
      const disc = discountByMonths[months] ?? 0;

      const priceNum = card.querySelector("[data-plan-price]");
      const priceSub = card.querySelector("[data-plan-sub]");
      const note = card.querySelector("[data-plan-note]");

      if(!priceNum || !priceSub) return;

      // Show total for selected period (except 1 month: keep /мес)
      if(months === 1){
        priceNum.textContent = money(base);
        priceSub.textContent = "/мес";
        if(note) note.textContent = "";
        return;
      }

      const total = base * months * (1 - disc);
      priceNum.textContent = money(total);
      priceSub.textContent = `/${months} мес`;

      if(note){
        const saved = base * months - total;
        const pct = Math.round(disc * 100);
        note.textContent = saved > 0 ? `Скидка ${pct}% · экономия $${money(saved)}` : "";
      }
    });
  }

  // events
  bar.addEventListener("click", (e)=>{
    const btn = e.target.closest(".segbtn");
    if(!btn) return;
    setDuration(Number(btn.dataset.duration || "1"));
  });

  // default
  setDuration(1);
})();


document.addEventListener("DOMContentLoaded", () => {

  document.querySelectorAll('.js-lead-open').forEach(b=>{
    b.addEventListener('click',e=>{
      e.preventDefault();
      document.getElementById('leadModal').classList.add('is-open');
    });
  });

  document.querySelectorAll('[data-lead-close]').forEach(b=>{
    b.addEventListener('click',()=>{
      document.getElementById('leadModal').classList.remove('is-open');
    });
  });

});

