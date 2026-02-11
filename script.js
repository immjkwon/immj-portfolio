(() => {
  document.addEventListener("DOMContentLoaded", async () => {
    // ------------------------------------------------------------
    // 0) JS 활성 클래스
    // ------------------------------------------------------------
    document.documentElement.classList.add("js");

    // ------------------------------------------------------------
    // 1) Lenis 초기화
    // ------------------------------------------------------------
    const lenis = initLenis();

    // ------------------------------------------------------------
    // 2) 네비/스크롤다운 앵커 스무스 스크롤 연결
    // ------------------------------------------------------------
    setupSmoothNav(lenis);

    // ------------------------------------------------------------
    // 3) 폰트 로드 후 측정 (텍스트 폭 오차 방지)
    // ------------------------------------------------------------
    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
    } catch (_) {
      // ignore
    }

    // ------------------------------------------------------------
    // 4) Hero 라인 모션
    // ------------------------------------------------------------
    initHeroLines();

    // ------------------------------------------------------------
    // 5) 스크롤 위치에 따른 배경 블렌드
    // ------------------------------------------------------------
    initBgBlend(lenis);

    // ------------------------------------------------------------
    // 6) About 헤드라인 1회 등장 모션
    // ------------------------------------------------------------
    initAboutHeadlineReveal();

    // ------------------------------------------------------------
    // 7) Impact 탭/패널/접힘 카드 동작
    // ------------------------------------------------------------
    initImpactTabs();
    // 8) Skills 리본 + 카드 리빌/부유
    initSkillsSection();
    initProjectsSection(lenis);
    initAppealMotion();
    initTopButton(lenis);
  });




  // ============================================================
  // Lenis
  // ============================================================
  function initLenis() {
    if (!window.Lenis) return null;

    const lenis = new Lenis({
      lerp: 0.08,          // 낮을수록 더 묵직/부드러움
      wheelMultiplier: 1,
      smoothWheel: true,
      autoRaf: true
    });

    // GSAP ScrollTrigger 사용 시 동기화
    if (window.ScrollTrigger) {
      lenis.on("scroll", ScrollTrigger.update);
    }

    return lenis;
  }

  function getHeaderOffset() {
    const h = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--header-h")
    );
    return Number.isFinite(h) ? h : 72;
  }

  function setupSmoothNav(lenis) {
    const links = document.querySelectorAll('.gnb a[href^="#"], .scroll-down[href^="#"]');

    links.forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        const target = document.querySelector(id);
        if (!target) return;

        e.preventDefault();

        if (lenis) {
          lenis.scrollTo(target, {
            offset: -getHeaderOffset(),
            duration: 1.1
          });
        } else {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  // ============================================================
  // Hero 라인 모션
  // ============================================================
  function initHeroLines() {
    const wrap = document.querySelector(".intro-wrap");
    const lines = Array.from(document.querySelectorAll(".intro-line"));
    const traits = document.getElementById("traits");
    if (!wrap || !lines.length) return;

    // 1,3번째: 오른쪽 -> 제자리 / 2번째: 왼쪽 -> 제자리
    const dirs = [1, -1, 1];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let played = false;
    let resizeTimer = null;
    let traitsTimer = null;

    function placeLines(withAnimation) {
      // 초기화
      lines.forEach((line) => {
        line.classList.remove("is-animated");
        line.style.animationDelay = "0s";
        line.style.opacity = "1";
        line.style.filter = "none";
        line.style.transform = "translate3d(0,0,0)";
      });

      const wrapW = wrap.clientWidth;
      const vw = window.innerWidth;
      const moveDist = Math.max(140, Math.min(280, vw * 0.12));

      lines.forEach((line, i) => {
        const fill = line.querySelector(".fill");
        if (!fill) return;

        const lineRect = line.getBoundingClientRect();
        const fillRect = fill.getBoundingClientRect();

        const desktopTarget = parseFloat(line.dataset.target || "0.58");
        const mobileTarget = [0.575, 0.575, 0.575];

        const targetRatio = window.innerWidth <= 780
          ? (mobileTarget[i] ?? 0.565)
          : desktopTarget;

        const targetX = wrapW * targetRatio;
        const fillCenterInLine =
          (fillRect.left - lineRect.left) + (fillRect.width / 2);

        let toX = targetX - fillCenterInLine;

        const pad = window.innerWidth <= 780 ? 12 : 20;
        const maxX = pad;
        const minX = wrapW - line.scrollWidth - pad;
        toX = Math.max(minX, Math.min(maxX, toX));

        const dir = dirs[i] ?? 1;
        const fromX = toX - dir * moveDist;

        line.style.setProperty("--to-x", `${toX}px`);
        line.style.setProperty("--from-x", `${fromX}px`);

        if (withAnimation && !reduceMotion) {
          line.style.animationDelay = `${0.06 + i * 0.24}s`;
          line.classList.add("is-animated");
        } else {
          line.style.transform = `translate3d(${toX}px,0,0)`;
        }
      });

      // traits 등장
      if (traits) {
        clearTimeout(traitsTimer);

        if (withAnimation && !reduceMotion) {
          traits.classList.remove("is-reveal");
          traitsTimer = setTimeout(() => {
            traits.classList.add("is-reveal");
          }, 1800);
        } else {
          if (played || reduceMotion) {
            traits.classList.add("is-reveal");
          }
        }
      }
    }

    // 1차 배치
    placeLines(false);

    // 최초 1회 애니메이션
    requestAnimationFrame(() => {
      if (!played) {
        placeLines(true);
        played = true;
      }
    });

    // 리사이즈 대응
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => placeLines(false), 140);
    });

    // bfcache 복귀 대응
    window.addEventListener("pageshow", (e) => {
      if (e.persisted) placeLines(false);
    });
  }

  // ============================================================
  // About 헤드라인 1회 등장 모션
  // ============================================================
  function initAboutHeadlineReveal() {
    const headline = document.querySelector(".about-headline");
    if (!headline) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      headline.classList.add("is-reveal");
      return;
    }

    const io = new IntersectionObserver((entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        headline.classList.add("is-reveal");
        observer.unobserve(headline); // 1회만
        break;
      }
    }, {
      threshold: 0.35,
      rootMargin: "0px 0px -8% 0px"
    });

    io.observe(headline);
  }

  // ============================================================
  // 배경 블렌드 (#about 위치 기반)
  // ============================================================
