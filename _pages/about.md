---
layout: page
title: Home
permalink: /
description: "Smart AI & Innovation Lab at Kyungpook National University"
nav: false
nav_order: 1
---

<style>
.post-header {
  display: none;
}

.sail-home {
  color: #0f172a;
  margin-top: 0.75rem;
}

.sail-hero {
  align-items: center;
  background: linear-gradient(135deg, #081a33 0%, #123f7a 52%, #155e75 100%);
  border-radius: 8px;
  color: #ffffff;
  display: grid;
  gap: 2rem;
  grid-template-columns: minmax(0, 1.05fr) minmax(260px, 390px);
  margin-bottom: 2.5rem;
  overflow: hidden;
  padding: clamp(2rem, 5vw, 4rem);
}

.sail-hero__eyebrow {
  color: #bfdbfe;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0;
  margin-bottom: 0.6rem;
  text-transform: uppercase;
}

.sail-hero h1 {
  color: #ffffff;
  font-size: clamp(2.4rem, 7vw, 5.4rem);
  font-weight: 800;
  letter-spacing: 0;
  line-height: 0.95;
  margin: 0;
}

.sail-hero__subtitle {
  color: #dbeafe;
  font-size: clamp(1.1rem, 2.2vw, 1.55rem);
  line-height: 1.45;
  margin: 1.25rem 0 1.75rem;
  max-width: 38rem;
}

.sail-hero__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.sail-button {
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.46);
  border-radius: 8px;
  color: #ffffff;
  display: inline-flex;
  font-weight: 700;
  gap: 0.45rem;
  padding: 0.75rem 1rem;
  text-decoration: none;
}

.sail-button:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  text-decoration: none;
}

.sail-button--primary {
  background: #ffffff;
  color: #0f2f5f;
}

.sail-button--primary:hover {
  background: #dbeafe;
  color: #0f2f5f;
}

.sail-hero__photo-card {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(219, 234, 254, 0.28);
  border-radius: 8px;
  justify-self: end;
  max-width: 390px;
  overflow: hidden;
  width: 100%;
}

.sail-hero__photo-card img {
  display: block;
  aspect-ratio: 4 / 5;
  height: auto;
  object-fit: cover;
  object-position: center 22%;
  width: 100%;
}

.sail-hero__caption {
  background: rgba(8, 26, 51, 0.72);
  color: #dbeafe;
  font-size: 0.92rem;
  padding: 0.85rem 1rem;
}

.sail-hero__caption strong {
  color: #ffffff;
  display: block;
  font-size: 1rem;
}

.sail-map-section {
  margin: 0 0 2.6rem;
}

.sail-system-map {
  background: #f4f8ff;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  padding: 1rem;
}

.sail-system-map svg {
  display: block;
  height: auto;
  width: 100%;
}

.sail-mobile-map {
  display: none;
}

