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

.member-grid--stacked {
  grid-template-columns: 1fr;
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

.member-card p {
  margin-bottom: 0.45rem;
}

.member-meta {
  color: #64748b;
  font-size: 0.92rem;
}

.member-section-title {
  color: #0f2f5f;
  font-size: 1.18rem;
  margin: 1.35rem 0 0.75rem;
}

.member-publications {
  border-top: 1px solid #dbeafe;
  margin-top: 0.9rem;
  padding-top: 0.85rem;
}

.member-publications h4 {
  color: #0f2f5f;
  font-size: 0.98rem;
  margin: 0 0 0.55rem;
}

.member-publications h5 {
  color: #1d4ed8;
  font-size: 0.84rem;
  font-weight: 800;
  margin: 0.75rem 0 0.35rem;
}

.member-publications ul {
  display: grid;
  gap: 0.45rem;
  margin: 0;
  padding-left: 1.15rem;
}

.member-publications li {
  color: #334155;
  font-size: 0.92rem;
  line-height: 1.5;
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
  <div class="member-grid member-grid--stacked">
    <section class="member-card">
      <div class="member-label">Ph.D. Student</div>
      <h3>김준석 / Joonseok Kim</h3>
      <p>Ph.D. student, Kyungpook National University.</p>
      <p><a href="mailto:ufo1112@naver.com">ufo1112@naver.com</a></p>
      <div class="member-publications">
        <h4>Publications</h4>
        <h5>Journal Articles</h5>
        <ul>
          <li>김준석, 박현선, 이새롬 (2026). Intention to Give Information for Vision-Based Smart Home Products: Based on the Privacy Calculus Model. 경영정보학연구.</li>
          <li>김준석, 윤여훈, 김경민, 이새롬 (2026). Korean Disfluency Span Detection for AI-Based Presentation Feedback. 인터넷전자상거래연구.</li>
          <li>김준석, 이새롬, 박종화 (2025). 복합 낙상 시나리오 영상에서의 Transformer 모델 최적화 및 성능 평가. 경영학연구.</li>
        </ul>
        <h5>Conference Presentations</h5>
        <ul>
          <li>김준석, 이새롬, 박종화 (2025). Vision Transformer 기반 낙상 감지 모델: 대규모 실환경 데이터를 기반으로. 2025 경영정보 관련 학회 춘계 통합학술대회.</li>
        </ul>
      </div>
    </section>

    <section class="member-card">
      <div class="member-label">Part-time Ph.D. Student</div>
      <h3>이보람 / Boram Lee</h3>
      <p>Part-time Ph.D. student, Kyungpook National University.</p>
      <p class="member-meta">Current affiliation: NongHyup</p>
      <div class="member-publications">
        <h4>Publications</h4>
        <h5>Journal Articles</h5>
        <ul>
          <li>Choi, Y., Lee, B., & Lee, S. (2026). Drivers of Multihoming in OTT Services: Parasocial Interaction and Technology-Enabled Flow. Asia Pacific Journal of Information Systems.</li>
          <li>이광원, 이보람, 이새롬 (2026). 지방은행의 시중은행 전환을 위한 전략적 요인 탐색: 디지털 전환전략을 중심으로. 한국IT서비스학회지, 25(1).</li>
          <li>이보람, 김혜린, 이새롬 (2023). 양가적 감정이 신기술 기반 서비스 도입에 미치는 영향: 메타버스 서비스 제공자를 중심으로. 지식경영연구, 24(3), 149-172.</li>
        </ul>
        <h5>Conference Presentations</h5>
        <ul>
          <li>이새롬, 이보람, 이민철 (2022). 메타버스 기술 기반 서비스 도입에 대한 은행의 대처 전략: 양가적 감정을 중심으로. 2022 한국경영정보학회 추계 학술대회.</li>
        </ul>
      </div>
    </section>

    <section class="member-card">
      <div class="member-label">Part-time Ph.D. Student</div>
      <h3>최윤정 / Yunjeong Choi</h3>
      <p>Part-time Ph.D. student, Kyungpook National University.</p>
      <p class="member-meta">Current affiliation: DIP</p>
      <p><a href="mailto:dbswjd20507@gmail.com">dbswjd20507@gmail.com</a></p>
      <div class="member-publications">
        <h4>Publications</h4>
        <h5>Journal Articles</h5>
        <ul>
          <li>Choi, Y., Lee, B., & Lee, S. (2026). Drivers of Multihoming in OTT Services: Parasocial Interaction and Technology-Enabled Flow. Asia Pacific Journal of Information Systems.</li>
        </ul>
      </div>
    </section>
  </div>

  <h2>Alumni</h2>
  <h3 class="member-section-title">Ph.D. Alumni</h3>
  <div class="member-grid member-grid--stacked">
    <section class="member-card">
      <div class="member-label">Ph.D. Alumni</div>
      <h3>이광원 / Kwangwon Lee</h3>
      <p>Ph.D. in Information Systems, Kyungpook National University.</p>
      <p class="member-meta">Graduated: Aug. 2026</p>
      <p class="member-meta">Current affiliation: IM Bank</p>
      <div class="member-publications">
        <h4>Publications</h4>
        <h5>Journal Articles</h5>
        <ul>
          <li>이광원, 이보람, 이새롬 (2026). 지방은행의 시중은행 전환을 위한 전략적 요인 탐색: 디지털 전환전략을 중심으로. 한국IT서비스학회지, 25(1).</li>
          <li>한민정, 이새롬, 이광원 (2025). 숏폼 영상 중독에 영향을 미치는 요인 연구: 상대과정이론을 기반으로. 정보시스템연구, 34(2), 45-76.</li>
        </ul>
      </div>
    </section>
  </div>

  <h3 class="member-section-title">M.S. Alumni</h3>
  <div class="member-grid member-grid--stacked">
    <section class="member-card">
      <div class="member-label">M.S. Alumni</div>
      <h3>
        이혜원 / Hyewon Lee
        <a class="member-cv-link" href="{{ '/assets/pdf/hyewon_lee_cv.pdf' | relative_url }}" target="_blank" rel="noopener noreferrer">CV</a>
      </h3>
      <p>M.S. in Information Systems, Kyungpook National University.</p>
      <p class="member-meta">Graduated: Aug. 2025</p>
      <p class="member-meta">Ph.D. student, Kent State University</p>
      <p><a href="mailto:dws9318@gmail.com">dws9318@gmail.com</a></p>
    </section>

    <section class="member-card">
      <div class="member-label">M.S. Alumni</div>
      <h3>한민정 / Minjung Han</h3>
      <p>Part-time M.S. in Information Systems, Kyungpook National University.</p>
      <p class="member-meta">Graduated: Feb. 2025</p>
      <p class="member-meta">Current affiliation: Developer</p>
      <p><a href="mailto:hmj9656@gmail.com">hmj9656@gmail.com</a></p>
      <div class="member-publications">
        <h4>Publications</h4>
        <h5>Journal Articles</h5>
        <ul>
          <li>한민정, 이새롬, 이광원 (2025). 숏폼 영상 중독에 영향을 미치는 요인 연구: 상대과정이론을 기반으로. 정보시스템연구, 34(2), 45-76.</li>
        </ul>
      </div>
    </section>

    <section class="member-card">
      <div class="member-label">M.S. Alumni</div>
      <h3>이서현 / Seohyun Lee</h3>
      <p>M.S. in Information Systems, Kyungpook National University.</p>
      <p class="member-meta">Graduated: Aug. 2024</p>
      <p class="member-meta">Current affiliation: Food and beverage professional</p>
      <p><a href="mailto:suny8362@gmail.com">suny8362@gmail.com</a></p>
      <div class="member-publications">
        <h4>Publications</h4>
        <h5>Journal Articles</h5>
        <ul>
          <li>김혜원, 김혜린, 이서현, 이새롬 (2024). 학령기 아동 모바일 의존에 영향을 미치는 부모의 심리적 특성 연구. 지식경영연구.</li>
          <li>이서현, 이새롬, 곽동헌 (2022). When do I Protect Myself? Avoidance Motivation toward Online Sexual Harassment on Social Media: A Study Based on Threat Avoidance Theory. 지식경영연구, 23(3). (교신저자)</li>
        </ul>
        <h5>Conference Presentations</h5>
        <ul>
          <li>김혜린, 이서현, 이새롬 (2022). 영유아의 모바일 영상 소비 결정에 영향을 미치는 요인. 한국전략마케팅학회.</li>
        </ul>
      </div>
    </section>

    <section class="member-card">
      <div class="member-label">M.S. Alumni</div>
      <h3>김혜린 / Hyerin Kim</h3>
      <p>M.S. in Information Systems, Kyungpook National University.</p>
      <p class="member-meta">Graduated: Feb. 2024</p>
      <p class="member-meta">Current affiliation: Public official</p>
      <p><a href="mailto:hrinsam3@gmail.com">hrinsam3@gmail.com</a></p>
      <div class="member-publications">
        <h4>Publications</h4>
        <h5>Journal Articles</h5>
        <ul>
          <li>김혜린, 이새롬, 우수한 (2026). Factors influencing purchase intention of products created by influencers: Based on the trust transfer theory. 경영학연구, 55(4).</li>
          <li>김혜원, 김혜린, 이서현, 이새롬 (2024). 학령기 아동 모바일 의존에 영향을 미치는 부모의 심리적 특성 연구. 지식경영연구.</li>
          <li>이보람, 김혜린, 이새롬 (2023). 양가적 감정이 신기술 기반 서비스 도입에 미치는 영향: 메타버스 서비스 제공자를 중심으로. 지식경영연구, 24(3), 149-172.</li>
        </ul>
        <h5>Conference Presentations</h5>
        <ul>
          <li>김혜린, 이서현, 이새롬 (2022). 영유아의 모바일 영상 소비 결정에 영향을 미치는 요인. 한국전략마케팅학회.</li>
        </ul>
      </div>
    </section>

    <section class="member-card">
      <div class="member-label">M.S. Alumni</div>
      <h3>배성훈 / Seonghun Bae</h3>
      <p>M.S. in Information Systems, Kyungpook National University.</p>
      <p class="member-meta">Graduated: Feb. 2023</p>
      <p class="member-meta">Current affiliation: The Hong Kong Polytechnic University</p>
      <p><a href="mailto:chopchop0411@gmail.com">chopchop0411@gmail.com</a></p>
      <div class="member-publications">
        <h4>Publications</h4>
        <h5>Journal Articles</h5>
        <ul>
          <li>배성훈, 이새롬, 백현미 (2024). 세 가지 차원의 리뷰어 경험이 리뷰 유용성에 미치는 영향: 온라인 게임 플랫폼 스팀을 중심으로. 경영학연구.</li>
          <li>배성훈, 김현묵, 이의준, 이새롬 (2022). 온라인 게임 리뷰의 특성이 리뷰 유용성에 미치는 영향: 토픽모델링을 활용하여. 정보시스템연구, 31(4).</li>
          <li>장주혁, 백현미, 이새롬, 배성훈 (2022). 온라인 리뷰어의 과소보고 편향에 관한 실증 연구: 온라인 게임 플랫폼 스팀을 중심으로. 지식경영연구, 23(2).</li>
        </ul>
        <h5>Conference Presentations</h5>
        <ul>
          <li>배성훈, 이새롬 (2022). 리뷰전문성이 리뷰유용성에 미치는 영향: 리뷰 경험을 기반한 전문성을 중심으로. 한국전략마케팅학회.</li>
          <li>배성훈, 이새롬, 백현미 (2021). 온라인 리뷰 유용성(review helpfulness)에 영향을 미치는 리뷰어 전문성의 특성: 온라인 게임 플랫폼 스팀 리뷰를 중심으로. 2021 경영정보관련 춘계통합학술대회.</li>
          <li>배성훈, 이새롬, 백현미 (2021). 온라인 리뷰 유용성에 영향을 미치는 리뷰어의 전문성: 게임 플랫폼 스팀을 중심으로. 정보사회학회 추계학술대회.</li>
          <li>장주혁, 백현미, 이새롬, 배성훈 (2021). 온라인 리뷰에서 과소 보고 성향을 띄는 리뷰어에 대한 실증적인 분석 - Steampowered.com 플랫폼을 통하여. 정보시스템학회 추계학술대회.</li>
          <li>김현묵, 이의준, 배성훈, 이새롬 (2021). 온라인 게임 플랫폼의 얼리 액세스 전략: 게임 리뷰 토픽 모델링을 중심으로. 정보시스템학회 추계학술대회.</li>
        </ul>
      </div>
    </section>
  </div>
</div>