function initBgBlend(lenis) {
  const about = document.querySelector("#about");
  const impact = document.querySelector("#achievements");
  if (!about && !impact) return;

  const root = document.documentElement;

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const lerp = (a, b, t) => Math.round(a + (b - a) * t);

  const parseRgbVar = (name, fallback) => {
    const raw = getComputedStyle(root).getPropertyValue(name).trim();
    if (!raw) return fallback;
    const nums = raw.split(/\s+/).map((v) => parseInt(v, 10)).filter(Number.isFinite);
    return nums.length === 3 ? nums : fallback;
  };

  const dark = parseRgbVar("--bg-dark", [44, 44, 44]);        // #2c2c2c
  const aboutLight = parseRgbVar("--bg-light", [237, 237, 237]); // #ededed
  const impactLight = parseRgbVar("--bg-impact", [240, 240, 240]); // #f0f0f0

  const sectionProgress = (el, startRatio = 0.85, endRatio = 0.15) => {
    if (!el) return 0;
    const vh = window.innerHeight;
    const top = el.getBoundingClientRect().top;
    const start = vh * startRatio;
    const end = vh * endRatio;
    return clamp((start - top) / (start - end), 0, 1);
  };

  const apply = () => {
    const tAbout = sectionProgress(about);   // dark -> aboutLight
    const tImpact = sectionProgress(impact); // current -> impactLight

    let r = lerp(dark[0], aboutLight[0], tAbout);
    let g = lerp(dark[1], aboutLight[1], tAbout);
    let b = lerp(dark[2], aboutLight[2], tAbout);

    r = lerp(r, impactLight[0], tImpact);
    g = lerp(g, impactLight[1], tImpact);
    b = lerp(b, impactLight[2], tImpact);

    root.style.setProperty("--bg-current", `${r} ${g} ${b}`);
  };

  if (lenis && typeof lenis.on === "function") {
    lenis.on("scroll", apply);
  } else {
    window.addEventListener("scroll", apply, { passive: true });
  }

  window.addEventListener("resize", apply);
  window.addEventListener("pageshow", apply);
  apply();
}


