
(() => {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  // Footer year
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  // Active primary navigation
  const currentPage = document.body.dataset.page;
  $$(".main-nav a").forEach(link => {
    const active = link.dataset.page === currentPage;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  // Theme
  const themeButton = $(".theme-toggle");

  const currentTheme = () =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light";

  const setTheme = theme => {
    if (theme === "dark") {
      document.documentElement.dataset.theme = "dark";
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    themeButton?.setAttribute("aria-pressed", String(theme === "dark"));
    try {
      localStorage.setItem("theme", theme);
    } catch (_) {}
  };

  if (themeButton) {
    themeButton.setAttribute("aria-pressed", String(currentTheme() === "dark"));
    themeButton.addEventListener("click", () => {
      setTheme(currentTheme() === "dark" ? "light" : "dark");
    });
  }

  // Mobile navigation
  const menuButton = $(".menu-toggle");
  const nav = $(".main-nav");
  const backdrop = $(".mobile-nav-backdrop");

  const setMenu = open => {
    nav?.classList.toggle("open", open);
    backdrop?.classList.toggle("visible", open);
    menuButton?.setAttribute("aria-expanded", String(open));
    menuButton?.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    document.body.classList.toggle("nav-open", open);
  };

  menuButton?.addEventListener("click", () => {
    setMenu(!nav?.classList.contains("open"));
  });

  backdrop?.addEventListener("click", () => setMenu(false));
  nav?.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => {
      // Close visual menu only; do not prevent the link's native navigation.
      setMenu(false);
    });
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") setMenu(false);
  });

  // Scroll reveal
  const revealElements = $$(".reveal");
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.09 });
    revealElements.forEach(el => observer.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add("visible"));
  }

  // Scroll UI
  const progress = $(".scroll-progress span");
  const backToTop = $(".back-to-top");
  const header = $(".site-header");

  const updateScrollUI = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const percent = max > 0 ? Math.min(100, Math.max(0, (scrollY / max) * 100)) : 0;
    if (progress) progress.style.width = `${percent}%`;
    backToTop?.classList.toggle("visible", scrollY > 600);
    header?.classList.toggle("scrolled", scrollY > 24);
  };

  addEventListener("scroll", updateScrollUI, { passive: true });
  updateScrollUI();

  backToTop?.addEventListener("click", () => {
    scrollTo({ top: 0, behavior: "smooth" });
  });

  // Fine-pointer profile parallax
  const photoPanel = $(".hero-photo-panel");
  if (
    photoPanel &&
    matchMedia("(pointer:fine)").matches &&
    !matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    photoPanel.addEventListener("pointermove", event => {
      const rect = photoPanel.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 6;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 6;
      photoPanel.style.transform =
        `perspective(950px) rotateY(${x}deg) rotateX(${-y}deg)`;
    });
    photoPanel.addEventListener("pointerleave", () => {
      photoPanel.style.transform = "";
    });
  }

  // Card spotlight
  $$(".research-tile,.skill-panel,.contact-card").forEach(card => {
    card.addEventListener("pointermove", event => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      card.style.setProperty("--my", `${event.clientY - rect.top}px`);
    });
  });

  // Research sub-navigation
  const researchLinks = $$('.research-subnav a[href^="#"]');
  if (researchLinks.length) {
    const sections = researchLinks
      .map(a => $(a.getAttribute("href")))
      .filter(Boolean);

    const updateResearchNav = () => {
      let current = "";
      const offset = scrollY + 125;
      sections.forEach(section => {
        if (section.offsetTop <= offset) current = section.id;
      });
      researchLinks.forEach(a => {
        a.classList.toggle(
          "subnav-active",
          a.getAttribute("href") === `#${current}`
        );
      });
    };

    addEventListener("scroll", updateResearchNav, { passive: true });
    updateResearchNav();
  }

  // Publications filter
  const filterButtons = $$(".publication-tools .filter-btn");
  const publicationEntries = $$(".publication-entry[data-type]");

  filterButtons.forEach(button => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      filterButtons.forEach(b => b.classList.toggle("active", b === button));
      publicationEntries.forEach(entry => {
        entry.classList.toggle(
          "filtered-out",
          filter !== "all" && entry.dataset.type !== filter
        );
      });
    });
  });

  // Clipboard helper with fallback
  const copyText = async text => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    let successful = false;
    try {
      successful = document.execCommand("copy");
    } finally {
      textarea.remove();
    }
    return successful;
  };

  // Copy citations
  $$(".copy-citation").forEach(button => {
    button.addEventListener("click", async () => {
      const citation = button.dataset.citation || "";
      const original = button.textContent.trim();

      try {
        const ok = await copyText(citation);
        if (!ok) throw new Error("copy failed");
        button.textContent = "Copied";
        button.classList.add("copied");
      } catch (_) {
        button.textContent = "Copy failed";
      }

      setTimeout(() => {
        button.textContent = original;
        button.classList.remove("copied");
      }, 1500);
    });
  });

  // Copy university email
  $$("[data-copy-email]").forEach(button => {
    button.addEventListener("click", async () => {
      const email = button.dataset.copyEmail || "";
      const original = button.textContent.trim();

      try {
        const ok = await copyText(email);
        if (!ok) throw new Error("copy failed");
        button.textContent = "Copied";
        button.classList.add("copied");
        setTimeout(() => {
          button.textContent = original;
          button.classList.remove("copied");
        }, 1500);
      } catch (_) {
        location.href = `mailto:${email}`;
      }
    });
  });

  // Internal page transition
  // Keep primary navigation native, especially on touch/Safari.
  // Native navigation is more reliable than intercepting menu-link clicks.
  $$('a[href$=".html"],a[href="index.html"]').forEach(link => {
    link.addEventListener("click", event => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        link.target === "_blank" ||
        link.closest(".main-nav") ||
        matchMedia("(max-width:760px)").matches
      ) return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      event.preventDefault();
      document.body.classList.add("is-leaving");
      setTimeout(() => { location.href = href; }, 130);
    });
  });
})();


