// ===============================
// GSAP + ScrollTrigger + Swiper (정리본)
// - Swiper loop(duplicate) 포함하여 wheel(곡선) 계산
// - Swiper 초기화 이후에 wheel 계산 시작(초기 튐 방지)
// - wheel 계산은 Swiper 이벤트 + resize + raf(선택)로 안정화
// ===============================

console.clear();
gsap.registerPlugin(ScrollTrigger);

window.addEventListener("load", () => {
  // 1) HERO 섹션 이미지 확대 및 고정(핀) 애니메이션
  gsap
    .timeline({
      scrollTrigger: {
        trigger: ".wrapper",
        start: "top top",
        end: "+=300%",
        pin: true,
        scrub: true,
        markers: false
      }
    })
    .to(".image-container > img", {
      scale: 2,
      z: 350,
      transformOrigin: "center center",
      ease: "power1.inOut"
    })
    .to(
      ".section.hero",
      {
        scale: 1.1,
        transformOrigin: "center center",
        ease: "power1.inOut"
      },
      "<"
    );

  // 2) HERO 마키 애니메이션
  gsap.to(".marquee-wrapper", {
    x: "-50%",
    ease: "none",
    duration: 20,
    repeat: -1
  });

  // 3) INTRO 텍스트 애니메이션 (블러 -> 선명)
  const introLines = gsap.utils.toArray(".intro-line");
  introLines.forEach((line) => {
    gsap.fromTo(
      line,
      { opacity: 0, y: 60, filter: "blur(6px)", scale: 0.5 },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        scale: 1.1,
        duration: 30,
        ease: "power3.out",
        scrollTrigger: {
          trigger: line,
          start: "top center",
          end: "bottom center",
          scrub: true,
          markers: false
        }
      }
    );
  });

  // 4) SECOND 섹션 텍스트 좌우 이동
  gsap.fromTo(
    ".left-text",
    { x: -600, opacity: 0 },
    {
      x: 0,
      opacity: 1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".second",
        start: "top center+=1100",
        end: "bottom center-=0",
        scrub: true
      }
    }
  );

  gsap.fromTo(
    ".right-text",
    { x: 600, opacity: 0 },
    {
      x: 0,
      opacity: 1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".second",
        start: "top center+=1100",
        end: "bottom center-=0",
        scrub: true
      }
    }
  );

  gsap.to(".head h1", {
    color: "#191919",
    scrollTrigger: {
      trigger: ".second",
      start: "top center",
      end: "bottom center",
      scrub: true,
      markers: false
    }
  });

  // 5) SECOND 섹션 배경색 전환
  gsap.to(".section.second", {
    backgroundColor: "#fff",
    ease: "none",
    scrollTrigger: {
      trigger: ".section.second",
      start: "top bottom",
      end: "top center",
      scrub: true,
      markers: false
    }
  });

  // 6) CONTACT 콘텐츠 등장 애니메이션 (한 덩어리)
  gsap.fromTo(
    ".contact-content",
    { opacity: 0, y: 50 },
    {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".section.third.contact",
        start: "top center",
        end: "center center",
        scrub: true,
        markers: false
      }
    }
  );

  // 6-1) CONTACT 내부 요소 stagger (once)
  gsap.from(".contact-content > *", {
    y: 50,
    opacity: 0,
    duration: 0.8,
    ease: "power2.out",
    stagger: 0.2,
    scrollTrigger: {
      trigger: ".section.third.contact",
      start: "top 80%",
      once: true
    }
  });

  // 7) THIRD 섹션 진입 시 body 배경 전환
  gsap.to("body", {
    backgroundColor: "#fff",
    ease: "none",
    scrollTrigger: {
      trigger: ".section.third",
      start: "top bottom",
      end: "center center",
      scrub: true,
      markers: false
    }
  });

  // 8) INTRO 지나며 원형 배경 fade out
  gsap.to(".circle-container", {
    opacity: 0,
    ease: "none",
    scrollTrigger: {
      trigger: ".section.intro",
      start: "bottom bottom",
      end: "bottom top",
      scrub: true,
      markers: false
    }
  });

  // 9) CONTACT 배경 비디오 확장
  gsap.to(".contact-bg-layer video", {
    scale: 1,
    borderRadius: "0px",
    scrollTrigger: {
      trigger: ".section.third.contact",
      start: "top 80%",
      end: "center center",
      scrub: true,
      markers: false
    }
  });

  // ===============================
  // 10) Swiper 초기화 (먼저)
  // ===============================
  const swiper = new Swiper(".swiper", {
    effect: "coverflow",
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: "auto",
    loop: true,
    spaceBetween: 120,
    coverflowEffect: {
      rotate: 0,
      stretch: 0,
      depth: 0,
      modifier: 5,
      slideShadows: false
    },
    autoplay: { delay: 3000, disableOnInteraction: false }
  });

  // ===============================
  // 11) Swiper Wheel(곡선) 계산 (duplicate 포함)
  // ===============================
  const multiplier = { translate: 0.28, rotate: 0.02 };

  function calculateWheel() {
    const wrapper = document.querySelector(".swiper");
    const { left, width } = wrapper.getBoundingClientRect();
    const centerX = left + width / 2;

    document.querySelectorAll(".single").forEach((card) => {
      const inner = card.querySelector(".single-inner");
      const rect = card.getBoundingClientRect();
      const cardCenterX = rect.left + rect.width / 2;
      const r = centerX - cardCenterX;

      let ty = Math.abs(r) * multiplier.translate - rect.width * multiplier.translate;
      if (ty < 0) ty = 0;

      card.style.transform = `translate3d(0, ${ty}px, 0)`;

      const origin = r < 0 ? "left bottom" : "right bottom";
      inner.style.transformOrigin = origin;
      inner.style.transform = `rotate(${-r * multiplier.rotate}deg)`;
    });
  }


  // Swiper가 위치를 바꿀 때마다 보정(초기/이동/루프 교체 타이밍 대응)
  swiper.on("init", calculateWheel);
  swiper.on("setTranslate", calculateWheel);
  swiper.on("slideChange", calculateWheel);
  swiper.on("resize", calculateWheel);

  // 최초 1회 즉시 계산
  calculateWheel();

  // ===============================
  // 12) raf 계속 돌릴지 선택 (성능 vs 안정성)
  // - 필요 없으면 아래 raf 블록을 통째로 주석 처리해도 됨
  // ===============================
  let rafId = null;
  const rafLoop = () => {
    rafId = requestAnimationFrame(rafLoop);
    calculateWheel();
  };
  rafLoop();

  // 페이지 이탈 시 raf 정리(안전)
  window.addEventListener("beforeunload", () => {
    if (rafId) cancelAnimationFrame(rafId);
  });
});
