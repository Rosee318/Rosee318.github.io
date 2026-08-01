---
layout: page
title: Home
permalink: /
description: Smart AI & Innovation Lab at Kyungpook National University
nav: true
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
  background: linear-gradient(135deg, #081a33 0%, #123f7a 52%, #155e75 100%);
  border-radius: 8px;
  color: #ffffff;
  display: grid;
  gap: 2rem;
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
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

.sail-diagram {
  align-self: center;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(219, 234, 254, 0.28);
  border-radius: 8px;
  min-height: 360px;
  padding: 1rem;
}

.sail-diagram svg {
  display: block;
  height: auto;
  width: 100%;
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

  .sail-research-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 575px) {
  .sail-hero {
    padding: 1.4rem;
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
      <div class="sail-hero__eyebrow">SAIL Lab · Smart AI & Innovation Lab</div>
      <h1 id="sail-home-title">AI &amp; DIGITAL<br>INNOVATION LAB</h1>
      <p class="sail-hero__subtitle">Designing Human-Centered AI for Digital Innovation</p>
      <div class="sail-hero__buttons">
        <a class="sail-button sail-button--primary" href="{{ '/research/' | relative_url }}">Research</a>
        <a class="sail-button" href="{{ '/publications/' | relative_url }}">Publications</a>
      </div>
    </div>

    <div class="sail-diagram" aria-label="SAIL Lab research map">
      <svg viewBox="0 0 560 420" role="img" aria-labelledby="sail-diagram-title sail-diagram-desc">
        <title id="sail-diagram-title">SAIL Lab research map</title>
        <desc id="sail-diagram-desc">AI connects human-centered AI, digital platforms, intelligent information systems, and digital innovation.</desc>
        <defs>
          <filter id="softGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#020617" flood-opacity="0.18"/>
          </filter>
        </defs>
        <g fill="none" stroke="#93c5fd" stroke-linecap="round" stroke-width="2">
          <path d="M280 210 L150 100"/>
          <path d="M280 210 L410 100"/>
          <path d="M280 210 L150 320"/>
          <path d="M280 210 L410 320"/>
        </g>
        <circle cx="280" cy="210" r="74" fill="#eff6ff" filter="url(#softGlow)"/>
        <text x="280" y="204" fill="#0f2f5f" font-family="Inter, Noto Sans KR, Pretendard, sans-serif" font-size="34" font-weight="800" text-anchor="middle">AI</text>
        <text x="280" y="235" fill="#2563eb" font-family="Inter, Noto Sans KR, Pretendard, sans-serif" font-size="15" font-weight="700" text-anchor="middle">Digital Innovation</text>
        <g font-family="Inter, Noto Sans KR, Pretendard, sans-serif" font-weight="700" text-anchor="middle">
          <rect x="45" y="56" width="210" height="72" rx="8" fill="#ffffff" opacity="0.94"/>
          <text x="150" y="88" fill="#2563eb" font-size="17">Human</text>
          <text x="150" y="110" fill="#475569" font-size="13">Human-Centered AI</text>

          <rect x="305" y="56" width="210" height="72" rx="8" fill="#ffffff" opacity="0.94"/>
          <text x="410" y="88" fill="#4f46e5" font-size="17">Platform</text>
          <text x="410" y="110" fill="#475569" font-size="13">Digital Platforms</text>

          <rect x="45" y="284" width="210" height="72" rx="8" fill="#ffffff" opacity="0.94"/>
          <text x="150" y="316" fill="#0891b2" font-size="17">Information</text>
          <text x="150" y="338" fill="#475569" font-size="13">Intelligent Systems</text>

          <rect x="305" y="284" width="210" height="72" rx="8" fill="#ffffff" opacity="0.94"/>
          <text x="410" y="316" fill="#1d4ed8" font-size="17">Innovation</text>
          <text x="410" y="338" fill="#475569" font-size="13">Digital Innovation</text>
        </g>
      </svg>
    </div>
  </section>

  <section class="sail-section" aria-labelledby="research-areas">
    <h2 id="research-areas">Research Areas</h2>
    <p class="sail-section__lead">SAIL Lab studies how AI, platforms, information systems, and digital innovation shape decisions, organizations, and society.</p>
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
