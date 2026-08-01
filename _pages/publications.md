---
layout: page
permalink: /publications/
title: Publications
description: Full publication record from the curriculum vitae.
nav: true
nav_order: 4
---

{% assign international_journals = site.data.cv | where: "title", "International Journal Articles" | first %}
{% assign domestic_journals = site.data.cv | where: "title", "Domestic Journal Articles" | first %}
{% assign international_conferences = site.data.cv | where: "title", "International Conference Proceedings" | first %}
{% assign domestic_conferences = site.data.cv | where: "title", "Domestic Conference Proceedings" | first %}
{% assign books = site.data.cv | where: "title", "Books" | first %}

<style>
.pub-intro {
  color: #475569;
  max-width: 52rem;
}

.pub-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1.25rem 0 1.75rem;
}

.pub-filter button {
  background: #ffffff;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  color: #1e3a8a;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 700;
  padding: 0.45rem 0.75rem;
}

.pub-filter button.is-active,
.pub-filter button:hover {
  background: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
}

.pub-section {
  margin: 2rem 0;
}

.pub-section h2 {
  align-items: baseline;
  color: #0f2f5f;
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-bottom: 1rem;
}

.pub-count {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  color: #1d4ed8;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
}

.pub-list {
  display: grid;
  gap: 0.7rem;
}

.pub-item {
  background: #ffffff;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  color: #334155;
  line-height: 1.55;
  padding: 0.9rem 1rem;
}

.pub-subhead {
  color: #1d4ed8;
  font-size: 1.05rem;
  margin: 1.25rem 0 0.6rem;
}

@media (max-width: 575px) {
  .pub-filter {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 0.25rem;
  }

  .pub-filter button {
    white-space: nowrap;
  }
}
</style>

<p class="pub-intro">The publication record is organized from the CV into international publications, domestic publications, conference proceedings and presentations, and books.</p>

<div class="pub-filter" aria-label="Publication filters">
  <button class="is-active" type="button" data-filter="all">All</button>
  <button type="button" data-filter="international">International</button>
  <button type="button" data-filter="domestic">Domestic</button>
  <button type="button" data-filter="conference">Conference</button>
  <button type="button" data-filter="books">Books</button>
</div>

<section class="pub-section" data-pub-section="international">
  <h2>International Publications <span class="pub-count">{{ international_journals.contents.size }}</span></h2>
  <div class="pub-list">
    {% for item in international_journals.contents %}
      <article class="pub-item">{{ item | escape }}</article>
    {% endfor %}
  </div>
</section>

<section class="pub-section" data-pub-section="domestic">
  <h2>Domestic Publications <span class="pub-count">{{ domestic_journals.contents.size }}</span></h2>
  <div class="pub-list">
    {% for item in domestic_journals.contents %}
      <article class="pub-item">{{ item | escape }}</article>
    {% endfor %}
  </div>
</section>

<section class="pub-section" data-pub-section="conference">
  <h2>Conference Proceedings and Presentations <span class="pub-count">{{ international_conferences.contents.size | plus: domestic_conferences.contents.size }}</span></h2>

  <h3 class="pub-subhead">International Conference Proceedings</h3>
  <div class="pub-list">
    {% for item in international_conferences.contents %}
      <article class="pub-item">{{ item | escape }}</article>
    {% endfor %}
  </div>

  <h3 class="pub-subhead">Domestic Conference Proceedings</h3>
  <div class="pub-list">
    {% for item in domestic_conferences.contents %}
      <article class="pub-item">{{ item | escape }}</article>
    {% endfor %}
  </div>
</section>

<section class="pub-section" data-pub-section="books">
  <h2>Books <span class="pub-count">{{ books.contents.size }}</span></h2>
  <div class="pub-list">
    {% for item in books.contents %}
      <article class="pub-item">{{ item | escape }}</article>
    {% endfor %}
  </div>
</section>

<script>
  document.addEventListener("DOMContentLoaded", function () {
    const buttons = Array.from(document.querySelectorAll("[data-filter]"));
    const sections = Array.from(document.querySelectorAll("[data-pub-section]"));

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.filter;

        buttons.forEach((item) => item.classList.toggle("is-active", item === button));
        sections.forEach((section) => {
          section.hidden = filter !== "all" && section.dataset.pubSection !== filter;
        });
      });
    });
  });
</script>
