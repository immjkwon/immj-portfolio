console.clear();
gsap.registerPlugin(ScrollTrigger);

window.addEventListener("load", () => {
  // 1. Hero 섹션 이미지 확대 및 고정 애니메이션
  gsap.timeline({
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
  .to(".section.hero", {
    scale: 1.1,
    transformOrigin: "center center",
    ease: "power1.inOut"
  }, "<");

  // 2. Hero 마키 애니메이션
  gsap.to(".marquee-wrapper", {
    x: "-50%",
    ease: "none",
    duration: 20,
    repeat: -1
  });

  // 3. Intro 텍스트 애니메이션 (블러에서 선명하게)
  const introLines = gsap.utils.toArray(".intro-line");
  introLines.forEach((line) => {
    gsap.fromTo(line,
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

  // 4. Swiper 슬라이드 휠 회전 효과
  const multiplier = { translate: 0.2, rotate: 0.02 };
  function calculateWheel() {
  const wrapper = document.querySelector('.swiper');
  const { left: wrapLeft, width: wrapWidth } = wrapper.getBoundingClientRect();
  const centerX = wrapLeft + wrapWidth / 2;    // 실제 컨테이너 중앙 기준

  document.querySelectorAll('.single').forEach(slide => {
    const parentSlide = slide.closest('.swiper-slide');
   

    const rect = slide.getBoundingClientRect();
    const slideCenterX = rect.left + rect.width / 2;
    const r = centerX - slideCenterX;
    let ty = Math.abs(r) * multiplier.translate - rect.width * multiplier.translate;
    if (ty < 0) ty = 0;

    // 회전축도 양쪽 맞게 설정
    const origin = r < 0 ? 'left top' : 'right top';
    slide.style.transformOrigin = origin;
    slide.style.transform = `translate(0, ${ty}px) rotate(${-r * multiplier.rotate}deg)`;
  });
}
  function raf() { requestAnimationFrame(raf); calculateWheel(); }
  raf();

  // 5. Second 섹션 텍스트 좌우 이동 및 색상 변경 (적절한 시점 고정)
// Work 텍스트
gsap.fromTo(".left-text", 
  { x: -600, opacity: 0 }, 
  { 
    x: 0, opacity: 1, ease: "power2.out",
    scrollTrigger: { 
      trigger: ".second", 
      start: "top center+=1100", 
      end: "bottom center-=0", // 천천히 멈추도록 범위 확보
      scrub: true 
    }
  }
);

  // experience 텍스트
  gsap.fromTo(".right-text", 
    { x: 600, opacity: 0 }, 
    { 
      x: 0, opacity: 1, ease: "power2.out",
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

  // 6. Second 섹션 배경색 전환
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

  // 7. Contact 콘텐츠 등장 애니메이션
  gsap.fromTo(".contact-content", 
    { opacity: 0, y: 50 }, 
    { opacity: 1, y: 0, duration: 1,
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
  gsap.fromTo(".contact-content h2", 
    { opacity: 0, y: 50 }, 
    { opacity: 1, y: 0, duration: 1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".section.third.contact",
        start: "top center",
        end: "center center",
        scrub: true
      }
    }
  );
  gsap.fromTo(".contact-content p", 
    { opacity: 0, y: 50 }, 
    { opacity: 1, y: 0, duration: 1, delay: 0.2,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".section.third.contact",
        start: "top center",
        end: "center center",
        scrub: true
      }
    }
  );

  // 8. Third 섹션 배경색 및 원 fade out
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

  // 9. 영상 가로 확장 애니메이션
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

  // 10. Swiper 초기화
  new Swiper('.swiper', {
    effect: 'coverflow',
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: 'auto',
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
});
gsap.from(".contact-content > *", {
y: 50,
opacity: 0,
duration: 0.8,
ease: "power2.out",
stagger: 0.2,
scrollTrigger: {
trigger: ".section.third.contact",
start: "top 80%",
once: true        // 한 번만 실행
}
});