// ============================================================
// Impact 탭/패널/접힘 카드
// ============================================================
function initImpactTabs() {
  const section = document.querySelector(".impact-section");
  if (!section) return;

  // ✅ .impact-panels 없을 때 .impact-stage로 fallback
  const panelsWrap =
    section.querySelector(".impact-panels") ||
    section.querySelector(".impact-stage");

  const tabs = Array.from(section.querySelectorAll(".impact-tab"));
  const panels = Array.from(section.querySelectorAll(".impact-panel"));
  const folds = Array.from(section.querySelectorAll(".impact-fold"));
  const tablist = section.querySelector(".impact-tabs");

  if (!tabs.length || !panels.length || !panelsWrap) return;

  let cleanupTimer = null;

  const getPanelByKey = (key) => panels.find((p) => p.dataset.key === key);

  const updateControls = (key) => {
    tabs.forEach((tab) => {
      const isOn = tab.dataset.key === key;
      tab.classList.toggle("is-active", isOn);
      tab.setAttribute("aria-selected", isOn ? "true" : "false");
      tab.tabIndex = isOn ? 0 : -1;
    });

    folds.forEach((fold) => {
      const isActive = fold.dataset.key === key;
      fold.classList.toggle("is-hidden", isActive);
      fold.setAttribute("aria-hidden", isActive ? "true" : "false");
    });
  };

  // 초기 표시(모션 없음)
  const showPanelInstant = (key) => {
    panels.forEach((panel) => {
      const isOn = panel.dataset.key === key;
      panel.hidden = !isOn;
      panel.classList.toggle("is-active", isOn);
      panel.classList.remove("is-enter");
    });
    updateControls(key);
  };

  // 높이 + 내용 진입 모션
  const showPanelAnimated = (key, focusTab = false) => {
    const currentPanel = panels.find((p) => !p.hidden) || panels.find((p) => p.classList.contains("is-active"));
    const nextPanel = getPanelByKey(key);
    if (!nextPanel) return;
    if (currentPanel === nextPanel) return;

    if (cleanupTimer) {
      clearTimeout(cleanupTimer);
      cleanupTimer = null;
    }

    const startH = currentPanel ? currentPanel.offsetHeight : panelsWrap.offsetHeight;

    // 다음 패널 준비
    nextPanel.hidden = false;
    nextPanel.classList.add("is-active", "is-enter");

    // 나머지 패널 비활성
    panels.forEach((p) => {
      if (p === nextPanel) return;
      p.hidden = true;
      p.classList.remove("is-active", "is-enter");
    });

    updateControls(key);

    // 이미지가 늦게 로드돼도 현재 프레임 기준 높이 계산
    const endH = nextPanel.offsetHeight;

    panelsWrap.style.height = `${startH}px`;
    panelsWrap.style.overflow = "hidden";

    // reflow
    panelsWrap.getBoundingClientRect();

    // ✅ transition 트리거 안정화 (RAF 2번)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        panelsWrap.style.height = `${endH}px`;
        nextPanel.classList.remove("is-enter");
      });
    });

    const finish = () => {
      panelsWrap.style.height = "";
      panelsWrap.style.overflow = "";
      panelsWrap.removeEventListener("transitionend", onEnd);
    };

    const onEnd = (e) => {
      if (e.target !== panelsWrap || e.propertyName !== "height") return;
      finish();
    };

    panelsWrap.addEventListener("transitionend", onEnd);
    cleanupTimer = setTimeout(finish, 700);

    if (focusTab) {
      const activeTab = tabs.find((t) => t.dataset.key === key);
      activeTab?.focus();
      activeTab?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest"
      });
    }
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => showPanelAnimated(tab.dataset.key));
  });

  folds.forEach((fold) => {
    fold.addEventListener("click", () => showPanelAnimated(fold.dataset.key, true));
  });

  tablist?.addEventListener("keydown", (e) => {
    const current = tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
    if (current < 0) return;

    let next = current;
    if (e.key === "ArrowRight") next = (current + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (current - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    else return;

    e.preventDefault();
    showPanelAnimated(tabs[next].dataset.key, true);
  });

  const initialKey =
    tabs.find((t) => t.classList.contains("is-active"))?.dataset.key ||
    tabs[0]?.dataset.key;

  if (initialKey) showPanelInstant(initialKey);
}


function initSkillsSection() {
  const stage = document.querySelector("#skillsStage, .skills-stage");
  if (!stage) return;

  const cards = Array.from(stage.querySelectorAll(".skill-card"));
  if (!cards.length) return;

  const path = stage.querySelector("#skillsRibbonPath, .skills-ribbon-path");
  const tracks = Array.from(stage.querySelectorAll("[data-ribbon-track]"));

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mqMobile = window.matchMedia("(max-width: 780px)");

  let cardIO = null;
  let playIO = null;
  let rafId = null;
  let resizeTimer = null;

  const timers = new Set();

  // ribbon state
  let phase = 0;
  let run = 0;
  const speed = 0.75;
  const gap = 56;

  function clearTimers() {
    timers.forEach((id) => clearTimeout(id));
    timers.clear();
  }

  function clearAll() {
    if (cardIO) { cardIO.disconnect(); cardIO = null; }
    if (playIO) { playIO.disconnect(); playIO = null; }
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    clearTimers();
  }

  function resetCards() {
    cards.forEach((card) => {
      card.classList.remove("is-inview", "is-float");
      card.dataset.revealed = "0";
    });
  }

  function getTextLen(tp) {
    const textEl = tp.closest("text");
    if (!textEl || typeof textEl.getComputedTextLength !== "function") return 0;
    return textEl.getComputedTextLength();
  }

  function measureRibbon() {
    if (!path || !tracks.length || typeof path.getTotalLength !== "function") return;
    const pathLen = path.getTotalLength();
    const maxTextLen = Math.max(...tracks.map(getTextLen), 0);
    run = Math.max(maxTextLen + gap, pathLen * 0.55);
    if (run <= 0) run = 500;
    if (phase <= -run) phase = phase % run;
  }

  function applyRibbon() {
    if (!tracks.length) return;
    tracks[0].setAttribute("startOffset", `${phase}`);
    if (tracks[1]) tracks[1].setAttribute("startOffset", `${phase + run}`);
  }

  function tickRibbon() {
    phase -= speed;
    if (phase <= -run) phase += run;
    applyRibbon();
    rafId = requestAnimationFrame(tickRibbon);
  }

  function setupRibbonDesktopOnly() {
    // 모바일 또는 reduce-motion에서는 리본 비활성
    if (reduceMotion || mqMobile.matches || !path || tracks.length === 0) return;

    measureRibbon();
    applyRibbon();

    playIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (rafId == null) rafId = requestAnimationFrame(tickRibbon);
        } else if (rafId != null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      });
    }, { threshold: 0 });

    playIO.observe(stage);
  }

  function setupCardReveal() {
    resetCards();

    if (reduceMotion) {
      cards.forEach((card) => card.classList.add("is-inview"));
      return;
    }

    cardIO = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const card = entry.target;
        if (card.dataset.revealed === "1") {
          observer.unobserve(card);
          return;
        }
        card.dataset.revealed = "1";

        const inDelayRaw = getComputedStyle(card).getPropertyValue("--in-delay").trim();
        const inDelay = Number.isFinite(parseFloat(inDelayRaw)) ? parseFloat(inDelayRaw) : 0;
        const delayMs = Math.max(0, inDelay * 1000);

        const t = setTimeout(() => {
          timers.delete(t);
          card.classList.add("is-inview");

          // PC에서만 float: 등장 애니메이션 끝난 뒤 시작
          if (!mqMobile.matches) {
            const onEnd = (e) => {
              if (e.animationName !== "skillCardIn") return;
              card.classList.add("is-float");
              card.removeEventListener("animationend", onEnd);
            };
            card.addEventListener("animationend", onEnd);
          }
        }, delayMs);
        timers.add(t);

        observer.unobserve(card);
      });
    }, {
      // 너무 일찍 시작되는 문제 방지 (화면에 들어온 뒤 시작)
      threshold: 0.2,
      rootMargin: "0px 0px -18% 0px"
    });

    cards.forEach((card) => cardIO.observe(card));
  }

  function applyMode() {
    clearAll();
    setupCardReveal();
    setupRibbonDesktopOnly();
  }

  applyMode();

  const onModeChange = () => applyMode();
  if (typeof mqMobile.addEventListener === "function") {
    mqMobile.addEventListener("change", onModeChange);
  } else {
    mqMobile.addListener(onModeChange); // Safari fallback
  }

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!mqMobile.matches) {
        measureRibbon();
        applyRibbon();
      }
    }, 120);
  }, { passive: true });

  window.addEventListener("pagehide", () => {
    if (rafId != null) cancelAnimationFrame(rafId);
    rafId = null;
    clearTimers();
  }, { once: true });
}



