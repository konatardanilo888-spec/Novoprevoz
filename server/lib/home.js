'use strict';
const { html, raw, esc } = require('../lib/util');

function bilingual(me, en, tag) {
  tag = tag || 'span';
  return `<${tag} data-lang-text="me">${esc(me)}</${tag}><${tag} data-lang-text="en">${esc(en)}</${tag}>`;
}

function homePage({ settings, services, advantages, processSteps, portfolio, packages, testimonials, faq }) {
  return (
    heroSection(settings) +
    servicesSection(settings, services) +
    whySection(settings, advantages) +
    processSection(settings, processSteps) +
    portfolioSection(settings, portfolio) +
    packagesSection(settings, packages) +
    testimonialsSection(settings, testimonials) +
    faqSection(settings, faq) +
    contactSection(settings)
  );
}

function heroSection(s) {
  return html`
<section class="hero">
  <div class="container">
    <div class="hero-grid reveal in">
      <div>
        <span class="eyebrow" data-lang-text="me">ORUB DIGITAL — Izrada sajtova</span>
        <span class="eyebrow" data-lang-text="en">ORUB DIGITAL — Web Development</span>
        <h1 data-lang-text="me">${s.hero_title_me}</h1>
        <h1 data-lang-text="en">${s.hero_title_en}</h1>
        <p class="lead" data-lang-text="me">${s.hero_subtitle_me}</p>
        <p class="lead" data-lang-text="en">${s.hero_subtitle_en}</p>
        <div class="hero-cta-row">
          <a href="#kontakt" class="btn btn-primary">
            <span data-lang-text="me">${s.hero_cta_me}</span><span data-lang-text="en">${s.hero_cta_en}</span>
          </a>
          <a href="#portfolio" class="btn btn-outline">
            <span data-lang-text="me">Pogledaj radove</span><span data-lang-text="en">View our work</span>
          </a>
        </div>
      </div>
    </div>
    <div class="hero-stats reveal">
      <div class="hero-stat"><b>50+</b><span data-lang-text="me">Izrađenih sajtova</span><span data-lang-text="en">Websites built</span></div>
      <div class="hero-stat"><b>5–20</b><span data-lang-text="me">Dana do lansiranja</span><span data-lang-text="en">Days to launch</span></div>
      <div class="hero-stat"><b>100%</b><span data-lang-text="me">Responzivan dizajn</span><span data-lang-text="en">Responsive design</span></div>
    </div>
  </div>
</section>`;
}

function servicesSection(s, items) {
  if (!items.length) return '';
  const cards = items.map(it => `
    <div class="card reveal">
      <span class="icon">${esc(it.icon || '•')}</span>
      <h3 data-lang-text="me">${esc(it.title_me)}</h3><h3 data-lang-text="en">${esc(it.title_en)}</h3>
      <p data-lang-text="me">${esc(it.desc_me)}</p><p data-lang-text="en">${esc(it.desc_en)}</p>
    </div>`).join('');
  return html`
<section class="section" id="usluge">
  <div class="container">
    <div class="section-head center reveal">
      <span class="eyebrow" data-lang-text="me">Usluge</span><span class="eyebrow" data-lang-text="en">Services</span>
      <h2 class="section-title" data-lang-text="me">Šta radimo</h2><h2 class="section-title" data-lang-text="en">What we do</h2>
      <p class="section-sub" data-lang-text="me">${s.services_intro_me}</p><p class="section-sub" data-lang-text="en">${s.services_intro_en}</p>
    </div>
    <div class="grid grid-3">${raw(cards)}</div>
  </div>
</section>`;
}

function whySection(s, items) {
  if (!items.length) return '';
  const cards = items.map(it => `
    <div class="card reveal">
      <span class="icon">${esc(it.icon || '•')}</span>
      <h3 data-lang-text="me">${esc(it.title_me)}</h3><h3 data-lang-text="en">${esc(it.title_en)}</h3>
      <p data-lang-text="me">${esc(it.desc_me)}</p><p data-lang-text="en">${esc(it.desc_en)}</p>
    </div>`).join('');
  return html`
<section class="section section-dark" id="zasto-mi">
  <div class="container">
    <div class="section-head center reveal">
      <span class="eyebrow" data-lang-text="me">Prednosti</span><span class="eyebrow" data-lang-text="en">Advantages</span>
      <h2 class="section-title" data-lang-text="me">Zašto ORUB DIGITAL</h2><h2 class="section-title" data-lang-text="en">Why ORUB DIGITAL</h2>
      <p class="section-sub" data-lang-text="me">${s.why_intro_me}</p><p class="section-sub" data-lang-text="en">${s.why_intro_en}</p>
    </div>
    <div class="grid grid-3">${raw(cards)}</div>
  </div>
</section>`;
}

