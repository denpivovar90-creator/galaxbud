// ====== Scroll reveal через IntersectionObserver ======
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// ====== Анімований підрахунок цифр у метриках ======
function animateCounter(el, target, duration = 1600) {
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
    el.textContent = Math.floor(eased * target).toLocaleString('uk-UA');
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = target.toLocaleString('uk-UA');
  }
  requestAnimationFrame(tick);
}

const counterIO = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const target = parseInt(e.target.dataset.count, 10);
      if (!isNaN(target)) animateCounter(e.target, target);
      counterIO.unobserve(e.target);
    }
  });
}, { threshold: 0.01 });

document.querySelectorAll('[data-count]').forEach(el => counterIO.observe(el));

// Страховка: якщо блок так і не потрапив у зону видимості (наприклад, на низькому
// екрані він лишається під згином), показуємо кінцеве число замість нуля.
setTimeout(() => {
  document.querySelectorAll('[data-count]').forEach(el => {
    if (el.textContent.trim() === '0') {
      const target = parseInt(el.dataset.count, 10);
      if (!isNaN(target)) el.textContent = target.toLocaleString('uk-UA');
    }
  });
}, 2500);

// ====== Невеликий parallax для фону героя ======
const heroBg = document.querySelector('.hero-bg');
if (heroBg) {
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < window.innerHeight) {
      heroBg.style.transform = `translateY(${y * 0.25}px) scale(1.05)`;
    }
  }, { passive: true });
}

// ============================================================
//  НАЛАШТУВАННЯ TELEGRAM
//  Заповніть ці два рядки — інструкція в файлі TELEGRAM.md
// ============================================================
const TELEGRAM_BOT_TOKEN = '8477554349:AAFjViKZWgSTaXeKcXHcU8jD9Q3LOCh0Rps';

// Кому надсилати заявки. Можна додати ще ID через кому.
// ВАЖЛИВО: кожен отримувач має один раз натиснути Start у діалозі з ботом,
// інакше Telegram не дозволить боту йому написати.
const TELEGRAM_CHAT_IDS = ['8784431836', '6719768956'];

// ====== МОДАЛЬНЕ ВІКНО ======
const modal = document.getElementById('modal');
const modalService = document.getElementById('modalService');
const fieldService = document.getElementById('fieldService');
const modalForm = document.getElementById('leadForm');
const modalSuccess = document.getElementById('modalSuccess');

function openModal(serviceName) {
  if (!modal) return;
  const name = serviceName || 'Заявка з сайту';
  if (modalService) modalService.textContent = name;
  if (fieldService) fieldService.value = name;
  // скидаємо стан форми
  if (modalForm) { modalForm.style.display = 'flex'; modalForm.reset(); }
  if (modalSuccess) modalSuccess.classList.remove('is-visible');
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  setTimeout(() => {
    const first = modal.querySelector('input[name="name"]');
    if (first) first.focus();
  }, 350);
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

// відкриття по кліку на картки послуг та інші кнопки
document.querySelectorAll('.js-open-modal').forEach(el => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(el.dataset.service);
  });
});

// закриття
document.querySelectorAll('.js-close-modal').forEach(el => {
  el.addEventListener('click', closeModal);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ====== ВІДПРАВКА ЗАЯВОК У TELEGRAM ======

// екранування, щоб символи < > & у тексті не ламали розмітку повідомлення
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function sendToTelegram(data) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_IDS.length) {
    console.warn('Telegram не налаштовано: перевірте TELEGRAM_BOT_TOKEN і TELEGRAM_CHAT_IDS у script.js');
    return false;
  }

  const pageLang = (document.documentElement.lang || 'uk').toLowerCase();
  const langMark = pageLang.startsWith('en')
    ? '🌐 <b>Мова клієнта:</b> англійська (EN-версія сайту)'
    : '';

  const lines = [
    '🔔 <b>Нова заявка з сайту GalaxPlus</b>',
    '',
    data.service ? `📌 <b>Послуга:</b> ${escapeHtml(data.service)}` : '',
    `👤 <b>Ім'я:</b> ${escapeHtml(data.name || '—')}`,
    `📞 <b>Телефон:</b> ${escapeHtml(data.phone || '—')}`,
    data.email ? `✉️ <b>Email:</b> ${escapeHtml(data.email)}` : '',
    data.comment ? `💬 <b>Коментар:</b> ${escapeHtml(data.comment)}` : '',
    langMark,
    '',
    `🕒 ${new Date().toLocaleString('uk-UA')}`
  ].filter(Boolean);

  const text = lines.join('\n');

  // надсилаємо всім отримувачам паралельно
  const results = await Promise.allSettled(
    TELEGRAM_CHAT_IDS.map(chatId =>
      fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML'
        })
      }).then(async res => {
        if (!res.ok) {
          const info = await res.json().catch(() => ({}));
          console.warn(`Telegram: не доставлено на ${chatId}.`, info.description || res.status);
          throw new Error(info.description || res.status);
        }
        return true;
      })
    )
  );

  const delivered = results.filter(r => r.status === 'fulfilled').length;
  if (delivered === 0) console.error('Заявку не доставлено жодному отримувачу.');
  return delivered > 0;
}

