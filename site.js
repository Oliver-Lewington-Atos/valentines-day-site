// ---- FLOATING HEARTS ----
const emojis = ["❤️", "💕", "💖", "💗", "💓", "💞", "🌹", "✨", "💘"];
const container = document.getElementById("heartsContainer");
for (let i = 0; i < 26; i++) {
  const h = document.createElement("span");
  h.className = "heart";
  h.textContent = emojis[Math.floor(Math.random() * emojis.length)];
  h.style.left = Math.random() * 100 + "vw";
  h.style.animationDuration = 6 + Math.random() * 10 + "s";
  h.style.animationDelay = Math.random() * 12 + "s";
  h.style.fontSize = 1 + Math.random() * 1.4 + "rem";
  container.appendChild(h);
}

// ---- RUNAWAY NO BUTTON ----
let noClicks = 0;
const noBtn = document.getElementById("noBtn");
const btnRow = document.getElementById("btnRow");

function runAway() {
  noClicks++;
  const maxMove = 90;
  const rx = (Math.random() - 0.5) * maxMove * 2;
  const ry = (Math.random() - 0.5) * maxMove;
  noBtn.style.transition = "transform 0.25s ease, font-size 0.3s";
  noBtn.style.transform = `translate(${rx}px, ${ry}px) rotate(${rx / 6}deg)`;

  // Gets smaller each hover
  const sizes = ["0.9rem", "0.75rem", "0.62rem", "0.5rem", "0.38rem"];
  noBtn.style.fontSize = sizes[Math.min(noClicks - 1, sizes.length - 1)];

  if (noClicks >= 10) {
    noBtn.style.opacity = "0";
    noBtn.style.pointerEvents = "none";
    setTimeout(() => {
      noBtn.remove();
    }, 400);
  }
}

// ---- YES ACTION ----
function sayYes() {
  const ys = document.getElementById("yes-screen");
  ys.style.display = "flex";
  // Extra hearts explosion
  for (let i = 0; i < 20; i++) {
    const h = document.createElement("span");
    h.className = "heart";
    h.textContent = ["💖", "💘", "🎉", "✨", "🌹"][
      Math.floor(Math.random() * 5)
    ];
    h.style.left = Math.random() * 100 + "vw";
    h.style.animationDuration = 3 + Math.random() * 4 + "s";
    h.style.animationDelay = "0s";
    h.style.fontSize = 2 + Math.random() * 2 + "rem";
    h.style.zIndex = 1000;
    container.appendChild(h);
  }
}