function initProjectsSection() {
  const section = document.querySelector("#projects.projects-section");
  if (!section) return;

  const wrap = section.querySelector("#projectsGridWrap");
  const grid = section.querySelector("#projectsGrid");
  const curve = section.querySelector("#projectsCurve");
  const moreBtn = section.querySelector("#projectsMoreBtn");

  if (!wrap || !grid || !curve || !moreBtn) return;

  const mqMobile = window.matchMedia("(max-width: 780px)");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 요구사항:
  // PC: 2~3줄 사이에 curve
  // MO: 3~4줄 사이에 curve
  const config = {
    pc: { curveAfterRows: 2, visibleRows: 2.9 },
    mo: { curveAfterRows: 3, visibleRows: 3.9 }
  };

  let expanded = false;
  let resizeTimer = null;

  function getCardHeight() {
    const card = grid.querySelector(".project-card");
    if (!card) return 0;

    let h = card.getBoundingClientRect().height;
    if (!h || h < 8) h = card.offsetHeight;
    if (!h || h < 8) h = card.offsetWidth; // aspect-ratio 보정
    return h || 0;
  }

function measure() {
  const cardH = getCardHeight();
  if (!cardH) return;

  const styles = getComputedStyle(grid);
  const rowGap = parseFloat(styles.rowGap) || parseFloat(styles.gap) || 0;

  const wrapStyles = getComputedStyle(wrap);
  const padL = parseFloat(wrapStyles.paddingLeft) || 0;
  const padR = parseFloat(wrapStyles.paddingRight) || 0;
  wrap.style.setProperty("--wrap-pad-l", `${padL}px`);
  wrap.style.setProperty("--wrap-pad-r", `${padR}px`);

  const mode = mqMobile.matches ? config.mo : config.pc;

  const curveTop =
    cardH * mode.curveAfterRows + rowGap * (mode.curveAfterRows - 1);

  const collapsedH =
    cardH * mode.visibleRows + rowGap * (Math.ceil(mode.visibleRows) - 1);

  wrap.style.setProperty("--curve-top", `${Math.round(curveTop)}px`);
  wrap.style.setProperty("--projects-collapsed-h", `${Math.round(collapsedH)}px`);

  const fillH = mqMobile.matches ? Math.round(cardH * 0.78) : 0;
  wrap.style.setProperty("--curve-fill-h", `${fillH}px`);

  if (!expanded) {
    wrap.style.maxHeight = `${Math.round(collapsedH)}px`;
  } else if (wrap.style.maxHeight !== "none") {
    wrap.style.maxHeight = `${Math.round(grid.scrollHeight)}px`;
  }
}

  function expandProjects() {
    if (expanded) return;
    expanded = true;

    moreBtn.setAttribute("aria-expanded", "true");
    moreBtn.disabled = true;

    const from = wrap.getBoundingClientRect().height;
    const to = Math.max(grid.scrollHeight, from + 1);

    wrap.style.overflow = "hidden";
    wrap.style.maxHeight = `${Math.round(from)}px`;

    requestAnimationFrame(() => {
      wrap.style.maxHeight = `${Math.round(to)}px`;
    });

    curve.classList.add("is-fadeout");

    const finish = () => {
      wrap.classList.add("is-expanded");
      wrap.style.maxHeight = "none";
      wrap.style.overflow = "visible";
      curve.hidden = true; // curve 완전 제거
    };

    if (reduceMotion) {
      finish();
      return;
    }

    let done = false;
    const onceFinish = () => {
      if (done) return;
      done = true;
      finish();
    };

    // max-height 전환 끝 or curve opacity 전환 끝 중 먼저 끝나는 시점에 마무리
    wrap.addEventListener(
      "transitionend",
      (e) => {
        if (e.propertyName === "max-height") onceFinish();
      },
      { once: true }
    );

    curve.addEventListener(
      "transitionend",
      (e) => {
        if (e.propertyName === "opacity") onceFinish();
      },
      { once: true }
    );

    // 안전 타임아웃
    setTimeout(onceFinish, 800);
  }

  moreBtn.addEventListener("click", expandProjects);

  // 이미지 로드 후 실측
  const imgs = Array.from(grid.querySelectorAll("img"));
  imgs.forEach((img) => {
    if (img.complete) return;
    img.addEventListener("load", measure, { once: true });
    img.addEventListener("error", measure, { once: true });
  });

  window.addEventListener("load", measure, { once: true });
  window.addEventListener(
    "resize",
    () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measure, 120);
    },
    { passive: true }
  );

  if (typeof mqMobile.addEventListener === "function") {
    mqMobile.addEventListener("change", measure);
  } else {
    mqMobile.addListener(measure); // Safari fallback
  }

  measure();
}





