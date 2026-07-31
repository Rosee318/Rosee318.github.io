---
layout: page
permalink: /members/
title: members
description: Professor, current members, alumni, and related media.
nav: true
nav_order: 7
---

<style>
:root {
  --global-code-bg-color: rgba(22, 138, 173, 0.08);
  --global-theme-color: #168aad;
  --global-hover-color: #0f7898;
}

html[data-theme="dark"] {
  --global-code-bg-color: #223640;
  --global-theme-color: #35b8d0;
  --global-hover-color: #4ecfe4;
}

.members-intro {
  margin-bottom: 2rem;
}

.members-intro p {
  color: var(--global-text-color-light);
  font-size: 1.02rem;
}

.professor-card {
  align-items: stretch;
  border: 1px solid rgba(22, 138, 173, 0.22);
  border-radius: 8px;
  display: grid;
  gap: 1.5rem;
  grid-template-columns: minmax(180px, 260px) 1fr;
  margin: 1.25rem 0 2.25rem;
  overflow: hidden;
}

.professor-card img {
  height: 100%;
  min-height: 280px;
  object-fit: cover;
  object-position: center;
  width: 100%;
}

.professor-card__body {
  padding: 1.4rem 1.5rem 1.4rem 0;
}

.member-label {
  color: var(--global-theme-color);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0;
  margin-bottom: 0.4rem;
  text-transform: uppercase;
}

.professor-card h2,
.member-card h3,
.media-card h3 {
  margin-top: 0;
}

.member-card h3 {
  font-size: 1.45rem;
  line-height: 1.2;
}

.member-cv-link {
  align-items: center;
  border: 1px solid rgba(22, 138, 173, 0.34);
  border-radius: 999px;
  display: inline-flex;
  font-size: 0.76rem;
  font-weight: 700;
  line-height: 1;
  margin-left: 0.35rem;
  padding: 0.28rem 0.52rem;
  text-transform: uppercase;
  vertical-align: middle;
}

.member-grid,
.media-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  margin-bottom: 2.25rem;
}

.member-card,
.media-card {
  border: 1px solid rgba(22, 138, 173, 0.18);
  border-radius: 8px;
  padding: 1rem;
}

.member-card p,
.media-card li {
  color: var(--global-text-color-light);
}

.media-card ul {
  margin-bottom: 0;
  padding-left: 1.15rem;
}

.media-card li + li {
  margin-top: 0.65rem;
}

@media (max-width: 767px) {
  .professor-card {
    grid-template-columns: 1fr;
  }

  .professor-card__body {
    padding: 0 1rem 1.2rem;
  }
}
</style>

<div class="members-intro">
  <p>Professor, current members, and alumni of the Management Information Systems research group.</p>
</div>

## Professor

<section class="professor-card">
  <img src="{{ '/assets/img/saerom_profile_full.png' | relative_url }}" alt="Saerom Lee">
  <div class="professor-card__body">
    <div class="member-label">Professor</div>
    <h2>이새롬 / Saerom Lee</h2>
    <p><strong>Associate Professor, School of Business Administration, Kyungpook National University</strong></p>
    <p>I teach and research in Management Information Systems (MIS). My research focuses on open collaboration and open source software (OSS), social media analytics, online reviews and review helpfulness, cyberbullying and online sexual harassment, innovation performance, and AI-based services and user behavior.</p>
    <p>In 2026, I founded the startup <strong>Robocalix (로보칼릭스)</strong>.</p>
  </div>
</section>

## Current Members

<div class="member-grid">
  <section class="member-card">
    <div class="member-label">Ph.D. Student</div>
    <h3>김준석 / Junseok Kim</h3>
    <p>Ph.D. student, Kyungpook National University.</p>
  </section>
</div>

## Alumni

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
      <a class="member-cv-link" href="{{ '/assets/pdf/hyewon_lee_cv.pdf' | relative_url }}" target="_blank" rel="noopener">CV</a>
    </h3>
    <p>M.S. in Information Systems, Kyungpook National University (2023-2025). Currently Ph.D. student in Information Systems, Kent State University (2025-).</p>
    <p><a href="mailto:hlee63@kent.edu">hlee63@kent.edu</a></p>
  </section>

  <section class="member-card">
    <div class="member-label">Alumni</div>
    <h3>이광원 / Kwangwon Lee</h3>
    <p>Deputy Executive Vice President (부행장보), iM Bank (formerly Daegu Bank).</p>
    <p><a href="https://www.dgb.co.kr/">iM Bank</a></p>
  </section>
</div>

## Media & Articles

<div class="media-grid">
  <section class="media-card">
    <h3>이새롬</h3>
    <ul>
      <li><a href="https://www.yeongnam.com/web/view.php?key=20260601025325632">[플랫폼의 습격 ③] 독과점 구조 어떻게 깰 것인가</a></li>
      <li><a href="https://www.yeongnam.com/web/view.php?key=20250615029265609">대구로 턱밑까지 따라잡은 공공배달앱 '먹깨비'</a></li>
      <li><a href="https://www.yeongnam.com/web/view.php?key=20250629022129363">[대구경북 공공배달앱 시장]&lt;하&gt; '애향심 마케팅' 한계... 골리앗앱 맞설 차별화 전략 필요</a></li>
      <li><a href="https://futurechosun.com/archives/31885">6명의 소셜벤처 리더 성장 스토리 담은 책 나왔다... '젊은 소셜벤처에게 묻다' 저자 인터뷰</a></li>
    </ul>
  </section>

  <section class="media-card">
    <h3>아쿠아칼릭스</h3>
    <ul>
      <li><a href="https://platum.kr/archives/290253">[전화성의 스타트업 모닝커피 1347회] 아쿠아칼릭스</a></li>
    </ul>
  </section>

  <section class="media-card">
    <h3>이광원</h3>
    <ul>
      <li><a href="https://www.asiatoday.co.kr/kn/view.php?key=20210330010019984">DGB금융그룹, 이광원 IT전략부장 '창조혁신경영대상' 수상</a></li>
      <li><a href="https://byline.network/2026/06/0609-3/">[인터뷰] 이광원 iM금융 CISO "보안과 AI 혁신, 저울의 균형 맞춰야"</a></li>
    </ul>
  </section>

  <section class="media-card">
    <h3>김준석</h3>
    <ul>
      <li><a href="https://www.knu.ac.kr/wbbs/wbbs/bbs/btin/viewBtin.action?bbs_cde=28&amp;btin.bbs_cde=28&amp;btin.doc_no=1330794&amp;btin.appl_no=000000&amp;btin.page=1&amp;btin.search_type=&amp;btin.search_text=&amp;popupDeco=&amp;btin.note_div=row&amp;menu_idx=214">컴퓨터학부 학생, 각종 경진대회에서 대상 등 다수 수상</a></li>
      <li><a href="https://www.knu.ac.kr/wbbs/wbbs/bbs/btin/viewBtin.action?bbs_cde=28&amp;btin.bbs_cde=28&amp;btin.doc_no=1333793&amp;btin.appl_no=000000&amp;btin.page=1&amp;btin.search_type=&amp;btin.search_text=&amp;popupDeco=&amp;btin.note_div=row&amp;menu_idx=214">컴퓨터학부 우성현·김준석 학생, 2024 대한민국 인재상 수상</a></li>
      <li><a href="https://www.swuniv.kr/540522002/?bmode=view&amp;idx=160538820">[2024 SW중심대학 에세이 공모전] 우수상 - 경북대 김준석님 &lt;소프트웨어로 시작된 도전과 창업의 길&gt;</a></li>
    </ul>
  </section>
</div>