function collectForm(form) {
  const fd = new FormData(form);
  return {
    service: fd.get('service') || '',
    name: fd.get('name') || '',
    phone: fd.get('phone') || '',
    email: fd.get('email') || '',
    comment: fd.get('comment') || ''
  };
}

// ====== ВІДПРАВКА НА ПОШТУ (Netlify Forms) ======
// Заявка потрапляє в панель Netlify і звідти пересилається на galaxplus4@gmail.com.
// Налаштування пошти — див. інструкцію в POSHTA.md
async function sendToEmail(form, data) {
  // на локальному файлі (file://) відправляти нікуди — пропускаємо
  if (location.protocol === 'file:') {
    console.info('Netlify Forms працює лише на опублікованому сайті.');
    return false;
  }

  const pageLang = (document.documentElement.lang || 'uk').toLowerCase();
  const body = new URLSearchParams({
    'form-name': form.getAttribute('name') || 'lead',
    'Послуга': data.service || '—',
    "Ім'я": data.name || '—',
    'Телефон': data.phone || '—',
    'Email': data.email || '—',
    'Коментар': data.comment || '—',
    'Мова сторінки': pageLang.startsWith('en') ? 'англійська (EN)' : 'українська (UA)'
  });

  try {
    const res = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });
    if (!res.ok) console.warn('Netlify Forms: помилка', res.status);
    return res.ok;
  } catch (err) {
    console.error('Помилка відправки на пошту:', err);
    return false;
  }
}

// надсилає заявку одразу в Telegram і на пошту
async function sendLead(form, data) {
  const [tg, mail] = await Promise.all([
    sendToTelegram(data),
    sendToEmail(form, data)
  ]);
  console.info(`Заявка: Telegram ${tg ? '✓' : '✗'}, пошта ${mail ? '✓' : '✗'}`);
  return tg || mail;
}

// підписи кнопок відповідно до мови сторінки
const IS_EN = (document.documentElement.lang || 'uk').toLowerCase().startsWith('en');
const T = {
  sending: IS_EN ? 'Sending…' : 'Надсилаємо…',
  sent:    IS_EN ? '✓ Request sent' : '✓ Заявку надіслано'
};

// обробник модальної форми
if (modalForm) {
  modalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = modalForm.querySelector('button[type="submit"]');
    const original = btn.innerHTML;
    btn.innerHTML = `<span>${T.sending}</span>`;
    btn.disabled = true;

    await sendLead(modalForm, collectForm(modalForm));

    btn.innerHTML = original;
    btn.disabled = false;
    modalForm.style.display = 'none';
    if (modalSuccess) modalSuccess.classList.add('is-visible');
    setTimeout(closeModal, 3200);
  });
}

// обробник основної форми в секції контактів
const mainForm = document.getElementById('mainForm');
if (mainForm) {
  mainForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = mainForm.querySelector('button[type="submit"]');
    const original = btn.innerHTML;
    btn.innerHTML = `<span>${T.sending}</span>`;
    btn.disabled = true;

    const data = collectForm(mainForm);
    if (!data.service) data.service = 'Форма в розділі «Контакти»';
    await sendLead(mainForm, data);

    btn.innerHTML = `<span>${T.sent}</span>`;
    mainForm.reset();
    setTimeout(() => { btn.innerHTML = original; btn.disabled = false; }, 3500);
  });
}

// ====== ФІКСОВАНА ШАПКА: фон після прокрутки ======
const siteHeader = document.getElementById('siteHeader');
if (siteHeader) {
  const toggleHeader = () => {
    siteHeader.classList.toggle('scrolled', window.scrollY > 60);
  };
  toggleHeader();
  window.addEventListener('scroll', toggleHeader, { passive: true });
}

// ====== БУРГЕР-МЕНЮ ======
const burger = document.getElementById('burger');
const mainNav = document.getElementById('mainNav');

if (burger && mainNav) {
  // затемнення позаду меню
  const navBackdrop = document.createElement('div');
  navBackdrop.className = 'nav-backdrop';
  document.body.appendChild(navBackdrop);

  const setNav = (open) => {
    mainNav.classList.toggle('is-open', open);
    navBackdrop.classList.toggle('is-visible', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('modal-open', open);
  };

  burger.addEventListener('click', () => {
    setNav(!mainNav.classList.contains('is-open'));
  });

  navBackdrop.addEventListener('click', () => setNav(false));

  // закривати меню після переходу за посиланням
  mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => setNav(false));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setNav(false);
  });
}

// ====== ЛОГОТИПИ ПАРТНЕРІВ: запасний варіант ======
// Якщо файл логотипа не завантажився — показуємо назву партнера текстом,
// щоб замість «битої» картинки блок залишався охайним.
document.querySelectorAll('.partner img').forEach(img => {
  const fallback = () => {
    const card = img.parentNode;
    if (!card) return;
    img.style.display = 'none';
    card.dataset.name = img.alt || '';
    card.classList.add('no-logo');
  };
  img.addEventListener('error', fallback);
  // якщо картинка вже встигла впасти до навішування обробника
  if (img.complete && img.naturalWidth === 0) fallback();
});