function processSection(s, items) {
  if (!items.length) return '';
  const steps = items.map((it, i) => `
    <div class="process-step reveal">
      <div class="num">0${i + 1}</div>
      <h3 data-lang-text="me">${esc(it.title_me)}</h3><h3 data-lang-text="en">${esc(it.title_en)}</h3>
      <p data-lang-text="me">${esc(it.desc_me)}</p><p data-lang-text="en">${esc(it.desc_en)}</p>
    </div>`).join('');
  return html`
<section class="section" id="kako-radimo">
  <div class="container">
    <div class="section-head center reveal">
      <span class="eyebrow" data-lang-text="me">Proces</span><span class="eyebrow" data-lang-text="en">Process</span>
      <h2 class="section-title" data-lang-text="me">Kako radimo</h2><h2 class="section-title" data-lang-text="en">How we work</h2>
      <p class="section-sub" data-lang-text="me">${s.process_intro_me}</p><p class="section-sub" data-lang-text="en">${s.process_intro_en}</p>
    </div>
    <div class="process-list">${raw(steps)}</div>
  </div>
</section>`;
}

function portfolioSection(s, items) {
  if (!items.length) return '';
  const cards = items.map(it => `
    <div class="portfolio-card reveal">
      <div class="portfolio-thumb">
        ${it.image ? `<img src="${esc(it.image)}" alt="${esc(it.title)}" loading="lazy">` : `<span class="placeholder">${esc(it.title)}</span>`}
      </div>
      <div class="portfolio-body">
        <h3>${esc(it.title)}</h3>
        <p data-lang-text="me">${esc(it.desc_me)}</p><p data-lang-text="en">${esc(it.desc_en)}</p>
        ${it.link ? `<a class="portfolio-link" href="${esc(it.link)}" target="_blank" rel="noopener"><span data-lang-text="me">Pogledaj sajt →</span><span data-lang-text="en">View website →</span></a>` : ''}
      </div>
    </div>`).join('');
  return html`
<section class="section" id="portfolio">
  <div class="container">
    <div class="section-head center reveal">
      <span class="eyebrow" data-lang-text="me">Portfolio</span><span class="eyebrow" data-lang-text="en">Portfolio</span>
      <h2 class="section-title" data-lang-text="me">Naši radovi</h2><h2 class="section-title" data-lang-text="en">Our work</h2>
      <p class="section-sub" data-lang-text="me">${s.portfolio_intro_me}</p><p class="section-sub" data-lang-text="en">${s.portfolio_intro_en}</p>
    </div>
    <div class="grid grid-3">${raw(cards)}</div>
  </div>
</section>`;
}

function packagesSection(s, items) {
  if (!items.length) return '';
  const cards = items.map(it => {
    const featuresMe = (it.features_me || '').split('\n').filter(Boolean).map(f => `<li>${esc(f)}</li>`).join('');
    const featuresEn = (it.features_en || '').split('\n').filter(Boolean).map(f => `<li>${esc(f)}</li>`).join('');
    return `
    <div class="pkg-card reveal ${it.highlighted ? 'highlight' : ''}">
      ${it.highlighted ? `<span class="pkg-badge"><span data-lang-text="me">Najtraženiji</span><span data-lang-text="en">Most popular</span></span>` : ''}
      <h3 data-lang-text="me">${esc(it.name_me)}</h3><h3 data-lang-text="en">${esc(it.name_en)}</h3>
      <div class="pkg-price" data-lang-text="me">${esc(it.price_me)}</div>
      <div class="pkg-price" data-lang-text="en">${esc(it.price_en)}</div>
      <div class="pkg-price-note" data-lang-text="me">${esc(it.price_note_me)}</div>
      <div class="pkg-price-note" data-lang-text="en">${esc(it.price_note_en)}</div>
      <ul class="pkg-features" data-lang-text="me">${raw(featuresMe)}</ul>
      <ul class="pkg-features" data-lang-text="en">${raw(featuresEn)}</ul>
      <a href="#kontakt" class="btn ${it.highlighted ? 'btn-primary' : 'btn-outline'}">
        <span data-lang-text="me">Zatraži ponudu</span><span data-lang-text="en">Request a quote</span>
      </a>
    </div>`;
  }).join('');
  return html`
<section class="section" id="paketi">
  <div class="container">
    <div class="section-head center reveal">
      <span class="eyebrow" data-lang-text="me">Paketi i cijene</span><span class="eyebrow" data-lang-text="en">Packages &amp; pricing</span>
      <h2 class="section-title" data-lang-text="me">Izaberite paket</h2><h2 class="section-title" data-lang-text="en">Choose a package</h2>
      <p class="section-sub" data-lang-text="me">${s.packages_intro_me}</p><p class="section-sub" data-lang-text="en">${s.packages_intro_en}</p>
    </div>
    <div class="grid grid-3">${raw(cards)}</div>
  </div>
</section>`;
}

