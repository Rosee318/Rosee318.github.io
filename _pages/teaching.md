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

.teaching-source {
  color: #64748b;
  font-size: 0.9rem;
  margin-top: 0.75rem;
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

.teaching-course__meta,
.teaching-course__terms {
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

.teaching-history-wrap {
  overflow-x: auto;
}

.teaching-history {
  border-collapse: collapse;
  min-width: 58rem;
  width: 100%;
}

.teaching-history th,
.teaching-history td {
  border-bottom: 1px solid #e2e8f0;
  padding: 0.72rem 0.65rem;
  vertical-align: top;
}

.teaching-history th {
  color: #0f2f5f;
  font-size: 0.82rem;
  text-transform: uppercase;
}

.teaching-history td {
  color: #334155;
  font-size: 0.92rem;
}

.teaching-history strong {
  color: #123b77;
}

@media (max-width: 575px) {
  .teaching-hero {
    padding: 1rem;
  }

  .teaching-course-grid {
    grid-template-columns: 1fr;
  }

  .teaching-history-wrap {
    overflow-x: visible;
  }

  .teaching-history {
    min-width: 0;
  }

  .teaching-history thead {
    display: none;
  }

  .teaching-history,
  .teaching-history tbody,
  .teaching-history tr,
  .teaching-history td {
    display: block;
    width: 100%;
  }

  .teaching-history tr {
    border: 1px solid #dbeafe;
    border-radius: 8px;
    margin-bottom: 0.75rem;
    padding: 0.75rem;
  }

  .teaching-history td {
    border-bottom: 0;
    display: grid;
    gap: 0.45rem;
    grid-template-columns: 4.8rem 1fr;
    padding: 0.2rem 0;
  }

  .teaching-history td::before {
    color: #1e40af;
    content: attr(data-label);
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
  }
}
</style>

<section class="teaching-hero">
<p>Courses are organized by program level and followed by a semester-by-semester history of Kyungpook National University teaching records.</p>
<p class="teaching-source">Source: <a href="{{ site.data.teaching_courses.source.url }}" target="_blank" rel="noopener">{{ site.data.teaching_courses.source.title }}</a>, checked {{ site.data.teaching_courses.source.checked }}.</p>
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
<p class="teaching-course__terms">{{ course.terms }}</p>
</article>
{% endfor %}
</div>
</section>
{% endfor %}

<section class="teaching-section">
<h2>Course History</h2>
<p>Semester-by-semester KNU records from the public lecture plan inquiry.</p>
<div class="teaching-history-wrap">
<table class="teaching-history">
<thead>
<tr>
<th>Year</th>
<th>Term</th>
<th>Level</th>
<th>Course</th>
<th>Unit</th>
</tr>
</thead>
<tbody>
{% for item in site.data.teaching_courses.history %}
<tr>
<td data-label="Year">{{ item.year }}</td>
<td data-label="Term">{{ item.term }}</td>
<td data-label="Level">{{ item.level }}</td>
<td data-label="Course"><strong>{{ item.title }}</strong><br>{{ item.code }} · {{ item.category }}</td>
<td data-label="Unit">{{ item.unit }}</td>
</tr>
{% endfor %}
</tbody>
</table>
</div>
</section>

## Previous Teaching

| Institution | Course | Term |
| --- | --- | --- |
| Chung-Ang University | Knowledge Society (지식사회론) | 2017 |
| Hanyang University ERICA | Social Network Analysis (사회연결망분석) | 2016 |
| Yanbian University of Science and Technology (China) | E-Commerce Systems (전자상거래체계, English) | 2016 |
| Seoul National University | Management Information Systems (경영정보론) | 2015–2016 |
