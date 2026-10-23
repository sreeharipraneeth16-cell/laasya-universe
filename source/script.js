(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;
  const html = document.documentElement;
  html.classList.add('js');

  const state = { energy: 0, celebrated: false };
  const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2, nx: 0, ny: 0 };

  window.addEventListener('pointermove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.nx = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.ny = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  /* ---------- hero letters ---------- */
  function splitHero() {
    const target = $('[data-split]');
    if (!target) return;
    const text = target.textContent;
    target.textContent = '';
    Array.from(text).forEach((ch, i) => {
      const span = document.createElement('span');
      span.className = 'char';
      span.style.setProperty('--i', i);
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      target.appendChild(span);
    });
  }

  /* ---------- boot ---------- */
  function runBoot() {
    const boot = $('#boot');
    if (!boot) return;
    const bar = $('#bootBar');
    const pct = $('#bootPct');
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      boot.classList.add('is-done');
      document.body.classList.remove('is-loading');
      html.classList.add('ready');
      window.setTimeout(() => boot.remove(), 1400);
    };
    if (reduced) {
      if (bar) bar.style.transform = 'scaleX(1)';
      if (pct) pct.textContent = '100%';
      window.setTimeout(finish, 150);
      return;
    }
    const dur = 1600;
    const t0 = performance.now();
    const tick = (now) => {
      const p = clamp((now - t0) / dur, 0, 1);
      const e = 1 - Math.pow(1 - p, 3);
      if (bar) bar.style.transform = 'scaleX(' + e + ')';
      if (pct) pct.textContent = Math.round(e * 100) + '%';
      if (p < 1) requestAnimationFrame(tick);
      else window.setTimeout(finish, 200);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- reveals ---------- */
  function initReveal() {
    const els = $$('.reveal');
    if (!('IntersectionObserver' in window) || reduced) {
      els.forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    els.forEach((el) => io.observe(el));
  }

  /* ---------- cursor ---------- */
  function initCursor() {
    if (!fine) return;
    const cursor = $('#cursor');
    if (!cursor) return;
    const dot = $('.cursor__dot', cursor);
    const ring = $('.cursor__ring', cursor);
    let rx = mouse.x;
    let ry = mouse.y;
    const frame = () => {
      rx = lerp(rx, mouse.x, 0.18);
      ry = lerp(ry, mouse.y, 0.18);
      dot.style.left = mouse.x + 'px';
      dot.style.top = mouse.y + 'px';
      ring.style.left = rx + 'px';
      ring.style.top = ry + 'px';
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    const sel = 'a, button, .star, .envelope';
    document.addEventListener('pointerover', (e) => {
      if (e.target.closest && e.target.closest(sel)) cursor.classList.add('is-hover');
    });
    document.addEventListener('pointerout', (e) => {
      if (e.target.closest && e.target.closest(sel)) cursor.classList.remove('is-hover');
    });
    document.addEventListener('pointerdown', () => {
      cursor.classList.add('is-press');
      window.setTimeout(() => cursor.classList.remove('is-press'), 220);
    });
  }

  /* ---------- magnetic buttons ---------- */
  function initMagnetic() {
    if (!fine || reduced) return;
    $$('.magnetic').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * 0.16;
        const dy = (e.clientY - (r.top + r.height / 2)) * 0.26;
        el.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- scroll wiring ---------- */
  function initScroll() {
    const bar = $('#progressBar');
    const dots = $$('.dots a');
    const heroCopy = $('#heroCopy');
    const orbWrap = $('.hero__orb-wrap');
    const moments = $('#moments');
    const track = $('#momentsTrack');
    let ticking = false;

    const update = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0) + ')';

      if (!reduced && heroCopy) {
        const p = clamp(y / (window.innerHeight * 0.9), 0, 1);
        heroCopy.style.transform = 'translateY(' + p * 60 + 'px)';
        heroCopy.style.opacity = String(1 - p * 0.85);
        if (orbWrap) orbWrap.style.transform = 'translateY(' + p * 110 + 'px)';
      }

      if (track) {
        if (moments && !window.matchMedia('(max-width: 860px)').matches) {
          const rect = moments.getBoundingClientRect();
          const total = moments.offsetHeight - window.innerHeight;
          const p = clamp(-rect.top / (total || 1), 0, 1);
          const maxX = Math.max(0, track.scrollWidth - window.innerWidth);
          track.style.transform = 'translate3d(' + (-p * maxX) + 'px,0,0)';
        } else {
          track.style.transform = '';
        }
      }
      ticking = false;
    };

    const request = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    update();

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          dots.forEach((d) => d.classList.toggle('is-active', d.dataset.dot === en.target.id));
        });
      }, { rootMargin: '-45% 0px -45% 0px' });
      $$('main section[id]').forEach((s) => io.observe(s));
    }
  }

  /* ---------- nebula shader ---------- */
  function initNebula() {
    const canvas = $('#nebula');
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: 'low-power' });
    if (!gl) return;

    const vsSrc = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    const fsSrc = `precision highp float;
uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;uniform float uEnergy;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));
return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+vec2(17.1,9.2);a*=.5;}return v;}
void main(){
vec2 p=(gl_FragCoord.xy-.5*uRes)/uRes.y;p+=uMouse*.06;
float t=uTime*.025;
vec2 q=vec2(fbm(p*1.5+vec2(0.,t)),fbm(p*1.5+vec2(5.2,1.3)-t));
float f=fbm(p*2.2+q*1.7+vec2(t*.6,0.));
vec3 deep=vec3(.025,.018,.045);
vec3 plum=vec3(.16,.03,.13);
vec3 rose=vec3(.52,.16,.31);
vec3 gold=vec3(.95,.72,.42);
vec3 col=deep;
col=mix(col,plum,smoothstep(.15,.95,f));
col=mix(col,rose,smoothstep(.55,1.,q.x)*.55);
col+=gold*pow(smoothstep(.72,1.,f),3.)*.55;
float glow=exp(-3.2*length(p-vec2(.55,.15)));
col+=vec3(.35,.22,.12)*glow*.35;
glow=exp(-3.6*length(p+vec2(.6,.25)));
col+=vec3(.22,.08,.18)*glow*.4;
col*=1.35*(1.-.55*length(p*.85));
col+=vec3(.5,.2,.35)*uEnergy*.35;
col=pow(max(col,0.),vec3(.92));
gl_FragColor=vec4(col,1.);
}`;

    const compile = (type, src) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.warn('shader:', gl.getShaderInfoLog(sh));
        return null;
      }
      return sh;
    };
    const vs = compile(gl.VERTEX_SHADER, vsSrc);
    const fs = compile(gl.FRAGMENT_SHADER, fsSrc);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'uRes');
    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uMouse = gl.getUniformLocation(prog, 'uMouse');
    const uEnergy = gl.getUniformLocation(prog, 'uEnergy');

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
      canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener('resize', resize);
    resize();

    let energy = 0;
    let mx = 0;
    let my = 0;
    const t0 = performance.now();
    const frame = (now) => {
      if (document.hidden) { requestAnimationFrame(frame); return; }
      const t = reduced ? 0 : (now - t0) / 1000;
      mx = lerp(mx, mouse.nx, 0.03);
      my = lerp(my, mouse.ny, 0.03);
      energy *= 0.985;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uMouse, mx, -my);
      gl.uniform1f(uEnergy, energy);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (reduced) return;
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    state.nebulaPulse = () => { energy = 1; };
  }

  /* ---------- starfield + heart halo ---------- */
  function initSky() {
    const canvas = $('#sky');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const orb = $('#orb');
    let w = window.innerWidth;
    let h = window.innerHeight;
    const stars = [];
    let heart = [];
    let started = false;
    let shooting = null;
    let nextShoot = performance.now() + 4500;

    const makeStars = () => {
      stars.length = 0;
      const n = w < 700 ? 80 : 170;
      for (let i = 0; i < n; i++) {
        stars.push({
          rx: Math.random(), ry: Math.random(),
          r: rand(0.35, 1.4), a: rand(0.12, 0.65),
          tw: rand(0, Math.PI * 2), sp: rand(0.3, 1.1)
        });
      }
    };
    const makeHeart = () => {
      heart = [];
      const n = reduced ? 110 : (w < 700 ? 170 : 290);
      for (let i = 0; i < n; i++) {
        const t = (i / n) * Math.PI * 2;
        heart.push({
          hx: 16 * Math.pow(Math.sin(t), 3),
          hy: 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t),
          j: rand(0.93, 1.07), ph: rand(0, Math.PI * 2),
          size: rand(0.7, 1.9), gold: Math.random() < 0.18
        });
      }
    };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!started) { makeStars(); started = true; }
      else { stars.forEach((s) => { s.x = s.rx * w; s.y = s.ry * h; }); }
      makeHeart();
    };
    window.addEventListener('resize', resize);
    resize();
    stars.forEach((s) => { s.x = s.rx * w; s.y = s.ry * h; });

    const draw = (now) => {
      if (document.hidden) { requestAnimationFrame(draw); return; }
      const t = now / 1000;
      ctx.clearRect(0, 0, w, h);

      for (const s of stars) {
        const a = reduced ? s.a : s.a * (0.55 + 0.45 * Math.sin(t * s.sp + s.tw));
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,245,240,' + a + ')';
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (orb) {
        const r = orb.getBoundingClientRect();
        if (r.bottom > -80 && r.top < h + 80 && r.right > -80 && r.left < w + 80) {
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const scale = (r.width * 1.3) / 32;
          const rot = Math.sin(t * 0.12) * 0.07;
          const cos = Math.cos(rot);
          const sin = Math.sin(rot);
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          for (const p of heart) {
            let x = p.hx * scale * p.j;
            let y = p.hy * scale * p.j;
            if (!reduced) {
              x += Math.sin(t * 1.1 + p.ph) * 1.6;
              y += Math.cos(t * 0.9 + p.ph) * 1.6;
            }
            const rx = x * cos - y * sin;
            const ry = x * sin + y * cos;
            let px = cx + rx;
            let py = cy + ry + scale * 3.4;
            const dx = px - mouse.x;
            const dy = py - mouse.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < 9600) {
              const d = Math.sqrt(d2) || 1;
              const f = (1 - d / 98) * 20;
              px += (dx / d) * f;
              py += (dy / d) * f;
            }
            const alpha = 0.34 + 0.44 * (0.5 + 0.5 * Math.sin(t * 1.4 + p.ph));
            ctx.beginPath();
            ctx.fillStyle = p.gold ? 'rgba(232,197,137,' + (alpha * 0.8) + ')' : 'rgba(255,140,180,' + (alpha * 0.85) + ')';
            ctx.arc(px, py, p.size, 0, Math.PI * 2);
            ctx.fill();
            if (p.size > 1.45) {
              ctx.beginPath();
              ctx.fillStyle = 'rgba(255,122,168,' + (alpha * 0.1) + ')';
              ctx.arc(px, py, p.size * 4.2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.restore();
        }
      }

      if (!reduced) {
        if (!shooting && now > nextShoot) {
          shooting = { x: rand(w * 0.12, w * 0.88), y: rand(0, h * 0.4), vx: rand(-9, -5), vy: rand(4, 7), life: 1 };
        }
        if (shooting) {
          shooting.x += shooting.vx;
          shooting.y += shooting.vy;
          shooting.life -= 0.012;
          if (shooting.life <= 0) {
            shooting = null;
            nextShoot = now + rand(5000, 11000);
          } else {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const g = ctx.createLinearGradient(shooting.x, shooting.y, shooting.x - shooting.vx * 7, shooting.y - shooting.vy * 7);
            g.addColorStop(0, 'rgba(255,225,235,' + (shooting.life * 0.8) + ')');
            g.addColorStop(1, 'rgba(255,225,235,0)');
            ctx.strokeStyle = g;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(shooting.x, shooting.y);
            ctx.lineTo(shooting.x - shooting.vx * 7, shooting.y - shooting.vy * 7);
            ctx.stroke();
            ctx.restore();
          }
        }
        requestAnimationFrame(draw);
      }
    };
    requestAnimationFrame(draw);

  }

  /* ---------- constellation ---------- */
  const reasons = [
    { title: 'Your laugh', text: 'It arrives a second before the joke lands, and it turns ordinary rooms into somewhere I want to stay.' },
    { title: 'Your kindness', text: 'You notice the people everyone else walks past. You make being gentle look like the strongest thing a person can do.' },
    { title: 'Your mind', text: 'The way you think, argue, change your mind, notice things. I could listen to you reason for hours and still want more.' },
    { title: 'Your courage', text: 'You do the scary thing anyway. Quietly, without a parade. That is the bravest thing there is.' },
    { title: 'Your voice', text: 'On the phone. In the morning. Half-asleep. It is the sound my brain decided means home.' },
    { title: 'Your softness', text: 'You love loudly and forgive easily. The world is measurably softer everywhere you have been.' },
    { title: 'Your everything', text: 'The boring parts. The grumpy parts. The parts you think no one sees. Especially those.' }
  ];

  function initConstellation() {
    const map = $('#starmap');
    const svg = $('#starmapLines');
    const stars = $$('.star');
    const card = $('#reasonCard');
    const num = $('#reasonNum');
    const title = $('#reasonTitle');
    const text = $('#reasonText');
    const dots = $('#reasonDots');
    if (!map || !stars.length || !card) return;

    stars.forEach((_, i) => {
      const dot = document.createElement('i');
      if (i === 0) dot.classList.add('is-active');
      dots.appendChild(dot);
    });
    const dotEls = $$('i', dots);

    const drawLines = () => {
      if (!svg) return;
      const box = map.getBoundingClientRect();
      svg.setAttribute('viewBox', '0 0 ' + box.width + ' ' + box.height);
      svg.setAttribute('width', box.width);
      svg.setAttribute('height', box.height);
      const pts = stars.map((s) => {
        const r = s.getBoundingClientRect();
        return [r.left - box.left + r.width / 2, r.top - box.top + (r.height - 24) / 2];
      });
      const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
      svg.innerHTML = '';
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      svg.appendChild(path);
    };

    let current = 0;
    const select = (i) => {
      current = i;
      stars.forEach((s, k) => {
        s.classList.toggle('is-active', k === i);
        s.setAttribute('aria-pressed', String(k === i));
      });
      dotEls.forEach((d, k) => d.classList.toggle('is-active', k === i));
      card.classList.add('is-swap');
      window.setTimeout(() => {
        num.textContent = String(i + 1).padStart(2, '0');
        title.textContent = reasons[i].title;
        text.textContent = reasons[i].text;
        card.classList.remove('is-swap');
      }, 170);
    };

    let userTouched = false;
    stars.forEach((s, i) => s.addEventListener('click', () => {
      userTouched = true;
      select(i);
    }));
    window.addEventListener('resize', drawLines);
    if ('ResizeObserver' in window) new ResizeObserver(drawLines).observe(map);
    window.setTimeout(drawLines, 60);

    if (!reduced) {
      window.setInterval(() => {
        if (userTouched || document.hidden) return;
        select((current + 1) % reasons.length);
      }, 6000);
    }
  }

  /* ---------- letter ---------- */
  function initLetter() {
    const section = $('#letter');
    const envelope = $('#envelope');
    const paper = $('#letterPaper');
    const hint = $('#envHint');
    if (!section || !envelope || !paper) return;
    envelope.addEventListener('click', () => {
      if (section.classList.contains('is-open')) return;
      section.classList.add('is-open');
      envelope.setAttribute('aria-expanded', 'true');
      paper.setAttribute('aria-hidden', 'false');
      if (hint) hint.textContent = 'sealed with a whole heart';
      window.setTimeout(() => {
        paper.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      }, 500);
    });
  }

  /* ---------- confetti ---------- */
  function initConfetti() {
    const canvas = $('#confetti');
    if (!canvas) return { go() {}, stop() {} };
    const ctx = canvas.getContext('2d');
    let w = window.innerWidth;
    let h = window.innerHeight;
    let pieces = [];
    let raf = 0;
    let running = false;
    const colors = ['#ff7aa8', '#ffb3c9', '#e8c589', '#b79cff', '#f8f1ea', '#8fe3c0'];

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    window.addEventListener('resize', size);

    const spawn = (n) => {
      for (let i = 0; i < n; i++) {
        const side = Math.random() < 0.5;
        pieces.push({
          x: side ? (Math.random() < 0.5 ? -20 : w + 20) : rand(w * 0.2, w * 0.8),
          y: side ? rand(h * 0.3, h * 0.85) : -20,
          vx: side ? (Math.random() < 0.5 ? rand(2, 7) : rand(-7, -2)) : rand(-2, 2),
          vy: side ? rand(-6, -1) : rand(2, 5),
          g: rand(0.06, 0.16), sway: rand(0, 6.28), sw: rand(0.01, 0.04),
          size: rand(5, 11), rot: rand(0, 6.28), vr: rand(-0.2, 0.2),
          color: colors[Math.floor(Math.random() * colors.length)],
          heart: Math.random() < 0.22, life: rand(240, 420)
        });
      }
    };
    const burst = (x, y, n) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const sp = rand(2, 9);
        pieces.push({
          x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0.05,
          sway: 0, sw: 0, size: rand(2, 5), rot: 0, vr: rand(-0.2, 0.2),
          color: colors[Math.floor(Math.random() * colors.length)], heart: false, life: rand(60, 110)
        });
      }
    };
    const tick = () => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (let i = pieces.length - 1; i >= 0; i--) {
        const p = pieces[i];
        p.vy += p.g;
        p.x += p.vx + Math.sin(p.sway) * 1.2;
        p.y += p.vy;
        p.sway += p.sw;
        p.rot += p.vr;
        p.life--;
        if (p.life <= 0 || p.y > h + 50) { pieces.splice(i, 1); continue; }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.min(1, p.life / 30);
        if (p.heart) {
          ctx.font = (p.size * 2.2) + 'px serif';
          ctx.textAlign = 'center';
          ctx.fillText('💗', 0, 0);
        } else {
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.62);
        }
        ctx.restore();
      }
      if (pieces.length) raf = requestAnimationFrame(tick);
      else { running = false; canvas.classList.remove('is-on'); }
    };
    return {
      go() {
        size();
        pieces = [];
        canvas.classList.add('is-on');
        running = true;
        spawn(reduced ? 60 : 150);
        if (!reduced) {
          [[w * 0.5, h * 0.42], [w * 0.3, h * 0.3], [w * 0.7, h * 0.32]].forEach((b, i) => {
            window.setTimeout(() => burst(b[0], b[1], 45), 250 + i * 380);
          });
          window.setTimeout(() => spawn(60), 900);
        }
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(tick);
      },
      stop() {
        running = false;
        pieces = [];
        canvas.classList.remove('is-on');
        cancelAnimationFrame(raf);
      }
    };
  }

  /* ---------- certificate ---------- */
  function makeCertificate() {
    const W = 1400;
    const H = 990;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const x = c.getContext('2d');

    const bg = x.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#160b20');
    bg.addColorStop(0.55, '#0d0817');
    bg.addColorStop(1, '#1c0b1a');
    x.fillStyle = bg;
    x.fillRect(0, 0, W, H);

    const glow = x.createRadialGradient(W / 2, 320, 20, W / 2, 320, 520);
    glow.addColorStop(0, 'rgba(255,122,168,.22)');
    glow.addColorStop(1, 'rgba(255,122,168,0)');
    x.fillStyle = glow;
    x.fillRect(0, 0, W, H);

    x.strokeStyle = 'rgba(232,197,137,.72)';
    x.lineWidth = 2;
    x.strokeRect(46, 46, W - 92, H - 92);
    x.strokeStyle = 'rgba(232,197,137,.24)';
    x.lineWidth = 1;
    x.strokeRect(60, 60, W - 120, H - 120);

    const img = $('.orb__photo img');
    const cx = W / 2;
    const cy = 285;
    const r = 112;
    x.save();
    x.beginPath();
    x.arc(cx, cy, r, 0, Math.PI * 2);
    x.clip();
    if (img && img.complete && img.naturalWidth) {
      const s = Math.max((r * 2) / img.naturalWidth, (r * 2) / img.naturalHeight);
      const dw = img.naturalWidth * s;
      const dh = img.naturalHeight * s;
      x.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
    } else {
      x.fillStyle = '#3a1830';
      x.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    x.restore();
    x.beginPath();
    x.arc(cx, cy, r + 7, 0, Math.PI * 2);
    x.strokeStyle = 'rgba(232,197,137,.8)';
    x.lineWidth = 1.5;
    x.stroke();

    x.textAlign = 'center';
    x.fillStyle = '#e8c589';
    x.font = '500 19px Outfit, Arial, sans-serif';
    try { x.letterSpacing = '7px'; } catch (e) {}
    x.fillText('CERTIFICATE OF US', W / 2, 140);
    try { x.letterSpacing = '0px'; } catch (e) {}

    x.fillStyle = 'rgba(248,241,234,.85)';
    x.font = '300 34px "Cormorant Garamond", Georgia, serif';
    x.fillText('this is to certify that', W / 2, 470);

    x.fillStyle = '#ffb3c9';
    x.font = '112px "Great Vibes", cursive';
    x.fillText('Laasya', W / 2, 590);

    x.fillStyle = '#f8f1ea';
    x.font = 'italic 42px "Cormorant Garamond", Georgia, serif';
    x.fillText('said yes.', W / 2, 660);

    x.fillStyle = 'rgba(248,241,234,.68)';
    x.font = '300 22px Outfit, Arial, sans-serif';
    x.fillText('On this day, one very nervous person asked the easiest question of his life —', W / 2, 728);
    x.fillText('and the universe answered with you.', W / 2, 762);

    const date = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    x.textAlign = 'left';
    x.fillStyle = 'rgba(232,197,137,.8)';
    x.font = '300 17px Outfit, Arial, sans-serif';
    x.fillText(date, 120, 878);

    x.textAlign = 'right';
    x.fillStyle = '#ffb3c9';
    x.font = '50px "Great Vibes", cursive';
    x.fillText('always yours,', W - 120, 862);
    x.font = '36px "Great Vibes", cursive';
    x.fillStyle = 'rgba(255,179,201,.85)';
    x.fillText('me 💗', W - 120, 906);

    x.textAlign = 'center';
    x.fillStyle = 'rgba(248,241,234,.35)';
    x.font = '300 12px Outfit, Arial, sans-serif';
    x.fillText('NO. 001  ·  ONE OF ONE  ·  NO REFUNDS', W / 2, 912);

    return c;
  }

  /* ---------- the question ---------- */
  let confettiCtl = null;

  function sayYes() {
    if (state.celebrated) return;
    state.celebrated = true;
    const said = $('#said');
    if (!said) return;
    said.classList.add('is-open');
    said.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-celebrating');
    if (confettiCtl) confettiCtl.go();
    sound.triumph();
    if (state.nebulaPulse) state.nebulaPulse();
    const flash = $('#flash');
    if (flash) {
      flash.classList.remove('is-on');
      void flash.offsetWidth;
      flash.classList.add('is-on');
    }
    window.setTimeout(() => {
      const t = $('#saidTitle');
      if (t) {
        t.setAttribute('tabindex', '-1');
        t.focus({ preventScroll: true });
      }
    }, 500);
  }

  function closeSaid() {
    const said = $('#said');
    if (!said) return;
    said.classList.remove('is-open');
    said.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-celebrating');
    state.celebrated = false;
    if (confettiCtl) confettiCtl.stop();
  }

  function initAsk() {
    const yes = $('#yesBtn');
    const no = $('#noBtn');
    const hint = $('#askHint');
    const said = $('#said');
    if (!yes || !no || !said) return;

    const labels = ['no', 'still no', 'nope', 'not even close', 'okay, it gives up 💗'];
    const funny = [
      '(the no button is a little shy)',
      'it is nervous too. give it a minute.',
      'you are only making it worse.',
      'it is running out of places to hide.',
      'it gave up. the yes button always wins. 💗'
    ];
    let attempts = 0;
    let defeated = false;

    const moveNo = () => {
      if (defeated) return;
      attempts++;
      if (attempts >= 5) {
        defeated = true;
        no.classList.add('is-defeated');
        no.textContent = labels[labels.length - 1];
        no.style.transform = '';
        if (hint) hint.textContent = funny[funny.length - 1];
        return;
      }
      const range = window.innerWidth < 620 ? 70 : 130;
      const dx = rand(-range, range);
      const dy = rand(-60, 60);
      no.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + Math.max(0.62, 1 - attempts * 0.07) + ')';
      no.textContent = labels[Math.min(attempts, labels.length - 2)];
      if (hint) hint.textContent = funny[Math.min(attempts, funny.length - 2)];
    };

    no.addEventListener('pointerenter', moveNo);
    no.addEventListener('pointerdown', (e) => {
      if (defeated) return;
      e.preventDefault();
      moveNo();
    });
    no.addEventListener('click', (e) => {
      if (defeated) {
        sayYes();
      } else {
        e.preventDefault();
        moveNo();
      }
    });
    yes.addEventListener('click', sayYes);

    const certBtn = $('#certBtn');
    if (certBtn) {
      certBtn.addEventListener('click', () => {
        try {
          const c = makeCertificate();
          const a = document.createElement('a');
          a.download = 'laasya-said-yes.png';
          a.href = c.toDataURL('image/png');
          document.body.appendChild(a);
          a.click();
          a.remove();
        } catch (e) {
          console.warn('certificate:', e);
        }
      });
    }

    const replay = $('#replayBtn');
    if (replay) {
      replay.addEventListener('click', () => {
        closeSaid();
        attempts = 0;
        defeated = false;
        no.classList.remove('is-defeated');
        no.style.transform = '';
        no.textContent = 'no';
        if (hint) hint.textContent = funny[0];
        window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && said.classList.contains('is-open')) {
        closeSaid();
        yes.focus({ preventScroll: true });
      }
    });

    window.__certificate = makeCertificate;
  }

  /* ---------- sound ---------- */
  const sound = (() => {
    let ctx = null;
    let master = null;
    let on = false;
    let chordTimer = null;
    let twTimer = null;
    let chordIdx = 0;
    const chords = [
      [174.61, 220.0, 261.63, 329.63],
      [146.83, 174.61, 220.0, 293.66],
      [196.0, 246.94, 293.66, 392.0],
      [164.81, 196.0, 246.94, 329.63]
    ];

    const updateBtn = (onState) => {
      const btn = $('#soundBtn');
      const label = $('#soundLabel');
      if (!btn) return;
      btn.classList.toggle('is-on', onState);
      btn.setAttribute('aria-pressed', String(onState));
      btn.setAttribute('aria-label', onState ? 'Turn ambient sound off' : 'Turn ambient sound on');
      if (label) label.textContent = onState ? 'sound on' : 'sound off';
    };

    const ensure = () => {
      if (ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      const delay = ctx.createDelay(1.5);
      delay.delayTime.value = 0.44;
      const fb = ctx.createGain();
      fb.gain.value = 0.32;
      const wet = ctx.createGain();
      wet.gain.value = 0.32;
      delay.connect(fb);
      fb.connect(delay);
      delay.connect(wet);
      wet.connect(master);
      master.delay = delay;
    };

    const voice = (freq, when, dur, type, gain) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type || 'triangle';
      o.frequency.value = freq;
      o.detune.value = rand(-5, 5);
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(gain || 0.035, when + 1.5);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      o.connect(g);
      g.connect(master);
      if (master.delay) g.connect(master.delay);
      o.start(when);
      o.stop(when + dur + 0.1);
    };

    const playChord = () => {
      if (!ctx) return;
      const now = ctx.currentTime;
      const chord = chords[chordIdx % chords.length];
      chordIdx++;
      chord.forEach((f, i) => voice(f, now + i * 0.06, 9, i % 2 ? 'sine' : 'triangle', 0.032));
    };

    const twinkle = () => {
      if (!ctx) return;
      const notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
      voice(notes[Math.floor(Math.random() * notes.length)], ctx.currentTime, rand(1.4, 2.6), 'sine', 0.018);
    };

    const start = () => {
      ensure();
      if (!ctx) return;
      ctx.resume();
      on = true;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 2);
      playChord();
      window.clearInterval(chordTimer);
      window.clearInterval(twTimer);
      chordTimer = window.setInterval(playChord, 8000);
      twTimer = window.setInterval(() => {
        if (!document.hidden && Math.random() < 0.8) twinkle();
      }, 3200);
      updateBtn(true);
    };

    const stop = () => {
      if (!ctx || !on) return;
      on = false;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
      window.clearInterval(chordTimer);
      window.clearInterval(twTimer);
      updateBtn(false);
    };

    const triumph = () => {
      ensure();
      if (!ctx) return;
      if (!on) start();
      const now = ctx.currentTime + 0.1;
      [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) => {
        voice(f, now + i * 0.12, 2.4, 'triangle', 0.045);
      });
      voice(261.63, now, 5, 'sine', 0.045);
    };

    return {
      start,
      stop,
      triumph,
      toggle() { if (on) stop(); else start(); }
    };
  })();

  function initSound() {
    const btn = $('#soundBtn');
    if (btn) btn.addEventListener('click', () => sound.toggle());
  }

  /* ---------- boot everything ---------- */
  splitHero();
  runBoot();
  initReveal();
  initCursor();
  initMagnetic();
  initScroll();
  initNebula();
  initSky();
  initConstellation();
  initLetter();
  initSound();
  confettiCtl = initConfetti();
  initAsk();

  window.addEventListener('load', () => {
    window.scrollTo(0, 0);
  });


})();