function testimonialsSection(s, items) {
  if (!items.length) return '';
  const cards = items.map(it => `
    <div class="testi-card reveal">
      <p class="testi-quote" data-lang-text="me">${esc(it.text_me)}</p>
      <p class="testi-quote" data-lang-text="en">${esc(it.text_en)}</p>
      <div class="testi-person">
        <div class="testi-avatar">${it.avatar ? `<img src="${esc(it.avatar)}" alt="${esc(it.name)}">` : esc((it.name || '?').charAt(0))}</div>
        <div>
          <div class="testi-name">${esc(it.name)}</div>
          <div class="testi-role">${esc(it.role)}</div>
        </div>
      </div>
    </div>`).join('');
  return html`
<section class="section section-dark" id="utisci">
  <div class="container">
    <div class="section-head center reveal">
      <span class="eyebrow" data-lang-text="me">Utisci</span><span class="eyebrow" data-lang-text="en">Testimonials</span>
      <h2 class="section-title" data-lang-text="me">Šta kažu klijenti</h2><h2 class="section-title" data-lang-text="en">What clients say</h2>
      <p class="section-sub" data-lang-text="me">${s.testimonials_intro_me}</p><p class="section-sub" data-lang-text="en">${s.testimonials_intro_en}</p>
    </div>
    <div class="grid grid-3">${raw(cards)}</div>
  </div>
</section>`;
}

function faqSection(s, items) {
  if (!items.length) return '';
  const rows = items.map(it => `
    <div class="faq-item reveal">
      <button class="faq-q" type="button">
        <span data-lang-text="me">${esc(it.question_me)}</span><span data-lang-text="en">${esc(it.question_en)}</span>
        <span class="plus">+</span>
      </button>
      <div class="faq-a">
        <p data-lang-text="me">${esc(it.answer_me)}</p>
        <p data-lang-text="en">${esc(it.answer_en)}</p>
      </div>
    </div>`).join('');
  return html`
<section class="section" id="faq">
  <div class="container">
    <div class="section-head center reveal">
      <span class="eyebrow" data-lang-text="me">Pitanja</span><span class="eyebrow" data-lang-text="en">FAQ</span>
      <h2 class="section-title" data-lang-text="me">Česta pitanja</h2><h2 class="section-title" data-lang-text="en">Frequently asked questions</h2>
      <p class="section-sub" data-lang-text="me">${s.faq_intro_me}</p><p class="section-sub" data-lang-text="en">${s.faq_intro_en}</p>
    </div>
    <div class="faq-list">${raw(rows)}</div>
  </div>
</section>`;
}

