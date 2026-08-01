---
layout: page
permalink: /research/
title: Research
description: "Four research areas of Smart AI & Innovation Lab."
nav: true
nav_order: 2
---

<style>
.research-hero {
  background: #f4f8ff;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  margin-bottom: 2rem;
  padding: 1.5rem;
}

.research-hero p {
  color: #475569;
  font-size: 1.05rem;
  margin-bottom: 0;
  max-width: 52rem;
}

.research-area-list {
  display: grid;
  gap: 1rem;
}

.research-area {
  --area-accent: #2563eb;
  background: #ffffff;
  border: 1px solid color-mix(in srgb, var(--area-accent) 38%, #dbeafe);
  border-radius: 8px;
  display: grid;
  gap: 1.25rem;
  grid-template-columns: 4rem 1fr;
  padding: 1.25rem;
}

.research-area__icon {
  align-items: center;
  background: color-mix(in srgb, var(--area-accent) 10%, #ffffff);
  border-radius: 8px;
  color: var(--area-accent);
  display: flex;
  height: 4rem;
  justify-content: center;
  width: 4rem;
}

.research-area h2 {
  color: var(--area-accent);
  font-size: 1.45rem;
  margin: 0 0 0.45rem;
}

.research-area p {
  color: #475569;
  margin-bottom: 0.9rem;
}

.research-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.research-keywords span {
  background: color-mix(in srgb, var(--area-accent) 8%, #ffffff);
  border: 1px solid color-mix(in srgb, var(--area-accent) 22%, #dbeafe);
  border-radius: 999px;
  color: #1e3a8a;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.35rem 0.6rem;
}

@media (max-width: 575px) {
  .research-area {
    grid-template-columns: 1fr;
  }
}
</style>

<section class="research-hero">
  <p>Smart AI & Innovation Lab focuses on human-centered AI, digital platforms, intelligent information systems, and digital innovation. The four areas share a single blue visual system and connect people, data, organizations, and emerging technologies.</p>
</section>

<div class="research-area-list">
  {% for area in site.data.research_areas %}
    <article class="research-area" style="--area-accent: {{ area.accent }};">
      <div class="research-area__icon" aria-hidden="true">
        {% if area.icon == "person" %}
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c1.5-4 12.5-4 14 0"/></svg>
        {% elsif area.icon == "platform" %}
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4" y="5" width="16" height="12" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
        {% elsif area.icon == "data" %}
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg>
        {% else %}
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3v4M12 17v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M3 12h4M17 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/><circle cx="12" cy="12" r="3"/></svg>
        {% endif %}
      </div>
      <div>
        <h2>{{ area.name }}</h2>
        <p>{{ area.description }}</p>
        <div class="research-keywords">
          {% for keyword in area.keywords %}
            <span>{{ keyword }}</span>
          {% endfor %}
        </div>
      </div>
    </article>
  {% endfor %}
</div>