// V29 subtle pointer parallax for scientific backdrop
(() => {
  const hero = document.querySelector('.hero-v29');
  const bg = document.querySelector('.hero-science-bg');

  if (
    !hero || !bg ||
    !matchMedia('(pointer:fine)').matches ||
    matchMedia('(prefers-reduced-motion:reduce)').matches
  ) return;

  let raf = null;

  hero.addEventListener('pointermove', event => {
    const rect = hero.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - .5) * 12;
    const y = ((event.clientY - rect.top) / rect.height - .5) * 8;

    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      bg.style.transform = `translate3d(${x}px,${y}px,0)`;
    });
  });

  hero.addEventListener('pointerleave', () => {
    if (raf) cancelAnimationFrame(raf);
    bg.style.transform = '';
  });
})();

// V29 section progress micro-accent on long pages
(() => {
  const sections = [...document.querySelectorAll('main > section')];
  if (sections.length < 3) return;

  const update = () => {
    const y = scrollY + innerHeight * .42;
    sections.forEach(section => {
      const active =
        y >= section.offsetTop &&
        y < section.offsetTop + section.offsetHeight;
      section.classList.toggle('section-in-view', active);
    });
  };

  addEventListener('scroll', update, {passive:true});
  update();
})();


// V33 remote research/institution image fallbacks.
// Keeps the site visually complete if an external academic image host is unavailable.
document.querySelectorAll('.remote-site-image').forEach(img => {
  const markFailed = () => {
    const frame = img.closest('.institution-media-image,.paper-figure-frame');
    if (frame) frame.classList.add('image-failed');
  };

  img.addEventListener('error', markFailed, {once:true});

  // Covers images that already failed before the listener attached.
  if (img.complete && img.naturalWidth === 0) markFailed();
});


// V36 — subtle depth on affiliation visuals for fine pointers only.
(() => {
  if (
    !matchMedia('(pointer:fine)').matches ||
    matchMedia('(prefers-reduced-motion:reduce)').matches
  ) return;

  document.querySelectorAll('.visual-ribbon-card').forEach(card => {
    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - .5) * 3.4;
      const y = ((event.clientY - rect.top) / rect.height - .5) * 2.8;
      card.style.transform =
        `perspective(750px) rotateY(${x}deg) rotateX(${-y}deg) translateY(-2px)`;
    });

    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });
})();


// V38 publication visual fallback.
document.querySelectorAll('.publication-figure-stage .remote-site-image').forEach(img => {
  const fail = () => img.closest('.publication-figure-stage')?.classList.add('image-failed');
  img.addEventListener('error', fail, { once: true });
  if (img.complete && img.naturalWidth === 0) fail();
});


// V42 featured publication image fallback.
document.querySelectorAll('.feature-paper-image-v42 .remote-site-image').forEach(img => {
  const fail = () => img.closest('.feature-paper-image-v42')?.classList.add('image-failed');
  img.addEventListener('error', fail, {once:true});
  if (img.complete && img.naturalWidth === 0) fail();
});


// V45 research publication figure fallback.
document.querySelectorAll('.research-paper-frame-v45 .remote-site-image').forEach(img => {
  const fail = () => img.closest('.research-paper-frame-v45')?.classList.add('image-failed');
  img.addEventListener('error', fail, {once:true});
  if (img.complete && img.naturalWidth === 0) fail();
});
