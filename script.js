(() => {
  document.addEventListener("DOMContentLoaded", async () => {
    // JS 활성 클래스 (CSS에서 html.js .about-headline 초기상태 제어용)
    document.documentElement.classList.add("js");

    // 1) Lenis 먼저 초기화
    const lenis = initLenis();

    // 2) 네비/scroll-down 앵커를 Lenis scrollTo로 연결
    setupSmoothNav(lenis);

    // 폰트 로드 후 측정(텍스트 폭 오차 방지)
    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
    } catch (_) {}

    // 기존 hero 모션
    initHeroLines();

    // 배경 블렌드
    initBgBlend(lenis);

    // about-headline: 오른쪽 -> 제자리 1회 등장
    initAboutHeadlineReveal();
  });

  function initLenis() {
    if (!window.Lenis) return null;

    const lenis = new Lenis({
      lerp: 0.08,          // 낮을수록 더 묵직/부드러움
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

  function initHeroLines() {
    const wrap = document.querySelector(".intro-wrap");
    const lines = Array.from(document.querySelectorAll(".intro-line"));
    const traits = document.getElementById("traits");
    if (!wrap || !lines.length) return;

    // 1,3번째: 오른쪽으로 흘러오며 정지 / 2번째: 왼쪽으로 흘러오며 정지
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
      const moveDist = Math.max(140, Math.min(280, vw * 0.12));

      lines.forEach((line, i) => {
        const fill = line.querySelector(".fill");
        if (!fill) return;

        const lineRect = line.getBoundingClientRect();
        const fillRect = fill.getBoundingClientRect();

        const desktopTarget = parseFloat(line.dataset.target || "0.58");
        const targetRatio = window.innerWidth <= 780 ? 0.53 : desktopTarget;

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
          }, 1800);
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

  // ✅ 추가: about-headline 오른쪽 등장
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

  function initBgBlend(lenis) {
    const about = document.querySelector("#about");
    if (!about) return;

    const dark = [44, 44, 44];      // #2c2c2c
    const light = [237, 237, 237];  // #ededed

    const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
    const lerp = (a, b, t) => Math.round(a + (b - a) * t);

    const apply = () => {
      const vh = window.innerHeight;
      const top = about.getBoundingClientRect().top;

      // about 상단이 화면 하단 근처(85%)에서 시작 -> 상단 근처(15%)에서 라이트 완료
      const start = vh * 0.85;
      const end = vh * 0.15;

      const t = clamp((start - top) / (start - end), 0, 1);

      const r = lerp(dark[0], light[0], t);
      const g = lerp(dark[1], light[1], t);
      const b = lerp(dark[2], light[2], t);

      document.documentElement.style.setProperty("--bg-current", `${r} ${g} ${b}`);
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
})();