function contactSection(s) {
  const waLink = (s.whatsapp || '').replace(/[^0-9]/g, '');
  return html`
<section class="section section-dark" id="kontakt">
  <div class="container">
    <div class="contact-wrap">
      <div class="reveal">
        <span class="eyebrow" data-lang-text="me">Kontakt</span><span class="eyebrow" data-lang-text="en">Contact</span>
        <h2 class="section-title" data-lang-text="me">Zatražite ponudu</h2><h2 class="section-title" data-lang-text="en">Request a quote</h2>
        <p class="section-sub" data-lang-text="me">${s.contact_intro_me}</p><p class="section-sub" data-lang-text="en">${s.contact_intro_en}</p>
        <div style="margin-top:36px">
          <div class="contact-info-item">
            <div><b data-lang-text="me">E-mail</b><b data-lang-text="en">Email</b><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></div>
          </div>
          <div class="contact-info-item">
            <div><b data-lang-text="me">Telefon</b><b data-lang-text="en">Phone</b><a href="tel:${esc((s.phone || '').replace(/\s+/g, ''))}">${esc(s.phone)}</a></div>
          </div>
          <div class="contact-info-item">
            <div><b data-lang-text="me">Lokacija</b><b data-lang-text="en">Location</b><span>${esc(s.city)}, ${esc(s.country)}</span></div>
          </div>
        </div>
        <div class="social-row">
          ${raw(waLink ? `<a href="https://wa.me/${esc(waLink)}" target="_blank" rel="noopener" aria-label="WhatsApp">WA</a>` : '')}
          ${raw(s.viber ? `<a href="viber://chat?number=%2B${esc((s.viber || '').replace(/[^0-9]/g, ''))}" aria-label="Viber">VB</a>` : '')}
          ${raw(s.social_instagram ? `<a href="${esc(s.social_instagram)}" target="_blank" rel="noopener" aria-label="Instagram">IG</a>` : '')}
          ${raw(s.social_facebook ? `<a href="${esc(s.social_facebook)}" target="_blank" rel="noopener" aria-label="Facebook">FB</a>` : '')}
        </div>
      </div>
      <div class="reveal">
        <div class="form-card">
          <div id="form-msg" class="form-msg"></div>
          <form id="contact-form"
            data-success-me="Hvala! Vaš upit je poslat, javićemo se uskoro."
            data-success-en="Thank you! Your inquiry has been sent, we'll be in touch soon."
            data-error-me="Došlo je do greške. Pokušajte ponovo ili nas kontaktirajte direktno."
            data-error-en="Something went wrong. Please try again or contact us directly.">
            <div class="form-row">
              <div class="field">
                <label data-lang-text="me">Ime i prezime</label><label data-lang-text="en">Full name</label>
                <input type="text" name="name" required>
              </div>
              <div class="field">
                <label data-lang-text="me">E-mail</label><label data-lang-text="en">Email</label>
                <input type="email" name="email" required>
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label data-lang-text="me">Telefon</label><label data-lang-text="en">Phone</label>
                <input type="text" name="phone">
              </div>
              <div class="field">
                <label data-lang-text="me">Vrsta sajta</label><label data-lang-text="en">Website type</label>
                <select name="site_type">
                  <option data-lang-text="me" value="Firmeni sajt">Firmeni sajt</option>
                  <option data-lang-text="en" value="Business website">Business website</option>
                  <option data-lang-text="me" value="Web prodavnica">Web prodavnica</option>
                  <option data-lang-text="en" value="Online store">Online store</option>
                  <option data-lang-text="me" value="Portfolio sajt">Portfolio sajt</option>
                  <option data-lang-text="en" value="Portfolio website">Portfolio website</option>
                  <option data-lang-text="me" value="Redizajn">Redizajn</option>
                  <option data-lang-text="en" value="Redesign">Redesign</option>
                  <option data-lang-text="me" value="Ostalo">Ostalo</option>
                  <option data-lang-text="en" value="Other">Other</option>
                </select>
              </div>
            </div>
            <div class="field">
              <label data-lang-text="me">Budžet (opciono)</label><label data-lang-text="en">Budget (optional)</label>
              <input type="text" name="budget" placeholder="npr. 200–400€">
            </div>
            <div class="field">
              <label data-lang-text="me">Poruka</label><label data-lang-text="en">Message</label>
              <textarea name="message" required></textarea>
            </div>
            <button type="submit" class="btn btn-primary form-submit">
              <span data-lang-text="me">Pošalji upit</span><span data-lang-text="en">Send inquiry</span>
            </button>
            <p class="form-note" data-lang-text="me">Vaši podaci se koriste isključivo za odgovor na upit.</p>
            <p class="form-note" data-lang-text="en">Your data is used solely to respond to your inquiry.</p>
          </form>
        </div>
      </div>
    </div>
  </div>
</section>`;
}

module.exports = { homePage };
