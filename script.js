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
}, { threshold: 0.4 });

document.querySelectorAll('[data-count]').forEach(el => counterIO.observe(el));

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
const TELEGRAM_BOT_TOKEN = '';   // напр. '7123456789:AAExxxxxxxxxxxxxxxxxxxxx'
const TELEGRAM_CHAT_ID   = '';   // напр. '123456789'

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
async function sendToTelegram(data) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('Telegram не налаштовано: заповніть TELEGRAM_BOT_TOKEN і TELEGRAM_CHAT_ID у script.js');
    return false;
  }
  const lines = [
    '🔔 <b>Нова заявка з сайту GalaxPlus</b>',
    '',
    data.service ? `📌 <b>Послуга:</b> ${data.service}` : '',
    `👤 <b>Ім'я:</b> ${data.name || '—'}`,
    `📞 <b>Телефон:</b> ${data.phone || '—'}`,
    data.email ? `✉️ <b>Email:</b> ${data.email}` : '',
    data.comment ? `💬 <b>Коментар:</b> ${data.comment}` : '',
    '',
    `🕒 ${new Date().toLocaleString('uk-UA')}`
  ].filter(Boolean);

  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: lines.join('\n'),
        parse_mode: 'HTML'
      })
    });
    return res.ok;
  } catch (err) {
    console.error('Помилка відправки в Telegram:', err);
    return false;
  }
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

// обробник модальної форми
if (modalForm) {
  modalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = modalForm.querySelector('button[type="submit"]');
    const original = btn.innerHTML;
    btn.innerHTML = '<span>Надсилаємо…</span>';
    btn.disabled = true;

    await sendToTelegram(collectForm(modalForm));

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
    btn.innerHTML = '<span>Надсилаємо…</span>';
    btn.disabled = true;

    const data = collectForm(mainForm);
    data.service = 'Форма в розділі «Контакти»';
    await sendToTelegram(data);

    btn.innerHTML = '<span>✓ Заявку надіслано</span>';
    mainForm.reset();
    setTimeout(() => { btn.innerHTML = original; btn.disabled = false; }, 3500);
  });
}
