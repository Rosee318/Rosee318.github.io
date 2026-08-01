---
layout: page
permalink: /media-news/
title: Media & News
description: Media coverage, interviews, videos, and featured news.
nav: true
nav_order: 5
---

{% assign people = "이새롬|아쿠아칼릭스|이광원|김준석" | split: "|" %}

<style>
.media-news-intro {
  color: #475569;
  margin-bottom: 1.6rem;
  max-width: 52rem;
}

.media-person {
  margin: 2rem 0;
}

.media-person h2 {
  color: #0f2f5f;
  margin-bottom: 1rem;
}

.media-news-grid {
  display: grid;
  gap: 0.85rem;
  grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
}

.media-news-card {
  background: #ffffff;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  min-height: 100%;
  padding: 1rem;
}

.media-news-card:hover {
  border-color: #2563eb;
}

.media-news-card__meta {
  color: #64748b;
  display: flex;
  flex-wrap: wrap;
  font-size: 0.82rem;
  gap: 0.4rem;
}

.media-news-card__type {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  color: #1d4ed8;
  font-weight: 700;
  padding: 0.12rem 0.45rem;
}

.media-news-card a {
  color: #0f2f5f;
  font-weight: 700;
  text-decoration: none;
}

.media-news-card a:hover {
  color: #2563eb;
  text-decoration: none;
}

.media-news-card__status {
  color: #64748b;
  font-size: 0.82rem;
  margin: 0;
}
</style>

<p class="media-news-intro">Selected media coverage, interviews, videos, and featured news related to SAIL Lab members and collaborators.</p>

{% for person in people %}
  {% assign entries = site.data.media | where: "person", person %}
  {% if entries.size > 0 %}
    <section class="media-person">
      <h2>{{ person }}</h2>
      <div class="media-news-grid">
        {% for item in entries %}
          <article class="media-news-card">
            <div class="media-news-card__meta">
              <span class="media-news-card__type">{{ item.type }}</span>
              <span>{{ item.source | escape }}</span>
              <span>{{ item.date | escape }}</span>
            </div>
            <a href="{{ item.url }}" target="_blank" rel="noopener noreferrer">{{ item.title | escape }}</a>
            {% if item.status %}
              <p class="media-news-card__status">{{ item.status | escape }}</p>
            {% endif %}
          </article>
        {% endfor %}
      </div>
    </section>
  {% endif %}
{% endfor %}
