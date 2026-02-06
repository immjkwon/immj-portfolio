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
    cleanupTimer = setTimeout(finish, 560);

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



})();
