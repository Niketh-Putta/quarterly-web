import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// Only enable reveal-hide styles if JS is actually running.
document.documentElement.classList.add("has-reveal");

const supabaseUrl = window.QUARTERLY_SUPABASE_URL || "YOUR_SUPABASE_URL";
const supabaseAnonKey = window.QUARTERLY_SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY";

const isConfigured =
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes("YOUR_SUPABASE_URL") &&
  !supabaseAnonKey.includes("YOUR_SUPABASE_ANON_KEY");

const client = isConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;
const forms = document.querySelectorAll(".waitlist-form");
const revealNodes = document.querySelectorAll(".reveal");
const faqTriggers = document.querySelectorAll(".faq-trigger");
const countNodes = document.querySelectorAll("[data-count]");

function setStatus(form, message, type) {
  const status = form.querySelector(".form-status");
  if (!status) {
    return;
  }

  status.textContent = message;
  status.classList.remove("success", "error");
  if (type) {
    status.classList.add(type);
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function submitWaitlist(email, source = "unknown") {
  if (!client) {
    const error = new Error("Waitlist is not configured yet. Add your Supabase keys.");
    console.error("Waitlist submission failed", error);
    return { error };
  }

  const payload = {
    email,
    source,
    user_agent: navigator.userAgent,
  };

  const { error } = await client.from("waitlist_signups").insert([payload]);

  if (error) {
    console.error("Waitlist submission failed", error);
    return { error };
  }

  console.log("Waitlist insert succeeded:", payload);
  return { data: payload };
}

async function handleWaitlistSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const emailInput = form.querySelector('input[name="email"]');
  const honeypotInput = form.querySelector('input[name="company"]');
  const submitButton = form.querySelector('button[type="submit"]');

  if (!emailInput || !submitButton) {
    return;
  }

  const email = emailInput.value.trim().toLowerCase();
  const honeypot = honeypotInput ? honeypotInput.value.trim() : "";
  const source = form.dataset.source || "unknown";
  const defaultLabel = submitButton.dataset.defaultLabel || "Start free early access";

  if (honeypot) {
    return;
  }

  if (!isValidEmail(email)) {
    setStatus(form, "Enter a valid email address.", "error");
    return;
  }

  setStatus(form, "Starting early access...", null);
  submitButton.disabled = true;
  submitButton.textContent = "Please wait...";
  let wasSuccessful = false;

  try {
    const { data, error } = await submitWaitlist(email, source);

    if (error) {
      // Unique constraint means the email is already on the waitlist.
      if (error.code === "23505") {
        setStatus(form, "You are already on the list.", "success");
        submitButton.classList.add("submitted");
        submitButton.textContent = "Already Added";
        wasSuccessful = true;
        return;
      }

      throw error;
    }

    if (data) {
      setStatus(form, "You are on the list. We will email you soon.", "success");
      submitButton.classList.add("submitted");
      submitButton.textContent = "Added OK";
      wasSuccessful = true;
      form.reset();
    }
  } catch (error) {
    setStatus(form, "Could not join right now. Please try again.", "error");
    console.error("Waitlist submission failed", error);
  } finally {
    submitButton.disabled = false;
    if (wasSuccessful) {
      window.setTimeout(() => {
        submitButton.classList.remove("submitted");
        submitButton.textContent = defaultLabel;
      }, 1200);
    } else {
      submitButton.textContent = defaultLabel;
    }
  }
}

function initReveal() {
  revealNodes.forEach((node, index) => {
    node.style.transitionDelay = `${(index % 3) * 70}ms`;
  });

  if (!("IntersectionObserver" in window)) {
    revealNodes.forEach((node) => node.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.transitionDelay = entry.target.style.transitionDelay || "0ms";
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  revealNodes.forEach((node) => observer.observe(node));
}

function animateValue(node, duration) {
  const target = Number(node.dataset.count || 0);
  if (!target) {
    return;
  }

  let startTime = null;

  function update(ts) {
    if (!startTime) {
      startTime = ts;
    }

    const progress = Math.min((ts - startTime) / duration, 1);
    const value = Math.floor(target * progress);
    node.textContent = `GBP ${value.toLocaleString("en-GB")}`;

    if (progress < 1) {
      window.requestAnimationFrame(update);
    } else {
      node.textContent = `GBP ${target.toLocaleString("en-GB")}`;
    }
  }

  window.requestAnimationFrame(update);
}

function initCounters() {
  if (!countNodes.length) {
    return;
  }

  const heroVisual = document.querySelector(".hero-visual");
  if (!heroVisual || !("IntersectionObserver" in window)) {
    countNodes.forEach((node) => animateValue(node, 900));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          heroVisual.classList.add("is-live");
          countNodes.forEach((node, idx) => {
            window.setTimeout(() => animateValue(node, 850), idx * 140);
          });
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  observer.observe(heroVisual);
}

function initFaq() {
  faqTriggers.forEach((trigger) => {
    const panel = trigger.nextElementSibling;
    if (!panel) {
      return;
    }

    trigger.addEventListener("click", () => {
      const isOpen = trigger.getAttribute("aria-expanded") === "true";

      faqTriggers.forEach((otherTrigger) => {
        const otherPanel = otherTrigger.nextElementSibling;
        otherTrigger.setAttribute("aria-expanded", "false");
        if (otherPanel) {
          otherPanel.style.maxHeight = "0px";
        }
      });

      if (!isOpen) {
        trigger.setAttribute("aria-expanded", "true");
        panel.style.maxHeight = `${panel.scrollHeight}px`;
      }
    });
  });
}

forms.forEach((form) => form.addEventListener("submit", handleWaitlistSubmit));
initReveal();
initCounters();
initFaq();
