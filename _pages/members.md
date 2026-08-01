---
layout: page
permalink: /members/
title: Members
description: Director, current members, and alumni.
nav: true
nav_order: 3
---

<style>
.members-page {
  color: #0f172a;
}

.director-card {
  background: #ffffff;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  display: grid;
  gap: 1.5rem;
  grid-template-columns: minmax(260px, 360px) 1fr;
  margin: 1.25rem 0 2.5rem;
  overflow: hidden;
}

.director-card img {
  height: 100%;
  min-height: 430px;
  object-fit: cover;
  object-position: center;
  width: 100%;
}

.director-card__body {
  padding: 1.6rem 1.6rem 1.6rem 0;
}

.member-label {
  color: #2563eb;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0;
  margin-bottom: 0.45rem;
  text-transform: uppercase;
}

.director-card h2,
.member-card h3 {
  color: #0f2f5f;
  margin-top: 0;
}

.director-card p,
.member-card p {
  color: #475569;
}

.director-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.director-links a,
.member-cv-link {
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  color: #1d4ed8;
  display: inline-flex;
  font-size: 0.84rem;
  font-weight: 800;
  line-height: 1;
  padding: 0.42rem 0.65rem;
  text-decoration: none;
}

.director-links a:hover,
.member-cv-link:hover {
  background: #eff6ff;
  color: #0f4fd1;
  text-decoration: none;
}

.member-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  margin-bottom: 2.25rem;
}

.member-card {
  background: #ffffff;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  padding: 1rem;
}

.member-card h3 {
  font-size: 1.32rem;
  line-height: 1.25;
}

.member-cv-link {
  font-size: 0.76rem;
  margin-left: 0.35rem;
  padding: 0.3rem 0.5rem;
  vertical-align: middle;
}

@media (max-width: 767px) {
  .director-card {
    grid-template-columns: 1fr;
  }

  .director-card img {
    max-height: 520px;
  }

  .director-card__body {
    padding: 0 1rem 1.2rem;
  }
}
</style>

<div class="members-page">
  <h2>Director</h2>
  <section class="director-card">
    <img src="{{ '/assets/img/saerom_profile_full.png' | relative_url }}" alt="Professor Saerom Lee">
    <div class="director-card__body">
      <div class="member-label">Director</div>
      <h2>Prof. Saerom Lee</h2>
      <p><strong>Department of Business Administration<br>Kyungpook National University</strong></p>
      <p>Research Interests</p>
      <p>Human-centered AI, digital platforms, intelligent information systems, digital innovation, open collaboration, online reviews, social media analytics, and user behavior.</p>
      <div class="director-links">
        <a href="mailto:saeromlee@knu.ac.kr">Email</a>
        <a href="{{ '/cv/' | relative_url }}">CV</a>
        <a href="https://scholar.google.com/citations?user={{ site.data.socials.scholar_userid }}" target="_blank" rel="noopener noreferrer">Google Scholar</a>
      </div>
    </div>
  </section>

  <h2>Current Members</h2>
  <div class="member-grid">
    <section class="member-card">
      <div class="member-label">Ph.D. Student</div>
      <h3>김준석 / Junseok Kim</h3>
      <p>Ph.D. student, Kyungpook National University.</p>
    </section>
  </div>

  <h2>Alumni</h2>
  <div class="member-grid">
    <section class="member-card">
      <div class="member-label">Alumni</div>
      <h3>배성훈 / Seonghun Bae</h3>
      <p>Ph.D. student, HKUST (Information Systems).</p>
    </section>

    <section class="member-card">
      <div class="member-label">Alumni</div>
      <h3>
        이혜원 / Hyewon Lee
        <a class="member-cv-link" href="{{ '/assets/pdf/hyewon_lee_cv.pdf' | relative_url }}" target="_blank" rel="noopener noreferrer">CV</a>
      </h3>
      <p>M.S. in Information Systems, Kyungpook National University (2023-2025). Currently Ph.D. student in Information Systems, Kent State University (2025-).</p>
      <p><a href="mailto:hlee63@kent.edu">hlee63@kent.edu</a></p>
    </section>

    <section class="member-card">
      <div class="member-label">Alumni</div>
      <h3>이광원 / Kwangwon Lee</h3>
      <p>Deputy Executive Vice President, iM Bank (formerly Daegu Bank).</p>
      <p><a href="https://www.dgb.co.kr/" target="_blank" rel="noopener noreferrer">iM Bank</a></p>
    </section>
  </div>
</div>
