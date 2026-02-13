/* =========================
   script.js
   ========================= */
(() => {
  document.addEventListener("DOMContentLoaded", async () => {
    document.documentElement.classList.add("js");

    const lenis = initLenis();

    setupSmoothNav(lenis);
    preventDummyProjectLinks();

    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
    } catch (_) {
      // ignore
    }

    initHeroLines();
    initBgBlend(lenis);
    initTitleReveal();
    initImpactTabs();
    initImpactCounters();
    initSkillsSection();
    initProjectsSection();
    initAppealMotion();
    initTopButton(lenis);
  });

  /* ============================================================
     Lenis
  ============================================================ */
  function initLenis() {
    if (!window.Lenis) return null;

    const lenis = new Lenis({
      lerp: 0.08,
      wheelMultiplier: 1,
      smoothWheel: true,
      autoRaf: true
    });

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
    const links = document.querySelectorAll(
      '.gnb a[href^="#"], .scroll-down[href^="#"], .brand[href^="#"]'
    );

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

  function preventDummyProjectLinks() {
    const dummies = document.querySelectorAll('.project-card[href="#"]');
    dummies.forEach((a) => {
      a.setAttribute("aria-disabled", "true");
      a.addEventListener("click", (e) => e.preventDefault());
    });
  }

  /* ============================================================
     Hero 라인 모션
  ============================================================ */
  function initHeroLines() {
    const wrap = document.querySelector(".intro-wrap");
    const lines = Array.from(document.querySelectorAll(".intro-line"));
    const traits = document.getElementById("traits");
    if (!wrap || !lines.length) return;

    const dirs = [1, -1, 1];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let played = false;
    let resizeTimer = null;
    let traitsTimer = null;

    function placeLines(withAnimation) {
      lines.forEach((line) => {
        line.classList.remove("is-animated");
        line.style.animationDelay = "0s";
        line.style.opacity = "1";
        line.style.filter = "none";
        line.style.transform = "translate3d(0,0,0)";
      });

      const wrapW = wrap.clientWidth;
      const vw = window.innerWidth;
      const isMobile = vw <= 780;

      // 이동 거리 확대 (기존: 140~280 / vw*0.12)
      const moveDist = isMobile
        ? Math.max(190, Math.min(340, vw * 0.22))
        : Math.max(240, Math.min(440, vw * 0.18));

      lines.forEach((line, i) => {
        const fill = line.querySelector(".fill");
        if (!fill) return;

        const lineRect = line.getBoundingClientRect();
        const fillRect = fill.getBoundingClientRect();

        const desktopTarget = parseFloat(line.dataset.target || "0.58");
        const mobileTarget = [0.575, 0.575, 0.575];
        const targetRatio =
          window.innerWidth <= 780
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

      if (traits) {
        clearTimeout(traitsTimer);

        if (withAnimation && !reduceMotion) {
          traits.classList.remove("is-reveal");
          traitsTimer = setTimeout(() => {
            traits.classList.add("is-reveal");
          }, 1250);
        } else {
          if (played || reduceMotion) {
            traits.classList.add("is-reveal");
          }
        }
      }
    }

    placeLines(false);

    requestAnimationFrame(() => {
      if (!played) {
        placeLines(true);
        played = true;
      }
    });

    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => placeLines(false), 140);
    });

    window.addEventListener("pageshow", (e) => {
      if (e.persisted) placeLines(false);
    });
  }

  /* ============================================================
    공통 타이틀 1회 등장 (about / impact / skills / projects)
  ============================================================ */
  function initTitleReveal() {
    const targets = Array.from(document.querySelectorAll(".title-reveal"));
    if (!targets.length) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      targets.forEach((el) => el.classList.add("is-reveal"));
      return;
    }

    const io = new IntersectionObserver((entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-reveal");
        observer.unobserve(entry.target); // 1회만 실행
      }
    }, {
      threshold: 0.35,
      rootMargin: "0px 0px -8% 0px"
    });

    targets.forEach((el) => io.observe(el));
  }


  /* ============================================================
     배경 블렌드 (#about / #achievements)
  ============================================================ */
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
      const nums = raw
        .split(/\s+/)
        .map((v) => parseInt(v, 10))
        .filter(Number.isFinite);
      return nums.length === 3 ? nums : fallback;
    };

    const dark = parseRgbVar("--bg-dark", [44, 44, 44]);
    const aboutLight = parseRgbVar("--bg-light", [255, 255, 255]);
    const impactLight = parseRgbVar("--bg-impact", [240, 240, 240]);

    const sectionProgress = (el, startRatio = 0.85, endRatio = 0.15) => {
      if (!el) return 0;
      const vh = window.innerHeight;
      const top = el.getBoundingClientRect().top;
      const start = vh * startRatio;
      const end = vh * endRatio;
      return clamp((start - top) / (start - end), 0, 1);
    };

    const apply = () => {
      const tAbout = sectionProgress(about);
      const tImpact = sectionProgress(impact);

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

  /* ============================================================
     Impact tabs / panels / folds
  ============================================================ */
  function initImpactTabs() {
    const section = document.querySelector(".impact-section");
    if (!section) return;

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

    const showPanelInstant = (key) => {
      panels.forEach((panel) => {
        const isOn = panel.dataset.key === key;
        panel.hidden = !isOn;
        panel.classList.toggle("is-active", isOn);
        panel.classList.remove("is-enter");
      });
      updateControls(key);
    };

    const showPanelAnimated = (key, focusTab = false) => {
      const currentPanel =
        panels.find((p) => !p.hidden) || panels.find((p) => p.classList.contains("is-active"));
      const nextPanel = getPanelByKey(key);
      if (!nextPanel || currentPanel === nextPanel) return;

      if (cleanupTimer) {
        clearTimeout(cleanupTimer);
        cleanupTimer = null;
      }

      const startH = currentPanel ? currentPanel.offsetHeight : panelsWrap.offsetHeight;

      nextPanel.hidden = false;
      nextPanel.classList.add("is-active", "is-enter");

      panels.forEach((p) => {
        if (p === nextPanel) return;
        p.hidden = true;
        p.classList.remove("is-active", "is-enter");
      });

      updateControls(key);

      const endH = nextPanel.offsetHeight;

      panelsWrap.style.height = `${startH}px`;
      panelsWrap.style.overflow = "hidden";
      panelsWrap.getBoundingClientRect(); // reflow

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
      tabs.find((t) => t.classList.contains("is-active"))?.dataset.key || tabs[0]?.dataset.key;

    if (initialKey) showPanelInstant(initialKey);
  }



/* ============================================================
   Impact PANEL 1 숫자 카운트 모션
============================================================ */
function initImpactCounters() {
  const section = document.getElementById("achievements");
  const panelIlly = document.getElementById("impact-panel-illy");
  if (!section || !panelIlly) return;

  const counters = Array.from(panelIlly.querySelectorAll("[data-counter]"));
  if (!counters.length) return;

  const triggerEl = counters[0]; // 첫 카운터를 트리거 기준으로 사용
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mqMobile = window.matchMedia("(max-width: 780px)");
  const DURATION = 1600;

  let rafId = null;
  let startTimer = null;
  let isAnimating = false;
  let hasPlayedForCurrentShow = false;
  let io = null;

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  function render(progress) {
    counters.forEach((el) => {
      const from = Number(el.dataset.from ?? 0);
      const to = Number(el.dataset.to ?? 0);
      const suffix = el.dataset.suffix ?? "";
      const value = Math.round(from + (to - from) * progress);
      el.textContent = `${value}${suffix}`;
    });
  }

  function cancelRun() {
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (startTimer != null) {
      clearTimeout(startTimer);
      startTimer = null;
    }
    isAnimating = false;
  }

  function isPanelActive() {
    return !panelIlly.hidden;
  }

  function getRule() {
    // 모바일/PC 각각 threshold 및 가시 조건 분기
    if (mqMobile.matches) {
      return {
        threshold: 0.32,
        rootMargin: "0px 0px -4% 0px",
        topIn: 0.94,
        bottomIn: 0.02,
        tabDelay: 220
      };
    }
    return {
      threshold: 0.55,
      rootMargin: "0px 0px -10% 0px",
      topIn: 0.88,
      bottomIn: 0.15,
      tabDelay: 280
    };
  }

  function isCounterVisible() {
    if (!isPanelActive()) return false;
    const rect = triggerEl.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const rule = getRule();

    return rect.top <= vh * rule.topIn && rect.bottom >= vh * rule.bottomIn;
  }

  function run() {
    if (isAnimating) return;
    if (!isPanelActive()) return;
    if (!isCounterVisible()) return;

    hasPlayedForCurrentShow = true;

    if (reduceMotion) {
      render(1);
      return;
    }

    isAnimating = true;
    const startAt = performance.now();

    const tick = (now) => {
      const raw = Math.min(1, (now - startAt) / DURATION);
      render(easeOutCubic(raw));

      if (raw < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = null;
        isAnimating = false;
      }
    };

    rafId = requestAnimationFrame(tick);
  }

  function scheduleRun(delay) {
    if (!isPanelActive()) return;
    if (hasPlayedForCurrentShow || isAnimating) return;

    if (startTimer != null) clearTimeout(startTimer);
    startTimer = setTimeout(() => {
      startTimer = null;
      run();
    }, delay);
  }

  function resetForReplay() {
    cancelRun();
    hasPlayedForCurrentShow = false;
    render(0); // 다음 진입 때 0/10부터 다시 시작
  }

  function buildObserver() {
    if (io) io.disconnect();

    const rule = getRule();
    io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        if (!hasPlayedForCurrentShow) run();
      },
      {
        threshold: rule.threshold,
        rootMargin: rule.rootMargin
      }
    );

    io.observe(triggerEl);
  }

  // 초기값 고정 (0%, 10일)
  render(0);

  // Observer 세팅 (모바일/PC 분기 적용)
  buildObserver();

  // 브레이크포인트 변경 시 Observer 재생성
  const onMqChange = () => {
    buildObserver();
    // 현재 일리 패널이 열려 있고 아직 재생 안됐으면 즉시 시도
    if (isPanelActive() && !hasPlayedForCurrentShow) {
      scheduleRun(0);
    }
  };
  if (typeof mqMobile.addEventListener === "function") {
    mqMobile.addEventListener("change", onMqChange);
  } else {
    mqMobile.addListener(onMqChange);
  }

  // 탭/폴드 클릭으로 일리 복귀 시마다 재생
  section.addEventListener("click", (e) => {
    const trigger = e.target.closest(
      '.impact-tab[data-key="illy"], .impact-fold[data-key="illy"]'
    );
    if (!trigger) return;

    resetForReplay();
    scheduleRun(getRule().tabDelay); // 패널 전환 애니메이션 뒤 실행
  });

  // hidden 토글(키보드 전환 포함) 감지
  const mo = new MutationObserver(() => {
    if (panelIlly.hidden) {
      // 일리에서 벗어나면 다음 복귀를 위해 리셋
      resetForReplay();
      return;
    }
    // 일리로 다시 열리면 재생 준비
    resetForReplay();
    scheduleRun(getRule().tabDelay);
  });
  mo.observe(panelIlly, { attributes: true, attributeFilter: ["hidden"] });

  // 초기 진입/뒤로가기 캐시 복원 대응
  window.addEventListener("load", () => {
    if (isPanelActive()) scheduleRun(0);
  });
  window.addEventListener("pageshow", () => {
    if (isPanelActive()) {
      resetForReplay();
      scheduleRun(0);
    }
  });

  // 정리
  window.addEventListener(
    "pagehide",
    () => {
      cancelRun();
      if (io) io.disconnect();
      mo.disconnect();
    },
    { once: true }
  );
}





  /* ============================================================
     Skills ribbon + cards
  ============================================================ */
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

    let phase = 0;
    let run = 0;
    const speed = 0.75;
    const gap = 56;

    function clearTimers() {
      timers.forEach((id) => clearTimeout(id));
      timers.clear();
    }

    function clearAll() {
      if (cardIO) {
        cardIO.disconnect();
        cardIO = null;
      }
      if (playIO) {
        playIO.disconnect();
        playIO = null;
      }
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
      mqMobile.addListener(onModeChange);
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

  /* ============================================================
     Projects curve / expand
  ============================================================ */
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

    // PC: 2~3줄 사이 / MO: 3~4줄 사이
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
      if (!h || h < 8) h = card.offsetWidth;
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
        curve.hidden = true;
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

      wrap.addEventListener("transitionend", (e) => {
        if (e.propertyName === "max-height") onceFinish();
      }, { once: true });

      curve.addEventListener("transitionend", (e) => {
        if (e.propertyName === "opacity") onceFinish();
      }, { once: true });

      setTimeout(onceFinish, 800);
    }

    moreBtn.addEventListener("click", expandProjects);

    const imgs = Array.from(grid.querySelectorAll("img"));
    imgs.forEach((img) => {
      if (img.complete) return;
      img.addEventListener("load", measure, { once: true });
      img.addEventListener("error", measure, { once: true });
    });

    window.addEventListener("load", measure, { once: true });
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measure, 120);
    }, { passive: true });

    if (typeof mqMobile.addEventListener === "function") {
      mqMobile.addEventListener("change", measure);
    } else {
      mqMobile.addListener(measure);
    }

    measure();
  }

  /* ============================================================
     Appeal reveal
  ============================================================ */
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
        observer.unobserve(section);
      });
    }, {
      threshold: 0.34,
      rootMargin: "0px 0px -8% 0px"
    });

    io.observe(section);
  }

  /* ============================================================
     To Top + Footer docking
  ============================================================ */
  function initTopButton(lenis) {
    const btn = document.getElementById("toTopBtn");
    const footer = document.querySelector(".site-footer");
    if (!btn) return;

    const SHOW_Y = 520;
    const FOOTER_GAP = 12;
    const desktopMQ = window.matchMedia("(min-width: 781px)");

    const getWindowY = () =>
      window.scrollY || document.documentElement.scrollTop || 0;

    const setVisible = (y) => {
      btn.classList.toggle("is-visible", y > SHOW_Y);
    };

    const updateDock = () => {
      if (!footer || !desktopMQ.matches) {
        btn.style.setProperty("--footer-lift", "0px");
        return;
      }

      const footerTop = footer.getBoundingClientRect().top;
      const bottom = parseFloat(getComputedStyle(btn).bottom) || 24;

      const lift = Math.max(
        0,
        window.innerHeight - bottom - footerTop + FOOTER_GAP
      );

      btn.style.setProperty("--footer-lift", `${Math.round(lift)}px`);
    };

    if (lenis && typeof lenis.on === "function") {
      lenis.on("scroll", (evt) => {
        const y = (typeof evt === "number")
          ? evt
          : (evt && typeof evt.scroll === "number")
            ? evt.scroll
            : getWindowY();

        setVisible(y);
        updateDock();
      });
    } else {
      window.addEventListener("scroll", () => {
        setVisible(getWindowY());
        updateDock();
      }, { passive: true });
    }

    setVisible(getWindowY());
    updateDock();

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (lenis && typeof lenis.scrollTo === "function") {
        lenis.scrollTo(0, { duration: 1.0 });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });

    window.addEventListener("resize", updateDock);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateDock);
    }
    window.addEventListener("pageshow", updateDock);
  }
})();
