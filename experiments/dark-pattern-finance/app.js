(() => {
  "use strict";
  const VERSION = "2026-11-19.1";
  const STORAGE_KEY = "morrow-finance-journey-v2";
  const params = new URLSearchParams(location.search);
  const requestedCondition = params.get("condition") === "neutral" ? "neutral" : "dark";
  const participantCode = (params.get("pid") || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48);
  const researcher = params.get("researcher") === "1";
  const steps = ["시작", "연결 계좌", "대출 비교", "투자 구성", "관리 플랜", "추가 서비스", "자동환전", "혜택 설정", "최종 확인", "완료"];
  const mechanismMap = {
    1: ["T04 숨겨진 정보"],
    2: ["T05 가격비교 방해"],
    3: ["T07 다른 소비자의 활동 알림"],
    4: ["T02a 잘못된 계층구조", "T02b 감각조작"],
    5: ["T03 특정옵션의 사전선택"],
    6: ["T01 속임수 질문"],
    7: ["T06 감정적 언어사용"],
  };
  const product = {
    A: { name: "Loan A", rate: 4.8, upfrontRate: 0, earlyRate: 0.6 },
    B: { name: "Loan B", rate: 4.5, upfrontRate: 1.2, earlyRate: 0 },
  };
  const screen = document.getElementById("screen");
  const navigation = document.getElementById("navigation");
  const progress = document.getElementById("progress");
  const dialogRoot = document.getElementById("dialog-root");
  let pressureTimer;
  let pageEnteredAt = Date.now();
  let session = loadSession();
  let returningToReview = !!(session && session.returningToReview);
  let loanCard = session && session.loanCard === "B" ? "B" : "A";
  let current = session ? session.step : 0;
  let storageAvailable = true;

  function freshSession() {
    return {
      schemaVersion: 2,
      appVersion: VERSION,
      sessionId: crypto.randomUUID ? crypto.randomUUID() : `mf-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      participantCode: (params.get("pid") || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48),
      condition: requestedCondition,
      startedAt: new Date().toISOString(),
      completedAt: null,
      finalDecision: null,
      step: 1,
      visited: [],
      initialChoices: {},
      choices: { account: null, loan: null, portfolio: null, plan: null, marketAlert: null, balanceReport: null, autoFx: null, care: null },
      events: [],
      totalMs: 0,
    };
  }
  function loadSession() {
    try {
      const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
      return stored &&
        stored.schemaVersion === 2 &&
        stored.appVersion === VERSION &&
        stored.condition === requestedCondition &&
        stored.participantCode === participantCode &&
        Number.isInteger(stored.step) &&
        stored.step >= 0 &&
        stored.step <= 9
        ? stored
        : null;
    } catch (_) {
      return null;
    }
  }
  function persist() {
    if (!session) return;
    session.step = current;
    session.returningToReview = returningToReview;
    session.loanCard = loanCard;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (_) {
      storageAvailable = false;
    }
  }
  function log(action, value = null) {
    if (!session) return;
    session.events.push({
      sequence: session.events.length + 1,
      step: steps[current],
      stepIndex: current,
      action,
      value,
      at: new Date().toISOString(),
      elapsedMs: Math.max(0, Date.now() - pageEnteredAt),
    });
    persist();
  }
  function choose(key, value) {
    const previous = session.choices[key];
    if (!Object.prototype.hasOwnProperty.call(session.initialChoices, key)) session.initialChoices[key] = value;
    session.choices[key] = value;
    log(previous === null || previous === value ? "choice" : "choice_change", { key, previous, value });
  }
  function money(value) {
    return `${Math.round(value).toLocaleString("ko-KR")}원`;
  }
  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }
  function costs() {
    const c = session.choices;
    const loan = product[c.loan];
    const principal = loan ? 3000000 : 0;
    const months = 36;
    const monthlyRate = loan ? loan.rate / 100 / 12 : 0;
    const monthlyLoan = loan ? (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1) : 0;
    const upfrontFee = loan ? (principal * loan.upfrontRate) / 100 : 0;
    const planFee = c.plan === "plus" ? 9900 : 0;
    const addonFee = (c.marketAlert ? 2900 : 0) + (c.balanceReport ? 1900 : 0) + (c.care === "yes" ? 3900 : 0);
    const recurringFee = planFee + addonFee;
    return {
      principal,
      months,
      loanRate: loan ? loan.rate : 0,
      monthlyLoan,
      loanInterestTotal: loan ? monthlyLoan * months - principal : 0,
      upfrontFee,
      planFee,
      addonFee,
      recurringFee,
      annualServiceFee: recurringFee * 12,
      monthlyTotal: monthlyLoan + recurringFee,
    };
  }
  function footer(backLabel, nextLabel, nextAction = "next", disabled = false) {
    navigation.innerHTML = `<div class="bottom-inner">${backLabel ? `<button class="back-button" data-action="back">${backLabel}</button>` : ""}<button class="button primary continue-button" data-action="${nextAction}" ${disabled ? "disabled" : ""}>${nextLabel}</button></div>`;
  }
  function selected(key, value) {
    return session.choices[key] === value ? " selected" : "";
  }
  function choice(key, value, title, description) {
    const checked = session.choices[key] === value;
    return `<label class="choice${checked ? " selected" : ""}"><input type="radio" name="${key}" value="${value}" ${checked ? "checked" : ""}><span class="choice-content"><span class="choice-title">${title}</span><span class="choice-desc">${description}</span></span></label>`;
  }
  function enterStep(index, reason = "navigate") {
    if (session) {
      log("step_leave", { durationMs: Date.now() - pageEnteredAt, nextStep: index, reason });
      session.totalMs += Math.max(0, Date.now() - pageEnteredAt);
    }
    current = index;
    pageEnteredAt = Date.now();
    if (session && index > 0 && index < 9) {
      const firstVisit = !session.visited.includes(index);
      if (firstVisit) session.visited.push(index);
      if (index === 5 && firstVisit) {
        const preselected = session.condition === "dark";
        choose("marketAlert", preselected);
        choose("balanceReport", preselected);
        log("initial_defaults", { marketAlert: preselected, balanceReport: preselected });
      }
      if (firstVisit) log("exposure", { mechanisms: mechanismMap[index] || [], condition: session.condition });
      log("step_enter", { firstVisit, reason });
    }
    persist();
    render();
    screen.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function render() {
    clearTimeout(pressureTimer);
    const dark = (session ? session.condition : requestedCondition) === "dark";
    document.body.className = dark ? "dark" : "neutral";
    progress.hidden = current === 0 || current === 9;
    progress.innerHTML = `<div class="progress-label"><span>${steps[current]}</span><span>${Math.min(current, 8)} / 8</span></div><div class="progress-track"><div class="progress-fill" style="width:${(Math.min(current, 8) / 8) * 100}%"></div></div>`;
    const renders = [intro, account, loan, portfolio, plan, addons, autoFx, care, review, complete];
    screen.innerHTML = `<div class="screen-inner">${renders[current](dark)}</div>`;
    if (researcher) {
      const div = document.createElement("div");
      div.className = "research-link";
      div.innerHTML = `<button class="text-button" data-action="research">연구자 설정 · ${session ? session.condition : requestedCondition}</button>`;
      screen.append(div);
    }
    if (current === 4 && dark)
      pressureTimer = setTimeout(() => {
        const banner = document.querySelector(".pressure-copy");
        if (banner && current === 4) {
          banner.textContent = "직접 관리보다 편리한 Smart Plus, 권장 구성을 확인해 주세요.";
          banner.closest(".pressure-banner").classList.add("renewed");
          log("sensory_reminder", "Smart Plus reminder");
        }
      }, 9000);
  }
  function intro() {
    footer(null, session ? "이어서 구성하기" : "금융 구성 시작하기", session ? "resume" : "start");
    return `<div class="eyebrow">MY FINANCIAL START</div><h1>새로운 금융 생활,<br>나에게 맞게 시작해요.</h1><p class="lead">계좌부터 자금 마련과 관리까지.<br>선택한 설정으로 나만의 구성을 완성하세요.</p><div class="card featured"><span class="tag">오늘의 과제</span><h2>다음 달 이사를 준비하고 있어요.</h2><p>필요한 생활자금 <strong>300만원</strong>을 마련하고, 보유한 여유자금 <strong>100만원</strong>을 관리할 구성을 선택해 주세요.</p><ul class="scenario-list"><li>대출이 필요하면 36개월 상환 조건을 비교해 주세요.</li><li>여유자금은 6개월 저축하거나, 장기 투자 여부를 결정할 수 있어요.</li><li>월 고정비와 상품 조건을 고려해 불필요한 서비스는 제외해 주세요.</li></ul></div><div class="notice blue"><strong>연구용 가상 체험입니다.</strong><p>상품·요금·이용자 알림은 사전에 정해진 모의 정보입니다. 실제 계좌 개설·대출·투자·결제는 발생하지 않습니다. 모든 선택은 변경하거나 마지막에 신청하지 않을 수 있습니다.</p></div><p class="small muted">진행 및 선택 기록은 이 브라우저 탭에만 보관됩니다. 완료 후 결과 파일을 내려받을 수 있습니다. 이름·연락처·금융정보는 입력하지 않습니다.</p>${session ? '<div class="session-resume">진행 중인 구성이 있습니다.</div>' : ""}`;
  }
  function account(dark) {
    footer("이전", returningToReview ? "수정 완료" : "계좌 설정 계속", "next", !session.choices.account);
    const details =
      '<p><strong>최대 연 5.2% 적용 조건</strong></p><ul class="scenario-list"><li>기본 연 2.1% + 우대 최대 3.1%p</li><li>매월 50만원 이상 자동이체</li><li>제휴카드 매월 30만원 이상 이용</li><li>카드 연회비 2만원 별도</li><li>6개월 만기 전 해지 시 우대금리 미적용</li></ul><p>모든 금리는 세전입니다. 우대 조건을 충족하지 못하면 기본금리가 적용됩니다.</p>';
    return `<div class="eyebrow">연결 계좌</div><h1>이사 준비 자금도,<br>여유자금도 한 곳에서.</h1><p class="lead">대출금 수령과 상환에 사용할 계좌를 골라 주세요. 여유자금 100만원의 보관 방식도 함께 결정됩니다.</p><div class="card featured${selected("account", "flex")}"><div class="card-head"><div><span class="tag">6개월 자유적립</span><h2>Flex Save 5.2</h2></div><span class="rate">최대 연<br><strong>5.2%</strong></span></div><p class="muted">연결 계좌와 함께 시작하는 저축</p>${dark ? `<details class="terms" data-log="account_conditions"><summary>기타 상품 조건 보기</summary><div class="terms-body">${details}</div></details>` : `<div class="notice blue">${details}</div>`}<button class="button ${session.choices.account === "flex" ? "primary" : "secondary"} wide" data-action="select" data-key="account" data-value="flex">Flex Save 계좌 선택${session.choices.account === "flex" ? "됨" : ""}</button></div><div class="card${selected("account", "basic")}"><div class="card-head"><div><h2>Basic 입출금 계좌</h2><p class="muted">자유로운 입출금 · 추가 이용 조건 없음</p></div><strong>연 2.1%</strong></div><button class="button secondary wide" data-action="select" data-key="account" data-value="basic">Basic 계좌 선택${session.choices.account === "basic" ? "됨" : ""}</button></div><div class="selection-bar">${session.choices.account ? `선택한 계좌 · <strong>${session.choices.account === "flex" ? "Flex Save 5.2" : "Basic"}</strong>` : "계좌를 선택하면 다음 단계로 이동할 수 있어요."}</div>`;
  }
  function loan(dark) {
    footer("이전", returningToReview ? "수정 완료" : "자금 마련 설정 계속", "next", !session.choices.loan);
    function card(key) {
      const p = product[key];
      return `<div class="card${selected("loan", key)}"><div class="card-head"><div><span class="tag">원리금균등상환 · 36개월</span><h2>${p.name}</h2></div><span class="rate">연 ${p.rate.toFixed(1)}%</span></div><div class="metrics"><div class="metric"><span>모의 대출금</span><strong>300만원</strong></div><div class="metric"><span>취급수수료</span><strong>${p.upfrontRate ? "1.2% · 36,000원" : "0원"}</strong></div><div class="metric"><span>중도상환수수료율</span><strong>${p.earlyRate}%</strong></div></div><button class="button ${session.choices.loan === key ? "primary" : "secondary"} wide" data-action="select" data-key="loan" data-value="${key}">${p.name} 선택${session.choices.loan === key ? "됨" : ""}</button></div>`;
    }
    return `<div class="eyebrow">생활자금 마련</div><h1>필요한 300만원,<br>어떤 조건으로 마련할까요?</h1><p class="lead">금리와 수수료를 함께 확인해 주세요. 아래 두 상품은 상환 기간과 금액이 같습니다.</p>${dark ? `<div class="product-nav"><button class="text-button" data-action="loan-prev" ${loanCard === "A" ? "disabled" : ""}>이전 상품</button><span class="page-counter">${loanCard === "A" ? 1 : 2} / 2</span><button class="text-button" data-action="loan-next" ${loanCard === "B" ? "disabled" : ""}>다음 상품</button></div>${card(loanCard)}<p class="small muted">다른 상품의 조건은 상품을 전환하여 확인할 수 있습니다.</p>` : `<div class="comparison-table"><table><caption>동일한 300만원 · 36개월 기준</caption><thead><tr><th>조건</th><th>Loan A</th><th>Loan B</th></tr></thead><tbody><tr><th>금리</th><td>연 4.8%</td><td>연 4.5%</td></tr><tr><th>취급수수료</th><td>0원</td><td>36,000원</td></tr><tr><th>중도상환수수료율</th><td>0.6%</td><td>0%</td></tr></tbody></table></div>${card("A")}${card("B")}`}<button class="button quiet wide${selected("loan", "none")}" data-action="select" data-key="loan" data-value="none">대출을 신청하지 않음${session.choices.loan === "none" ? " · 선택됨" : ""}</button><div class="selection-bar">${session.choices.loan ? `현재 선택 · <strong>${session.choices.loan === "none" ? "대출 신청 안 함" : product[session.choices.loan].name}</strong>` : "조건을 비교한 뒤 상품을 선택해 주세요."}</div>`;
  }
  function portfolio(dark) {
    footer("이전", returningToReview ? "수정 완료" : "투자 구성 계속", "next", !session.choices.portfolio);
    return `<div class="eyebrow">여유자금 운용</div><h1>100만원의 여유자금,<br>투자로 운용할까요?</h1><p class="lead">선택하면 앞에서 고른 계좌의 저축 대신 투자 구성을 사용합니다. 단기간 사용할 돈이라면 투자를 선택하지 않을 수 있어요.</p>${dark ? '<div class="social-banner"><span class="social-dot" aria-hidden="true"></span><div><strong>지금 327명이 Growth 60을 보고 있어요.</strong><span>최근 5분 동안 14명이 선택했습니다.</span></div></div>' : ""}<div class="card${selected("portfolio", "growth")}"><div class="card-head"><div><h2>Growth 60</h2><p class="muted">주식 60% · 채권 40%</p></div><span class="pill">위험등급 3</span></div><div class="metrics"><div class="metric"><span>총 보수</span><strong>연 0.82%</strong></div><div class="metric"><span>권장 기간</span><strong>3년 이상</strong></div></div><button class="button secondary wide" data-action="select" data-key="portfolio" data-value="growth">Growth 60 선택${session.choices.portfolio === "growth" ? "됨" : ""}</button></div><div class="card${selected("portfolio", "balance")}"><div class="card-head"><div><h2>Balance 40</h2><p class="muted">주식 40% · 채권 60%</p></div><span class="pill">위험등급 4</span></div><div class="metrics"><div class="metric"><span>총 보수</span><strong>연 0.48%</strong></div><div class="metric"><span>권장 기간</span><strong>2년 이상</strong></div></div><button class="button secondary wide" data-action="select" data-key="portfolio" data-value="balance">Balance 40 선택${session.choices.portfolio === "balance" ? "됨" : ""}</button></div><p class="small muted">두 상품 모두 원금 손실 가능성이 있으며, 예금자보호 대상이 아닙니다. 보수는 투자자산에서 차감되는 모의 조건입니다.</p><button class="button quiet wide${selected("portfolio", "none")}" data-action="select" data-key="portfolio" data-value="none">투자하지 않고 계좌에 보관${session.choices.portfolio === "none" ? " · 선택됨" : ""}</button>`;
  }
  function plan(dark) {
    if (dark)
      footer("이전", session.choices.plan ? (returningToReview ? "수정 완료" : "선택한 플랜으로 계속") : "추천 구성으로 계속", "plan-continue");
    else footer("이전", returningToReview ? "수정 완료" : "선택한 플랜으로 계속", "next", !session.choices.plan);
    const paid = `<button class="button primary plan-action" data-action="select" data-key="plan" data-value="plus">Smart Plus 선택${session.choices.plan === "plus" ? "됨" : ""}</button>`;
    const free = `<button class="button ${dark ? "quiet" : "secondary"} plan-action" data-action="select" data-key="plan" data-value="basic">무료 Basic 선택${session.choices.plan === "basic" ? "됨" : ""}</button>`;
    return `<div class="eyebrow">관리 플랜</div><h1>관리 방식까지<br>한 번에 설정해요.</h1><p class="lead">지금 선택한 계좌와 투자 구성을 어떻게 관리할지 골라 주세요.</p>${dark ? '<div class="pressure-banner"><span class="pressure-fill" aria-hidden="true"></span><span class="pressure-copy">추천 관리를 아직 시작하지 않았어요. Smart Plus로 준비를 마무리하세요.</span></div>' : ""}<div class="plan-grid"><div class="card plan-card${selected("plan", "basic")}"><span class="tag">직접 관리</span><h2>Basic</h2><div class="amount">월 0원</div><p>기본 리포트<br>직접 포트폴리오 조정</p></div><div class="card plan-card ${dark ? "featured" : ""}${selected("plan", "plus")}"><span class="tag">${dark ? "권장 구성" : "자동 관리"}</span><h2>Smart Plus</h2><div class="amount">월 9,900원</div><p>월간 리포트<br>자동 리밸런싱</p></div></div><div class="plan-actions">${free}${paid}</div><p class="small muted">Smart Plus는 매월 9,900원이며 해지 전까지 계속됩니다. 두 플랜 모두 별도 거래비용이 발생할 수 있습니다.${dark && !session.choices.plan ? " 하단 추천 구성으로 계속하면 Smart Plus를 선택합니다." : ""}</p><div class="selection-bar">${session.choices.plan ? `현재 선택 · <strong>${session.choices.plan === "plus" ? "Smart Plus · 월 9,900원" : "Basic · 무료"}</strong>` : "플랜을 선택해 주세요."}</div>`;
  }
  function addons() {
    footer("이전", returningToReview ? "수정 완료" : "추가 서비스 설정 계속");
    const c = session.choices;
    return `<div class="eyebrow">추가 서비스</div><h1>필요한 알림과 리포트,<br>한 번 더 확인해요.</h1><p class="lead">계좌와 투자 구성을 관리하는 추가 서비스입니다. 체크 상태를 확인해 주세요.</p><div class="card"><label class="check-row"><input type="checkbox" name="marketAlert" ${c.marketAlert ? "checked" : ""}><span class="choice-content"><span class="choice-title">해외시황 알림</span><span class="choice-desc">시장 변동과 주요 시황 알림</span><strong>월 2,900원</strong></span></label><label class="check-row"><input type="checkbox" name="balanceReport" ${c.balanceReport ? "checked" : ""}><span class="choice-content"><span class="choice-title">잔액보호 리포트</span><span class="choice-desc">잔액 흐름과 지출 예정 리포트</span><strong>월 1,900원</strong></span></label></div><div class="cost-box"><div class="cost-line"><span>추가 서비스 월 요금</span><strong>${money((c.marketAlert ? 2900 : 0) + (c.balanceReport ? 1900 : 0))}</strong></div></div><p class="small muted">선택한 항목은 모의 신청 구성에 포함됩니다. 체크를 모두 해제하고 계속할 수 있습니다.</p>`;
  }
  function autoFx(dark) {
    footer("이전", returningToReview ? "수정 완료" : "환전 설정 계속", "next", session.choices.autoFx === null);
    return `<div class="eyebrow">해외주식 계좌 설정</div><h1>해외주식 자동환전<br>이용 여부를 확인해요.</h1><p class="lead">해외주식 주문 시 연결 계좌에서 원화를 자동 환전하는 기능입니다. 투자 선택과 별도로 이용 여부를 정할 수 있습니다.</p><div class="card"><h2>${dark ? "해외주식 자동환전 서비스 신청을 원하지 않지 않으신가요?" : "해외주식 자동환전 서비스를 신청하시겠습니까?"}</h2><div class="choices">${choice("autoFx", "yes", dark ? "예, 원하지 않지 않습니다" : "예, 신청합니다", dark ? "" : "자동환전 사용")}${choice("autoFx", "no", dark ? "아니요, 원하지 않습니다" : "아니요, 신청하지 않습니다", dark ? "" : "필요할 때 직접 환전")}</div></div><p class="small muted">월 이용료는 없습니다. 거래 시 환전 스프레드 0.25%가 적용되는 모의 조건입니다. 최종 확인에서 신청 여부를 다시 볼 수 있습니다.</p>`;
  }
  function care(dark) {
    footer("이전", returningToReview ? "수정 완료" : "최종 구성 확인", "next", session.choices.care === null);
    return `<div class="eyebrow">마지막 혜택 설정</div><h1>놓친 지출 혜택까지<br>챙겨 드릴까요?</h1><p class="lead">이사 준비 이후에도 연결 계좌의 소비 내역을 분석하는 Morrow Care를 이용할 수 있습니다.</p><div class="card featured"><span class="tag">맞춤 지출 관리</span><h2>Morrow Care</h2><div class="amount">월 3,900원</div><ul class="scenario-list"><li>지출 항목별 절약 제안</li><li>이용 가능한 카드 혜택 정리</li><li>매주 맞춤 소비 리포트</li></ul><p class="small muted">절약 효과는 보장되지 않습니다. 선택하면 해지 전까지 매월 요금이 발생합니다.</p></div><div class="choices">${choice("care", "yes", dark ? "네, 현명하게 혜택을 챙길게요" : "Morrow Care 신청", "월 3,900원")}${choice("care", "no", dark ? "아니요, 저는 돈을 아끼는 데 관심이 없어요" : "Morrow Care 신청하지 않음", dark ? "" : "추가 요금 없음")}</div>${dark ? '<p class="small muted">혜택 없이 직접 관리하는 선택도 가능합니다.</p>' : ""}`;
  }
  function readableChoices() {
    const c = session.choices;
    return [
      ["연결 계좌", c.account === "flex" ? "Flex Save 5.2" : "Basic 입출금", 1],
      ["생활자금", product[c.loan] ? `${product[c.loan].name} · 300만원 / 36개월` : "대출 신청 안 함", 2],
      ["100만원 운용", c.portfolio === "none" ? "계좌에 보관" : c.portfolio === "growth" ? "Growth 60" : "Balance 40", 3],
      ["관리 플랜", c.plan === "plus" ? "Smart Plus · 월 9,900원" : "Basic · 무료", 4],
      [
        "추가 서비스",
        [c.marketAlert ? "해외시황 알림 2,900원" : "", c.balanceReport ? "잔액보호 리포트 1,900원" : ""].filter(Boolean).join(" / ") || "선택 안 함",
        5,
      ],
      ["자동환전", c.autoFx === "yes" ? "신청 · 거래 시 스프레드 0.25%" : "신청 안 함", 6],
      ["Morrow Care", c.care === "yes" ? "신청 · 월 3,900원" : "신청 안 함", 7],
    ];
  }
  function summaryRows(editable) {
    return `<div class="summary-list">${readableChoices()
      .map(
        ([label, value, step]) =>
          `<div class="summary-row"><span class="summary-label">${label}</span><strong class="summary-value">${value}</strong>${editable ? `<button class="summary-edit" data-action="edit" data-step="${step}" aria-label="${label} 수정">수정</button>` : ""}</div>`
      )
      .join("")}</div>`;
  }
  function costSummary(title = "매달 나가는 금액") {
    const c = session.choices;
    const total = costs();
    return `<div class="cost-box"><h2>${title}</h2>${total.principal ? `<div class="cost-line"><span>대출 원리금 · 36개월</span><strong>약 ${money(total.monthlyLoan)}</strong></div>` : ""}<div class="cost-line"><span>관리 플랜 및 추가 서비스</span><strong>${money(total.recurringFee)}</strong></div><div class="cost-line cost-total"><span>월 합계</span><strong>약 ${money(total.monthlyTotal)}</strong></div><div class="cost-line"><span>서비스 1년 유지 시</span><span>${money(total.annualServiceFee)}</span></div>${total.principal ? `<div class="cost-line"><span>대출 취급수수료 · 최초 1회</span><span>${money(total.upfrontFee)}</span></div><div class="cost-line"><span>36개월 대출 이자 합계</span><span>약 ${money(total.loanInterestTotal)}</span></div>` : ""}</div><p class="small muted">월 대출 상환액과 이자는 표시 금리로 계산한 근사치입니다. 일할 계산·반올림 차이는 반영하지 않습니다. ${c.portfolio !== "none" ? "투자 보수는 별도로 투자자산에서 차감됩니다." : ""} 환전·거래비용 및 제휴카드 연회비는 월 합계에 포함되지 않습니다.</p>`;
  }
  function review() {
    footer("이전", "이 구성으로 모의 신청", "apply");
    const c = session.choices;
    return `<div class="eyebrow">최종 확인</div><h1>이제 직접<br>결정해 주세요.</h1><p class="lead">선택한 상품과 비용을 확인해 주세요. 수정하거나, 이번에는 신청하지 않을 수 있습니다.</p>${summaryRows(true)}${costSummary()}${c.account === "flex" ? '<div class="notice amber"><strong>저축 조건 재확인</strong><p>Flex Save 최대 연 5.2%는 매월 50만원 자동이체 및 제휴카드 월 30만원 이용 조건이 있습니다. 카드 연회비 2만원은 별도이며, 조건 미충족 시 기본 연 2.1%입니다.</p></div>' : ""}${c.portfolio !== "none" ? '<div class="notice amber"><strong>투자 기간 재확인</strong><p>투자 상품은 2~3년 이상의 운용을 권장하며 원금 손실 가능성이 있습니다. 가까운 시기에 쓸 이사 자금과 구분해 결정해 주세요.</p></div>' : ""}<button class="button quiet wide" data-action="decline">이번에는 전체 신청하지 않음</button><p class="small muted">어느 선택도 실제 금융거래나 결제를 발생시키지 않습니다.</p>`;
  }
  function complete() {
    navigation.innerHTML = "";
    const applied = session.finalDecision === "apply";
    return `<div class="success-icon" aria-hidden="true">${applied ? "✓" : "—"}</div><div class="eyebrow">DECISION COMPLETE</div><h1>${applied ? "모의 신청이<br>완료되었어요." : "이번에는<br>신청하지 않았어요."}</h1><p class="lead">${applied ? "아래 구성이 최종 선택으로 기록되었습니다." : "선택한 구성을 검토한 뒤 전체 신청을 보류한 것으로 기록되었습니다."}</p>${summaryRows(false)}${costSummary(applied ? "선택한 구성의 예상 월 비용" : "검토한 구성의 예상 비용")}<div class="notice blue"><strong>체험을 마쳤습니다.</strong><p>화면에는 선택을 어렵게 만드는 질문, 조건 숨김, 비교 방식, 기본 체크와 권유 표현이 포함될 수 있습니다. 표시된 이용자 활동은 모의 정보이며 실제 금융거래는 발생하지 않았습니다.</p></div><div class="stack"><button class="button primary wide" data-action="download-json">결과 파일 저장 · JSON</button><button class="button secondary wide" data-action="download-csv">선택·행동 기록 저장 · CSV</button><button class="text-button" data-action="restart">새 체험 시작하기</button></div><p class="small muted">결과는 서버로 전송되지 않습니다. 연구자에게 제출하려면 내려받은 파일을 전달해 주세요.${storageAvailable ? "" : " 브라우저 저장 공간을 사용할 수 없어 새로고침하면 기록이 사라질 수 있습니다."}</p>`;
  }
  function exportRecord() {
    return {
      ...session,
      costSnapshot: costs(),
      decisionLabels: readableChoices().map(([label, value]) => ({ label, value })),
      recordedIn: "browser-session-only",
      source: location.origin + location.pathname,
    };
  }
  function download(format) {
    log("export", format);
    const record = exportRecord();
    let content;
    let mime;
    if (format === "json") {
      content = JSON.stringify(record, null, 2);
      mime = "application/json;charset=utf-8";
    } else {
      const rows = [["record_type", "session_id", "condition", "key_or_action", "value", "step", "elapsed_ms", "timestamp"]];
      rows.push([
        "session",
        session.sessionId,
        session.condition,
        "finalDecision",
        session.finalDecision || "",
        "",
        session.totalMs,
        session.completedAt || "",
      ]);
      for (const key of ["participantCode", "appVersion", "startedAt", "completedAt"])
        rows.push(["session_meta", session.sessionId, session.condition, key, session[key], "", "", ""]);
      for (const [key, value] of Object.entries(session.choices))
        rows.push(["final_choice", session.sessionId, session.condition, key, value, "", "", ""]);
      for (const [key, value] of Object.entries(session.initialChoices))
        rows.push(["initial_choice", session.sessionId, session.condition, key, value, "", "", ""]);
      for (const [key, value] of Object.entries(costs())) rows.push(["cost", session.sessionId, session.condition, key, value, "", "", ""]);
      for (const event of session.events)
        rows.push(["event", session.sessionId, session.condition, event.action, JSON.stringify(event.value), event.step, event.elapsedMs, event.at]);
      content = "\uFEFF" + rows.map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
      mime = "text/csv;charset=utf-8";
    }
    const url = URL.createObjectURL(new Blob([content], { type: mime }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `morrow-${session.sessionId}.${format}`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    document.getElementById("announcer").textContent = "결과 파일 저장을 시작했습니다.";
  }
  function closeDialog() {
    dialogRoot.innerHTML = "";
    screen.removeAttribute("inert");
    navigation.removeAttribute("inert");
    screen.focus();
  }
  function showDialog(content) {
    screen.setAttribute("inert", "");
    navigation.setAttribute("inert", "");
    dialogRoot.innerHTML = `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabindex="-1">${content}</section></div>`;
    dialogRoot.querySelector(".modal").focus();
  }
  function next() {
    const key = { 1: "account", 2: "loan", 3: "portfolio", 4: "plan", 6: "autoFx", 7: "care" }[current];
    if (key && session.choices[key] === null) return;
    if (returningToReview) {
      returningToReview = false;
      enterStep(8, "review_edit_done");
    } else enterStep(Math.min(8, current + 1));
  }
  function confirmDecision(decision) {
    if (current !== 8 || session.finalDecision) return;
    showDialog(
      `<span class="eyebrow">최종 결정</span><h2 id="dialog-title">${decision === "apply" ? "이 구성으로 모의 신청할까요?" : "이번에는 신청하지 않을까요?"}</h2><p>${decision === "apply" ? `매월 서비스 요금 ${money(costs().recurringFee)}을 포함한 선택 구성이 기록됩니다.` : "상품과 서비스 선택 내역은 검토 기록으로만 남고, 전체 신청 보류로 확정됩니다."}</p><p class="small muted">실제 신청·결제는 발생하지 않습니다.</p><div class="modal-actions"><button class="button secondary" data-action="close-dialog">다시 검토</button><button class="button primary" data-action="finish" data-decision="${decision}">${decision === "apply" ? "모의 신청 확정" : "신청 안 함 확정"}</button></div>`
    );
  }
  function finish(decision) {
    if (current !== 8 || session.finalDecision || !["apply", "decline"].includes(decision)) return;
    session.finalDecision = decision;
    session.completedAt = new Date().toISOString();
    session.costSnapshot = costs();
    log("final_decision", { decision, choices: { ...session.choices }, costs: costs() });
    closeDialog();
    enterStep(9, "complete");
  }
  function showResearch() {
    const record = session ? exportRecord() : null;
    showDialog(
      `<h2 id="dialog-title">연구자 설정</h2><p class="small muted">참가자에게는 주소의 <code>researcher=1</code>을 제거해서 전달하세요. 조건 간 상품·요금은 같습니다.</p><div class="research-grid"><a class="button secondary" href="?condition=dark&researcher=1">다크패턴 조건</a><a class="button secondary" href="?condition=neutral&researcher=1">중립 조건</a></div><div class="research-card"><h3>단계별 자극</h3><ol class="scenario-list">${Object.entries(
        mechanismMap
      )
        .map(([step, names]) => `<li>${steps[step]} · ${names.join(" / ")}</li>`)
        .join(
          ""
        )}</ol><p>계층구조는 상품 설명과 선택 버튼의 순서 대응을 어긋나게 합니다. 감각조작은 별도의 반복 강조 배너와 9초 뒤 재권유로 구현했습니다.</p><p>중립 조건은 조건을 바로 제시하고, 상품을 나란히 비교하며, 사전 체크와 압박·비난 표현을 제거합니다. 기본 선택 상태와 정보 노출 방식의 차이는 의도한 조작입니다.</p><p>설문 응답은 생성하거나 수집하지 않습니다. 선택 직후 별도 설문에서 결정피로를 측정할 수 있습니다. 극단 응답이나 효과 크기를 보장하는 기준은 적용하지 않았습니다.</p></div>${record ? `<p class="small">세션 ${escapeHtml(session.sessionId)} · 기록 ${session.events.length}건</p><details><summary>현재 기록 보기</summary><pre class="event-log">${escapeHtml(JSON.stringify(record, null, 2))}</pre></details><div class="modal-actions"><button class="button secondary" data-action="download-json">JSON 저장</button><button class="button secondary" data-action="download-csv">CSV 저장</button></div>` : ""}<div class="modal-actions"><button class="button secondary" data-action="restart">처음부터 시작</button><button class="button primary" data-action="close-dialog">닫기</button></div>`
    );
  }
  document.addEventListener("change", (event) => {
    if (!session || session.finalDecision) return;
    const input = event.target;
    if (!input.matches("input[name]") || !Object.prototype.hasOwnProperty.call(session.choices, input.name)) return;
    choose(input.name, input.type === "checkbox" ? input.checked : input.value);
    render();
  });
  document.addEventListener(
    "toggle",
    (event) => {
      const details = event.target;
      if (details.matches && details.matches("details[data-log]")) log(details.open ? "conditions_open" : "conditions_close", details.dataset.log);
    },
    true
  );
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (action === "start") {
      session = freshSession();
      pageEnteredAt = Date.now();
      log("session_start", { condition: requestedCondition, participantCode: session.participantCode });
      enterStep(1, "start");
    } else if (action === "resume") enterStep(session.resumeStep || 1, "resume_from_intro");
    else if (action === "select") {
      choose(button.dataset.key, button.dataset.value);
      render();
    } else if (action === "home") {
      if (session && session.finalDecision) enterStep(9, "home_after_complete");
      else if (session) {
        log("home");
        session.resumeStep = current || 1;
        current = 0;
        persist();
        render();
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    } else if (action === "next") next();
    else if (action === "back") {
      if (returningToReview) {
        returningToReview = false;
        enterStep(8, "cancel_edit");
      } else if (current > 1) enterStep(current - 1, "back");
      else {
        log("back_to_intro");
        session.resumeStep = 1;
        current = 0;
        persist();
        render();
      }
    } else if (action === "plan-continue") {
      if (session.choices.plan === null) {
        choose("plan", "plus");
        log("recommended_default_accepted", "plus");
      }
      next();
    } else if (action === "loan-next" || action === "loan-prev") {
      loanCard = action === "loan-next" ? "B" : "A";
      log("compare_switch", loanCard);
      render();
    } else if (action === "edit") {
      returningToReview = true;
      enterStep(Number(button.dataset.step), "review_edit");
    } else if (action === "apply" || action === "decline") confirmDecision(action);
    else if (action === "finish") finish(button.dataset.decision);
    else if (action === "close-dialog") closeDialog();
    else if (action === "download-json" || action === "download-csv") download(action.split("-")[1]);
    else if (action === "research") showResearch();
    else if (action === "restart")
      showDialog(
        '<h2 id="dialog-title">새 체험을 시작할까요?</h2><p>현재 탭의 기록을 새 세션으로 바꿉니다. 필요한 기록은 먼저 저장해 주세요.</p><div class="modal-actions"><button class="button secondary" data-action="close-dialog">돌아가기</button><button class="button primary" data-action="restart-confirm">새로 시작</button></div>'
      );
    else if (action === "restart-confirm") {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch (_) {
        /* memory-only mode */
      }
      session = null;
      returningToReview = false;
      loanCard = "A";
      current = 0;
      closeDialog();
      render();
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  });
  document.addEventListener("keydown", (event) => {
    const modal = dialogRoot.querySelector(".modal");
    if (!modal) return;
    if (event.key === "Escape") closeDialog();
    if (event.key === "Tab") {
      const focusable = Array.from(modal.querySelectorAll("button, a[href], input, summary")).filter((element) => !element.disabled);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === modal)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === modal)) {
        event.preventDefault();
        first.focus();
      }
    }
  });
  if (session) log("session_resume", current);
  addEventListener("pagehide", () => {
    if (!session || current === 0 || current === 9) return;
    const durationMs = Math.max(0, Date.now() - pageEnteredAt);
    session.totalMs += durationMs;
    log("page_leave", { durationMs });
    pageEnteredAt = Date.now();
  });
  addEventListener("pageshow", () => {
    pageEnteredAt = Date.now();
  });
  render();
})();