function initAppealMotion() {
  const section = document.getElementById("appeal");
  const copy = document.getElementById("appealCopy");
  const thanks = document.getElementById("appealThanks");
  if (!section || !copy) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    copy.classList.add("is-reveal");
    thanks?.classList.add("is-reveal");
    return;
  }

  const io = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      copy.classList.add("is-reveal");
      thanks?.classList.add("is-reveal");
      observer.unobserve(section); // 1회 재생
    });
  }, {
    threshold: 0.34,
    rootMargin: "0px 0px -8% 0px"
  });

  io.observe(section);
}

function initTopButton(lenis) {
  const btn = document.getElementById("toTopBtn");
  if (!btn) return;

  const SHOW_Y = 520;

  const setVisible = (y) => {
    btn.classList.toggle("is-visible", y > SHOW_Y);
  };

  const getWindowY = () =>
    window.scrollY || document.documentElement.scrollTop || 0;

  if (lenis && typeof lenis.on === "function") {
    lenis.on("scroll", (evt) => {
      const y = (typeof evt === "number")
        ? evt
        : (evt && typeof evt.scroll === "number")
          ? evt.scroll
          : getWindowY();
      setVisible(y);
    });
  } else {
    window.addEventListener("scroll", () => setVisible(getWindowY()), { passive: true });
  }

  setVisible(getWindowY());

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    if (lenis && typeof lenis.scrollTo === "function") {
      lenis.scrollTo(0, { duration: 1.0 });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
}



/* ===== to-top: PC에서 footer 위까지만 ===== */
(function () {
  const toTop = document.querySelector('.to-top');
  const footer = document.querySelector('.site-footer');
  if (!toTop || !footer) return;

  const desktopMQ = window.matchMedia('(min-width: 781px)');
  const FOOTER_GAP = 12; // footer와 버튼 사이 간격

  function updateToTopDock() {
    if (!desktopMQ.matches) {
      toTop.style.setProperty('--footer-lift', '0px');
      return;
    }

    const footerTop = footer.getBoundingClientRect().top;
    const bottom = parseFloat(getComputedStyle(toTop).bottom) || 24;

    // 버튼 하단이 footer 상단과 겹치기 시작하면 위로 lift
    const lift = Math.max(
      0,
      window.innerHeight - bottom - footerTop + FOOTER_GAP
    );

    toTop.style.setProperty('--footer-lift', `${Math.round(lift)}px`);
  }

  window.addEventListener('scroll', updateToTopDock, { passive: true });
  window.addEventListener('resize', updateToTopDock);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateToTopDock);
  }

  updateToTopDock();
})();


})();