.sail-mobile-map__core {
  align-items: center;
  background: #0f2f5f;
  border-radius: 8px;
  color: #ffffff;
  display: flex;
  font-size: 1.35rem;
  font-weight: 800;
  height: 4rem;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.sail-mobile-map__areas {
  display: grid;
  gap: 0.55rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.sail-mobile-map__areas span {
  --area-accent: #2563eb;
  background: color-mix(in srgb, var(--area-accent) 8%, #ffffff);
  border: 1px solid color-mix(in srgb, var(--area-accent) 24%, #dbeafe);
  border-radius: 8px;
  color: #0f2f5f;
  font-size: 0.86rem;
  font-weight: 800;
  padding: 0.65rem 0.7rem;
  text-align: center;
}

.sail-section {
  margin: 2.6rem 0;
}

.sail-section h2 {
  color: #0f2f5f;
  font-size: clamp(1.75rem, 3vw, 2.45rem);
  margin-bottom: 0.8rem;
}

.sail-section__lead {
  color: #475569;
  font-size: 1.05rem;
  max-width: 44rem;
}

.sail-research-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: 1.4rem;
}

.sail-area-card {
  --area-accent: #2563eb;
  background: #ffffff;
  border: 1px solid color-mix(in srgb, var(--area-accent) 40%, #dbeafe);
  border-radius: 8px;
  min-height: 100%;
  padding: 1.05rem;
}

.sail-area-card:hover {
  border-color: var(--area-accent);
}

.sail-area-icon {
  align-items: center;
  background: color-mix(in srgb, var(--area-accent) 12%, #ffffff);
  border-radius: 8px;
  color: var(--area-accent);
  display: inline-flex;
  height: 2.35rem;
  justify-content: center;
  margin-bottom: 0.9rem;
  width: 2.35rem;
}

.sail-area-card h3 {
  color: var(--area-accent);
  font-size: 1.08rem;
  margin: 0 0 0.7rem;
}

.sail-area-card p {
  color: #475569;
  font-size: 0.94rem;
  line-height: 1.55;
}

.sail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.9rem;
}

.sail-tag {
  background: color-mix(in srgb, var(--area-accent) 9%, #ffffff);
  border: 1px solid color-mix(in srgb, var(--area-accent) 22%, #e2e8f0);
  border-radius: 999px;
  color: #1e3a8a;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.28rem 0.55rem;
}

.sail-lab-note {
  background: #f4f8ff;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr auto;
  margin-top: 2rem;
  padding: 1.25rem;
}

.sail-lab-note p {
  color: #334155;
  margin: 0;
}

@media (max-width: 991px) {
  .sail-hero {
    grid-template-columns: 1fr;
  }

  .sail-hero__photo-card {
    justify-self: start;
    max-width: 320px;
  }

  .sail-research-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 575px) {
  .sail-hero {
    padding: 1.4rem;
  }

  .sail-hero h1 {
    font-size: clamp(2.1rem, 13vw, 3rem);
  }

  .sail-hero__photo-card {
    max-width: 260px;
  }

  .sail-system-map {
    display: none;
  }

  .sail-mobile-map {
    background: #f4f8ff;
    border: 1px solid #dbeafe;
    border-radius: 8px;
    display: block;
    padding: 0.9rem;
  }

  .sail-research-grid,
  .sail-lab-note {
    grid-template-columns: 1fr;
  }
}
</style>

<main class="sail-home" id="top">
  <section class="sail-hero" aria-labelledby="sail-home-title">
    <div>
      <div class="sail-hero__eyebrow">SAIL · Smart AI & Innovation Lab</div>
      <h1 id="sail-home-title">Smart AI &amp;<br>Innovation Lab</h1>
      <p class="sail-hero__subtitle">Human-Centered AI, Digital Platforms, and Intelligent Information Systems</p>
      <div class="sail-hero__buttons">
        <a class="sail-button sail-button--primary" href="{{ '/research/' | relative_url }}">Research</a>
        <a class="sail-button" href="{{ '/publications/' | relative_url }}">Publications</a>
      </div>
    </div>

    <div class="sail-hero__photo-card">
      <img src="{{ '/assets/img/saerom_profile_full.png' | relative_url }}" alt="Professor Saerom Lee">
      <div class="sail-hero__caption">
        <strong>Prof. Saerom Lee</strong>
        Kyungpook National University
      </div>
    </div>
  </section>

  <section class="sail-map-section" aria-label="SAIL Lab research map">
    <div class="sail-system-map">
      <svg viewBox="0 0 860 300" role="img" aria-labelledby="sail-diagram-title sail-diagram-desc">
        <title id="sail-diagram-title">SAIL Lab research map</title>
        <desc id="sail-diagram-desc">AI connects human-centered AI, digital platforms, intelligent information systems, and digital innovation.</desc>
        <g fill="none" stroke="#93c5fd" stroke-linecap="round" stroke-width="2">
          <path d="M430 150 L205 84"/>
          <path d="M430 150 L655 84"/>
          <path d="M430 150 L205 216"/>
          <path d="M430 150 L655 216"/>
        </g>
        <circle cx="430" cy="150" r="56" fill="#0f2f5f"/>
        <text x="430" y="143" fill="#ffffff" font-family="Inter, Noto Sans KR, Pretendard, sans-serif" font-size="30" font-weight="800" text-anchor="middle">AI</text>
        <text x="430" y="169" fill="#bfdbfe" font-family="Inter, Noto Sans KR, Pretendard, sans-serif" font-size="13" font-weight="700" text-anchor="middle">SAIL Lab</text>

        <g font-family="Inter, Noto Sans KR, Pretendard, sans-serif" font-weight="700" text-anchor="middle">
          <rect x="80" y="50" width="250" height="68" rx="8" fill="#ffffff" stroke="#bfdbfe"/>
          <text x="205" y="80" fill="#2563eb" font-size="16">Human-Centered AI</text>
          <text x="205" y="101" fill="#64748b" font-size="12">Human</text>

          <rect x="530" y="50" width="250" height="68" rx="8" fill="#ffffff" stroke="#c7d2fe"/>
          <text x="655" y="80" fill="#4f46e5" font-size="16">Digital Platforms</text>
          <text x="655" y="101" fill="#64748b" font-size="12">Platform</text>

          <rect x="80" y="182" width="250" height="68" rx="8" fill="#ffffff" stroke="#bae6fd"/>
          <text x="205" y="212" fill="#0891b2" font-size="16">Intelligent Information Systems</text>
          <text x="205" y="233" fill="#64748b" font-size="12">Information</text>

          <rect x="530" y="182" width="250" height="68" rx="8" fill="#ffffff" stroke="#bfdbfe"/>
          <text x="655" y="212" fill="#1d4ed8" font-size="16">Digital Innovation</text>
          <text x="655" y="233" fill="#64748b" font-size="12">Innovation</text>
        </g>
      </svg>
    </div>

    <div class="sail-mobile-map" aria-label="SAIL Lab research areas">
      <div class="sail-mobile-map__core">AI</div>
      <div class="sail-mobile-map__areas">
        {% for area in site.data.research_areas %}
          <span style="--area-accent: {{ area.accent }};">{{ area.name }}</span>
        {% endfor %}
      </div>
    </div>
  </section>

  <section class="sail-section" aria-labelledby="research-areas">
    <h2 id="research-areas">Research Areas</h2>
    <p class="sail-section__lead">Smart AI & Innovation Lab studies how AI, platforms, information systems, and emerging technologies shape decisions, organizations, and society.</p>
    <div class="sail-research-grid">
      {% for area in site.data.research_areas %}
        <article class="sail-area-card" style="--area-accent: {{ area.accent }};">
          <div class="sail-area-icon" aria-hidden="true">
            {% if area.icon == "person" %}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c1.5-4 12.5-4 14 0"/></svg>
            {% elsif area.icon == "platform" %}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="5" width="16" height="12" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
            {% elsif area.icon == "data" %}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg>
            {% else %}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v4M12 17v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M3 12h4M17 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/><circle cx="12" cy="12" r="3"/></svg>
            {% endif %}
          </div>
          <h3>{{ area.name }}</h3>
          <p>{{ area.description }}</p>
          <div class="sail-tags">
            {% for keyword in area.keywords %}
              <span class="sail-tag">{{ keyword }}</span>
            {% endfor %}
          </div>
        </article>
      {% endfor %}
    </div>
  </section>

  <section class="sail-lab-note">
    <p><strong>Directed by Prof. Saerom Lee</strong><br>Kyungpook National University</p>
    <a class="sail-button sail-button--primary" href="{{ '/members/' | relative_url }}">View Members</a>
  </section>
</main>
