const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav-links');
toggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});
document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

const filters = document.querySelectorAll('.filter');
const projects = document.querySelectorAll('.project-card');
filters.forEach(filter => {
  filter.addEventListener('click', () => {
    filters.forEach(x => x.classList.remove('active'));
    filter.classList.add('active');
    const value = filter.dataset.filter;
    projects.forEach(card => {
      const categories = card.dataset.category || '';
      card.classList.toggle('hidden', value !== 'all' && !categories.includes(value));
    });
  });
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, {threshold: 0.12});
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const heroVideo = document.querySelector('.hero-bg-video');
if (heroVideo) {
  heroVideo.muted = true;
  heroVideo.play().catch(() => {});
}

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// --- 3D Football Zig-Zag Scroll Animation ---
function init3DFootball() {
  const canvas = document.getElementById('football-canvas');
  if (!canvas) return;

  if (typeof THREE === 'undefined') {
    setTimeout(init3DFootball, 80);
    return;
  }

  // Scene & Perspective Camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 5);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (THREE.sRGBEncoding) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }

  // Cinematic Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.45);
  keyLight.position.set(4, 5, 4);
  scene.add(keyLight);

  // Red accent rim light matching brand aesthetic
  const redRimLight = new THREE.DirectionalLight(0xef3d42, 2.2);
  redRimLight.position.set(-4, -2, 2);
  scene.add(redRimLight);

  const blueFillLight = new THREE.DirectionalLight(0x242c72, 1.1);
  blueFillLight.position.set(2, -4, -2);
  scene.add(blueFillLight);

  const footballGroup = new THREE.Group();
  scene.add(footballGroup);

  // Placeholder 3D sphere while model loads
  const fallbackGeo = new THREE.SphereGeometry(0.35, 32, 32);
  const fallbackMat = new THREE.MeshStandardMaterial({
    color: 0xf2f2f2,
    roughness: 0.28,
    metalness: 0.08
  });
  const fallbackMesh = new THREE.Mesh(fallbackGeo, fallbackMat);
  footballGroup.add(fallbackMesh);

  // Load Football.glb
  if (typeof THREE.GLTFLoader !== 'undefined') {
    const loader = new THREE.GLTFLoader();
    loader.load(
      'assets/Football.glb',
      (gltf) => {
        footballGroup.remove(fallbackMesh);
        fallbackGeo.dispose();
        fallbackMat.dispose();

        const model = gltf.scene;

        // Auto-scale to smaller, sleek visible size
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const desiredRadius = window.innerWidth < 650 ? 0.42 : 0.60;
        const scale = desiredRadius / maxDim;
        model.scale.set(scale, scale, scale);

        // Center the pivot
        const center = new THREE.Vector3();
        box.getCenter(center);
        model.position.sub(center.multiplyScalar(scale));

        // Refine materials for realistic leather sheen & specular reflection
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.roughness = Math.min(child.material.roughness || 0.3, 0.42);
              child.material.metalness = 0.05;
              child.material.needsUpdate = true;
            }
          }
        });

        footballGroup.add(model);
      },
      undefined,
      (err) => {
        console.warn('Could not load Football.glb, keeping fallback 3D sphere', err);
      }
    );
  }

  // --- Track & Zig-Zag Waypoints Calculation ---
  const waypoints = [];
  const svgTrack = document.getElementById('football-zigzag-track');
  const footerEl = document.querySelector('.footer');

  function updateWaypoints() {
    const portraitEl = document.querySelector('.portrait-frame') || document.querySelector('.creative-portrait-wrap');
    const heroEl = document.querySelector('.hero');
    const workEl = document.querySelector('#work');
    const ytEl = document.querySelector('#youtube');
    const aboutEl = document.querySelector('#about');
    const expEl = document.querySelector('#experience');
    const skillsEl = document.querySelector('#skills');
    const clientsEl = document.querySelector('#clients') || document.querySelector('.clients-section');
    const contactEl = document.querySelector('#contact');

    const sections = [heroEl, workEl, ytEl, aboutEl, expEl, skillsEl, clientsEl, contactEl].filter(Boolean);

    const winW = window.innerWidth;
    const isMobile = winW < 768;
    const docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight
    );

    waypoints.length = 0;

    const leftX = isMobile ? winW * 0.16 : winW * 0.18;
    const rightX = isMobile ? winW * 0.84 : winW * 0.82;
    const centerX = winW * 0.50;

    // 1. Initial entry: Directly behind the Hero Portrait image!
    let startX = isMobile ? winW * 0.78 : winW * 0.80;
    let startY = 260;
    if (portraitEl) {
      const pRect = portraitEl.getBoundingClientRect();
      if (pRect.width > 0 && pRect.height > 0) {
        startX = pRect.left + (pRect.width * 0.5);
        startY = pRect.top + window.scrollY + (pRect.height * 0.48);
      }
    }
    waypoints.push({ x: startX, y: startY, isStartPortrait: true });

    // 2. Traverses down touching the center of every section with alternating zig-zag swings
    sections.forEach((sec, idx) => {
      const rect = sec.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const height = rect.height;
      const center = top + (height * 0.50);

      // Touch the exact center of this section!
      waypoints.push({ x: centerX, y: center, isCenter: true });

      // Outer zig-zag swing between this section and next
      if (idx < sections.length - 1) {
        const nextRect = sections[idx + 1].getBoundingClientRect();
        const nextCenter = nextRect.top + window.scrollY + (nextRect.height * 0.50);
        const midY = (center + nextCenter) * 0.5;
        const swingX = (idx % 2 === 0) ? leftX : rightX;
        waypoints.push({ x: swingX, y: midY, isSwing: true });
      }
    });

    // 3. Final destination: Goes directly into the corner of the Footer!
    if (footerEl) {
      const fRect = footerEl.getBoundingClientRect();
      const footerCenterY = fRect.top + window.scrollY + (fRect.height * 0.5);
      const cornerX = isMobile ? (winW - 52) : Math.max(winW * 0.88, winW - 90);
      waypoints.push({ x: cornerX, y: footerCenterY, isFooterCorner: true });
    }

    // Render SVG Zig-Zag line and glowing waypoint nodes
    if (svgTrack && waypoints.length > 1) {
      svgTrack.style.height = docHeight + 'px';
      svgTrack.setAttribute('viewBox', `0 0 ${winW} ${docHeight}`);

      let pathD = `M ${waypoints[0].x} ${waypoints[0].y}`;
      let nodesSvg = '';

      for (let i = 1; i < waypoints.length; i++) {
        const prev = waypoints[i - 1];
        const curr = waypoints[i];
        const midY = (prev.y + curr.y) / 2;
        pathD += ` C ${prev.x} ${midY}, ${curr.x} ${midY}, ${curr.x} ${curr.y}`;
      }

      waypoints.forEach((pt) => {
        const r = pt.isCenter ? 4.5 : (pt.isFooterCorner || pt.isStartPortrait ? 3.5 : 2.5);
        nodesSvg += `<circle cx="${pt.x}" cy="${pt.y}" r="${r}" />`;
      });

      svgTrack.innerHTML = `<path d="${pathD}" />` + nodesSvg;
    }
  }

  // Calculate coordinates along zig-zag curve for any scroll position
  function getTrackCoords(docY) {
    if (waypoints.length === 0) return { x: window.innerWidth * 0.5, y: docY };
    if (docY <= waypoints[0].y) {
      return { x: waypoints[0].x, y: waypoints[0].y };
    }
    const last = waypoints[waypoints.length - 1];
    if (docY >= last.y) {
      return { x: last.x, y: last.y };
    }

    for (let i = 0; i < waypoints.length - 1; i++) {
      const p1 = waypoints[i];
      const p2 = waypoints[i + 1];
      if (docY >= p1.y && docY <= p2.y) {
        const u = (docY - p1.y) / (p2.y - p1.y);
        const s = u * u * (3 - 2 * u);
        const x = p1.x + (p2.x - p1.x) * s;
        return { x, y: docY };
      }
    }
    return { x: last.x, y: last.y };
  }

  updateWaypoints();
  setTimeout(updateWaypoints, 500);

  // Resize handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    updateWaypoints();
  });

  // Interactive mouse/touch parallax
  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  // Scroll & Animation Physics
  let lastScrollY = window.scrollY;
  let scrollVelocity = 0;
  let current3DX = 0, current3DY = 0;
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    const scrollY = window.scrollY;
    const deltaScroll = scrollY - lastScrollY;
    lastScrollY = scrollY;
    scrollVelocity += (deltaScroll - scrollVelocity) * 0.12;

    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

    // Emerge factor from hero portrait (0 at top, 1 as you scroll past ~200px)
    const tHero = Math.min(1, Math.max(0, scrollY / 200));

    // Footer approach factor: smoothly guides the focus into the footer as you reach the bottom
    const distFromBottom = Math.max(0, maxScroll - scrollY);
    const tFooter = Math.min(1, Math.max(0, distFromBottom / 320));
    const footerApproach = 1 - tFooter; // 0 in upper page, 1 at bottom

    // Viewport focal height:
    // - At scroll = 0: focus aligns directly with portrait position so ball starts centered behind portrait
    // - In page: focus sits at normalFocusY (45% viewport height)
    // - At bottom: focus glides smoothly into the footer's on-screen vertical center
    const normalFocusY = window.innerHeight * 0.45;
    const portraitScreenY = waypoints[0] ? (waypoints[0].y - scrollY) : normalFocusY;
    const currentFooterRect = footerEl ? footerEl.getBoundingClientRect() : null;
    const footerScreenY = currentFooterRect ? (currentFooterRect.top + currentFooterRect.height * 0.5) : (window.innerHeight - 35);

    let viewFocusY = (1 - tHero) * portraitScreenY + tHero * normalFocusY;
    viewFocusY = (1 - footerApproach) * viewFocusY + footerApproach * footerScreenY;

    const targetDocY = scrollY + viewFocusY;

    // Track coordinates on zig-zag curve
    const trackPoint = getTrackCoords(targetDocY);

    // Convert screen coordinates into Three.js 3D world coordinates
    const vFOV = THREE.MathUtils.degToRad(camera.fov);
    const visibleHeight = 2 * Math.tan(vFOV / 2) * camera.position.z;
    const visibleWidth = visibleHeight * camera.aspect;

    const ndcX = (trackPoint.x / window.innerWidth) * 2 - 1;
    const ndcY = -(viewFocusY / window.innerHeight) * 2 + 1;

    const target3DX = ndcX * (visibleWidth / 2);
    const target3DY = ndcY * (visibleHeight / 2);

    // Smooth lerp movement along zig-zag path
    current3DX += (target3DX - current3DX) * 0.085;
    current3DY += (target3DY - current3DY) * 0.085;

    // Behind portrait: deeper in Z (-0.85) to ensure it stays behind the portrait frame
    // In sections & footer: sits comfortably at -0.25
    const baseZ = -0.25 - (1 - tHero) * 0.60;
    const floatBob = Math.sin(elapsedTime * 2.5) * (0.04 * tHero);

    footballGroup.position.set(
      current3DX + mouseX * (0.08 * tHero),
      current3DY + floatBob + mouseY * (0.08 * tHero),
      baseZ
    );

    // Dynamic scale:
    // - Starts smaller (0.45x) tucked behind the hero portrait image, expanding to 1.0 as it emerges
    // - Remains fully visible (1.0x) throughout and stays visible in the footer corner
    const scaleFactor = 0.45 + 0.55 * tHero;

    footballGroup.visible = true;
    footballGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // --- Rolling & Rotation Physics ---
    // Forward roll proportional to scroll velocity
    footballGroup.rotation.x += scrollVelocity * 0.007;

    // Lateral spin based on zig-zag direction
    const diffX = target3DX - current3DX;
    footballGroup.rotation.z -= diffX * 0.07;

    // Continuous ambient 3D rotation
    footballGroup.rotation.y += 0.008;
    footballGroup.rotation.x += 0.003;

    renderer.render(scene, camera);
  }

  animate();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init3DFootball);
} else {
  init3DFootball();
}
