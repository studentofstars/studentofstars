const fs = require('fs');
const path = require('path');

const USERNAME = 'studentofstars';
const CONFIG_FILE = path.join(__dirname, '..', 'neofetch.json');
const OUTPUT_FILE = path.join(__dirname, '..', 'assets', 'neofetch-animated.svg');

async function generateAnimatedCard() {
  console.log('Generating animated Neofetch card for', USERNAME);

  if (!fs.existsSync(CONFIG_FILE)) {
    throw new Error(`Config file not found at: ${CONFIG_FILE}`);
  }

  const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  const dataUri = 'data:application/json,' + encodeURIComponent(JSON.stringify(config));
  const apiUrl = `https://neofetch-profile.vercel.app/api?username=${USERNAME}&theme=github-dark&config=${encodeURIComponent(dataUri)}&t=${Date.now()}`;

  console.log('Fetching base SVG from API...');
  const res = await fetch(apiUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch card from API. Status: ${res.status}`);
  }

  let svg = await res.text();

  // 1. Inject Animation Styles
  const animationStyles = `
/* --- Animation Styles --- */
@keyframes cursorBlink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

@keyframes promptGlow {
  0%, 100% { fill: #c9d1d9; filter: drop-shadow(0 0 1px rgba(88, 166, 255, 0.4)); }
  50% { fill: #58a6ff; filter: drop-shadow(0 0 6px rgba(88, 166, 255, 0.9)); }
}

@keyframes twinkleA {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; filter: drop-shadow(0 0 3px #ffffff); }
}

@keyframes twinkleB {
  0%, 100% { opacity: 1; filter: drop-shadow(0 0 2px #ffa657); }
  50% { opacity: 0.35; }
}

@keyframes twinkleC {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; filter: drop-shadow(0 0 4px #a5d6ff); }
}

@keyframes scanlineMotion {
  0% { transform: translateY(-150px); }
  100% { transform: translateY(530px); }
}

@keyframes borderGlow {
  0%, 100% { stroke: #30363d; stroke-width: 1px; }
  50% { stroke: #58a6ff; stroke-width: 1.5px; filter: drop-shadow(0 0 4px rgba(88, 166, 255, 0.3)); }
}

.cursor {
  animation: cursorBlink 1s infinite;
  fill: #58a6ff;
  font-weight: bold;
}

.prompt-title {
  animation: promptGlow 4s ease-in-out infinite;
}

.twinkle-1 {
  animation: twinkleA 2.5s ease-in-out infinite;
}

.twinkle-2 {
  animation: twinkleB 3.2s ease-in-out infinite 0.8s;
}

.twinkle-3 {
  animation: twinkleC 2.8s ease-in-out infinite 1.5s;
}

.card-bg {
  animation: borderGlow 6s ease-in-out infinite;
}

.scanline {
  animation: scanlineMotion 7s linear infinite;
  pointer-events: none;
}
`;

  svg = svg.replace('</style>', `${animationStyles}\n</style>`);

  // 2. Add Defs for scanline gradient and clip path
  const defs = `
<defs>
  <clipPath id="cardClip">
    <rect width="985px" height="530px" rx="15"/>
  </clipPath>
  <linearGradient id="scanlineGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="rgba(88, 166, 255, 0)" />
    <stop offset="50%" stop-color="rgba(88, 166, 255, 0.07)" />
    <stop offset="100%" stop-color="rgba(88, 166, 255, 0)" />
  </linearGradient>
</defs>
<rect width="985px" height="530px" fill="#161b22" rx="15" stroke="#30363d" class="card-bg"/>
<g clip-path="url(#cardClip)">
  <rect class="scanline" x="0" y="0" width="985px" height="100px" fill="url(#scanlineGrad)"/>
</g>`;

  svg = svg.replace('<rect width="985px" height="530px" fill="#161b22" rx="15"/>', defs);

  // 3. Add Blinking Cursor to Title
  svg = svg.replace(
    `<tspan x="390" y="30">${USERNAME}@github</tspan>`,
    `<tspan x="390" y="30" class="prompt-title">${USERNAME}@github</tspan><tspan class="cursor"> █</tspan>`
  );

  // 4. Add Twinkling to Highlight Star Characters in ASCII Art
  let starCounter = 0;
  // Match colored tspans with bright golden/amber/white values
  const starColors = ['#ffaa00', '#fba801', '#faa600', '#f4a301', '#fba701', '#f5a402', '#fea900', '#eb9d03'];
  for (const color of starColors) {
    const regex = new RegExp(`(<tspan fill="${color}">)([^<]+)(<\/tspan>)`, 'g');
    svg = svg.replace(regex, (match, openTag, text, closeTag) => {
      starCounter++;
      const twinkleClass = `twinkle-${(starCounter % 3) + 1}`;
      return `<tspan fill="${color}" class="${twinkleClass}">${text}</tspan>`;
    });
  }

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, svg, 'utf8');
  console.log('Successfully generated animated card at:', OUTPUT_FILE);
}

generateAnimatedCard().catch(err => {
  console.error('Error generating animated card:', err);
  process.exit(1);
});
