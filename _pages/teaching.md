---
layout: page
permalink: /teaching/
title: Teaching
description: Courses taught by Prof. Saerom Lee.
nav: true
nav_order: 5
---

<style>
.teaching-hero {
  background: #f4f8ff;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  padding: 1.35rem;
}

.teaching-hero p {
  color: #475569;
  font-size: 1.02rem;
  margin: 0;
}

.teaching-section {
  margin-top: 2rem;
}

.teaching-section h2 {
  color: #0f2f5f;
  font-size: 1.45rem;
  margin-bottom: 0.25rem;
}

.teaching-section > p {
  color: #64748b;
  margin-bottom: 1rem;
}

.teaching-course-grid {
  display: grid;
  gap: 0.85rem;
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
}

.teaching-course {
  background: #ffffff;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  padding: 1rem;
}

.teaching-course h3 {
  color: #123b77;
  font-size: 1.05rem;
  line-height: 1.35;
  margin: 0.45rem 0;
}

.teaching-course__code {
  color: #168aad;
  font-size: 0.82rem;
  font-weight: 700;
}

.teaching-course__meta {
  color: #475569;
  font-size: 0.9rem;
  margin: 0.4rem 0 0;
}

.teaching-course__category {
  background: #eef7ff;
  border: 1px solid #cfe8ff;
  border-radius: 999px;
  color: #1e40af;
  display: inline-flex;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
}

@media (max-width: 575px) {
  .teaching-hero {
    padding: 1rem;
  }

  .teaching-course-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<section class="teaching-hero">
<p>Courses are organized by program level, with a concise overview of teaching areas.</p>
</section>

{% for group in site.data.teaching_courses.groups %}
<section class="teaching-section" id="{{ group.id }}">
<h2>{{ group.title }}</h2>
<p>{{ group.description }}</p>
<div class="teaching-course-grid">
{% for course in group.courses %}
<article class="teaching-course">
<span class="teaching-course__category">{{ course.category }}</span>
<h3>{{ course.title }}</h3>
<div class="teaching-course__code">{{ course.code }}</div>
<p class="teaching-course__meta">{{ course.unit }}</p>
</article>
{% endfor %}
</div>
</section>
{% endfor %}

## Previous Teaching

| Institution | Course |
| --- | --- |
| Chung-Ang University | Knowledge Society (지식사회론) |
| Hanyang University ERICA | Social Network Analysis (사회연결망분석) |
| Yanbian University of Science and Technology (China) | E-Commerce Systems (전자상거래체계, English) |
| Seoul National University | Management Information Systems (경영정보론) |
