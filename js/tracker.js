const EMAILJS_PUBLIC_KEY = "1uFAMnYwu-_Ar6JZP";
const EMAILJS_SERVICE_ID = "service_h9u7yxt";
const EMAILJS_TEMPLATE_ID = "template_252m5he";

// ═══════════════════════════════════════════════
//  💀 CREEPY DATA COLLECTOR  — tracker.js
//  Drop this in your <head> AFTER emailjs loads
// ═══════════════════════════════════════════════

(async function () {
  // ── Guard: only fire once per session ────────
  if (sessionStorage.getItem("notified")) {
    console.log("💌 tracker: already notified this session, skipping");
    return;
  }

  // ── Guard: EmailJS must be available ─────────
  if (typeof emailjs === "undefined") {
    console.error(
      "💌 tracker: EmailJS not loaded — check your script tag order",
    );
    return;
  }

  // ── Guard: credentials must be filled in ─────
  if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID) {
    console.warn("💌 tracker: EmailJS credentials not set.");
    return;
  }

  emailjs.init(EMAILJS_PUBLIC_KEY);

  // ── Utility: safe wrapper — never throws ─────
  function safe(fn, fallback = "unavailable") {
    try {
      const result = fn();
      return result ?? fallback;
    } catch (e) {
      console.debug("💌 tracker [safe]:", e.message);
      return fallback;
    }
  }

  // ── Utility: fetch with timeout ───────────────
  async function fetchWithTimeout(url, ms = 5000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  // ── Utility: send with retry ──────────────────
  async function sendWithRetry(payload, attempts = 3, delayMs = 1500) {
    for (let i = 1; i <= attempts; i++) {
      try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, payload);
        return true;
      } catch (err) {
        const isLast = i === attempts;
        console.warn(
          `💌 tracker: send attempt ${i}/${attempts} failed —`,
          err?.text ?? err,
        );
        if (!isLast) await new Promise((r) => setTimeout(r, delayMs * i)); // back-off
      }
    }
    return false;
  }

  // ═══════════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════════

  function canvasFingerprint() {
    return safe(() => {
      const c = document.createElement("canvas");
      const ctx = c.getContext("2d");
      if (!ctx) return "canvas blocked";
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("fingerprint", 2, 15);
      ctx.fillStyle = "rgba(102,204,0,0.7)";
      ctx.fillText("fingerprint", 4, 17);
      return c.toDataURL().slice(-50);
    }, "canvas blocked");
  }

  function getGPUInfo() {
    return safe(
      () => {
        const c = document.createElement("canvas");
        const gl = c.getContext("webgl") || c.getContext("experimental-webgl");
        if (!gl) return { renderer: "no webgl", vendor: "no webgl" };
        const ext = gl.getExtension("WEBGL_debug_renderer_info");
        if (!ext)
          return { renderer: "extension blocked", vendor: "extension blocked" };
        return {
          renderer: gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || "unknown",
          vendor: gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || "unknown",
        };
      },
      { renderer: "unavailable", vendor: "unavailable" },
    );
  }

  function getOS() {
    return safe(() => {
      const ua = navigator.userAgent;
      if (/Windows NT 10/.test(ua)) return "Windows 10/11";
      if (/Windows NT 6.3/.test(ua)) return "Windows 8.1";
      if (/Windows/.test(ua)) return "Windows (older)";
      if (/iPhone/.test(ua)) return "iOS (iPhone)";
      if (/iPad/.test(ua)) return "iOS (iPad)";
      if (/Mac OS X/.test(ua)) return "macOS";
      if (/Android/.test(ua)) {
        const v = ua.match(/Android ([\d.]+)/);
        return "Android " + (v ? v[1] : "");
      }
      if (/CrOS/.test(ua)) return "ChromeOS";
      if (/Linux/.test(ua)) return "Linux";
      return "Unknown OS";
    });
  }

  function getBrowser() {
    return safe(() => {
      const ua = navigator.userAgent;
      if (/Edg\//.test(ua)) return "Microsoft Edge";
      if (/OPR\/|Opera/.test(ua)) return "Opera";
      if (/Samsung/.test(ua)) return "Samsung Internet";
      if (/Firefox/.test(ua)) return "Firefox";
      if (/Chrome/.test(ua)) return "Chrome";
      if (/Safari/.test(ua)) return "Safari";
      return "Unknown Browser";
    });
  }

  function getDevice() {
    return safe(() => {
      const ua = navigator.userAgent;
      if (/iPad/.test(ua)) return "Tablet (iPad)";
      if (/Tablet|Tab/.test(ua)) return "Tablet";
      if (/Mobi|Android|iPhone/.test(ua)) return "Mobile";
      return "Desktop";
    });
  }

  // ═══════════════════════════════════════════════
  //  DATA COLLECTION — each section fails safely
  // ═══════════════════════════════════════════════

  const errors = []; // accumulate non-fatal issues to report in email

  // ── IP & Location ─────────────────────────────
  let ip = "unknown",
    city = "unknown",
    country = "unknown",
    isp = "unknown",
    lat = "unknown",
    lon = "unknown",
    org = "unknown";

  try {
    const data = await fetchWithTimeout("https://ipinfo.io/json", 5000);
    ip = data.ip ?? "unknown";
    city = (data.city ?? "?") + ", " + (data.region ?? "?");
    country = data.country ?? "unknown";
    org = data.org ?? "unknown";
    isp = data.org ?? "unknown";
    const parts = (data.loc ?? ",").split(",");
    lat = parts[0] || "unknown";
    lon = parts[1] || "unknown";
  } catch (e) {
    const msg =
      e.name === "AbortError"
        ? "ipinfo.io timed out after 5s"
        : "ipinfo.io failed: " + e.message;
    errors.push(msg);
    console.warn("💌 tracker [IP lookup]:", msg);
  }

  // ── Battery ───────────────────────────────────
  let battery = "API not supported";
  try {
    if (typeof navigator.getBattery === "function") {
      const b = await navigator.getBattery();
      battery =
        Math.round(b.level * 100) +
        "% — " +
        (b.charging ? "Charging" : "Not charging");
    }
  } catch (e) {
    battery = "unavailable";
    errors.push("Battery API: " + e.message);
  }

  // ── Connection ────────────────────────────────
  const connection = safe(() => {
    const conn =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;
    if (!conn) return "API not supported";
    return (
      (conn.effectiveType ?? "?").toUpperCase() +
      " | down " +
      (conn.downlink ?? "?") +
      "Mbps" +
      " | RTT " +
      (conn.rtt ?? "?") +
      "ms"
    );
  }, "unavailable");

  // ── Screen & Window ───────────────────────────
  const screenInfo = safe(
    () =>
      screen.width +
      "x" +
      screen.height +
      " (avail: " +
      screen.availWidth +
      "x" +
      screen.availHeight +
      ")",
  );
  const windowInfo = safe(() => window.innerWidth + "x" + window.innerHeight);
  const pixelRatio = safe(() => String(window.devicePixelRatio || 1) + "x");
  const colorDepth = safe(() => screen.colorDepth + "-bit");
  const orientation = safe(() => screen.orientation?.type ?? "unknown");

  // ── Locale ────────────────────────────────────
  const timezone = safe(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    "unknown",
  );
  const locale = safe(
    () => Intl.DateTimeFormat().resolvedOptions().locale,
    "unknown",
  );
  const languages = safe(
    () => (navigator.languages ?? [navigator.language]).join(", "),
    "unknown",
  );

  // ── Storage ───────────────────────────────────
  const cookiesOn = safe(
    () => (navigator.cookieEnabled ? "Yes" : "No"),
    "unknown",
  );
  const localStorageOn = safe(() => {
    localStorage.setItem("_t", "1");
    localStorage.removeItem("_t");
    return "Yes";
  }, "Blocked");

  // ── Hardware & Browser Env ────────────────────
  const doNotTrack = safe(() =>
    navigator.doNotTrack === "1" ? "Yes (ignored)" : "No",
  );
  const touchPoints = safe(() => String(navigator.maxTouchPoints ?? 0));
  const cpuThreads = safe(() =>
    String(navigator.hardwareConcurrency ?? "unknown"),
  );
  const memoryGB = safe(() =>
    String(navigator.deviceMemory ?? "unknown (Firefox hides this)"),
  );
  const plugins = safe(
    () =>
      Array.from(navigator.plugins ?? [])
        .map(function (p) {
          return p.name;
        })
        .join(", ") || "none / hidden",
  );

  // ── GPU ───────────────────────────────────────
  const gpu = getGPUInfo();

  // ── Misc ──────────────────────────────────────
  const darkMode = safe(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "Dark"
      : "Light",
  );
  const fingerprint = canvasFingerprint();
  const pageLoadTime = safe(() => Math.round(performance.now()) + "ms");
  const referrer = safe(() => document.referrer || "direct / no referrer");
  const pageURL = safe(() => window.location.href);
  const visitTime = safe(
    () => new Date().toLocaleString("en-GB", { timeZone: timezone }),
    new Date().toISOString(),
  );
  const userAgent = safe(() => navigator.userAgent, "unknown");

  // ═══════════════════════════════════════════════
  //  BUILD PAYLOAD & SEND
  // ═══════════════════════════════════════════════

  const payload = {
    visit_time: visitTime,
    timezone: timezone,
    locale: locale,
    ip: ip,
    city: city,
    country: country,
    isp: isp,
    org: org,
    lat: lat,
    lon: lon,
    connection: connection,
    device: getDevice(),
    os: getOS(),
    browser: getBrowser(),
    user_agent: userAgent,
    gpu_renderer: gpu.renderer,
    gpu_vendor: gpu.vendor,
    cpu_threads: cpuThreads,
    memory_gb: memoryGB,
    battery: battery,
    touch_points: touchPoints,
    screen_res: screenInfo,
    window_size: windowInfo,
    pixel_ratio: pixelRatio,
    colour_depth: colorDepth,
    orientation: orientation,
    dark_mode: darkMode,
    languages: languages,
    cookies: cookiesOn,
    local_storage: localStorageOn,
    do_not_track: doNotTrack,
    plugins: plugins,
    fingerprint: fingerprint,
    referrer: referrer,
    page_url: pageURL,
    load_time: pageLoadTime,
    collection_errors: errors.length > 0 ? errors.join(" | ") : "none",
  };

  console.log("💌 tracker: payload collected, sending...", payload);

  const success = await sendWithRetry(payload);

  if (success) {
    sessionStorage.setItem("notified", "1");
    console.log("💌 tracker: sent successfully");
  } else {
    console.error(
      "💌 tracker: all 3 send attempts failed — check EmailJS credentials & template variable names",
    );
  }
})();
