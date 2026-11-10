// Gemensamma 3D-modeller för Tryckeri Tycoon (spelet) och maskinvyn.
// Vanligt <script> (inte modul) så att det fungerar även när filerna öppnas direkt från disk.
// Användning: const M = TryckeriModels.create(THREE);
(function () {
  function create(THREE) {
    // ---------- Cartoon-stil: toon-material + svart kontur ----------
    const grad = new THREE.DataTexture(new Uint8Array([120, 120, 120, 255, 200, 200, 200, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
    grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.needsUpdate = true;
    const matCache = {};
    const mat = c => matCache[c] || (matCache[c] = new THREE.MeshToonMaterial({ color: c, gradientMap: grad }));
    const outlineMat = new THREE.MeshBasicMaterial({ color: '#2b2118', side: THREE.BackSide });
    const T = 0.05;

    function finish(parent, m, x, y, z, outlineGeo) {
      m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
      if (outlineGeo) { const o = new THREE.Mesh(outlineGeo, outlineMat); o.userData.outline = true; m.add(o); }
      parent.add(m); return m;
    }
    function box(p, w, h, d, c, x = 0, y = 0, z = 0, ol = true) {
      return finish(p, new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c)), x, y, z, ol && new THREE.BoxGeometry(w + T, h + T, d + T));
    }
    function cyl(p, rt, rb, h, c, x = 0, y = 0, z = 0, ol = true, seg = 18) {
      return finish(p, new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(c)), x, y, z, ol && new THREE.CylinderGeometry(rt + T / 2, rb + T / 2, h + T, seg));
    }
    function sph(p, r, c, x = 0, y = 0, z = 0, ol = true) {
      return finish(p, new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat(c)), x, y, z, ol && new THREE.SphereGeometry(r + T / 2, 20, 14));
    }
    function glow(p, geo, c, x, y, z) {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: c })); m.position.set(x, y, z); p.add(m); return m;
    }

    // ---------- Figur ----------
    function makePerson({ shirt, skin, hair, pants = '#3d4a6b', player = false }) {
      const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
      const legL = box(body, 0.17, 0.42, 0.2, pants, -0.11, 0.21, 0);
      const legR = box(body, 0.17, 0.42, 0.2, pants, 0.11, 0.21, 0);
      cyl(body, 0.27, 0.31, 0.55, shirt, 0, 0.7, 0);
      sph(body, 0.27, shirt, 0, 0.97, 0);
      const armL = box(body, 0.13, 0.45, 0.15, shirt, -0.37, 0.75, 0);
      const armR = box(body, 0.13, 0.45, 0.15, shirt, 0.37, 0.75, 0);
      sph(body, 0.29, skin, 0, 1.38, 0);
      const h = sph(body, 0.3, hair, 0, 1.47, -0.05); h.scale.set(1, 0.72, 1);
      const eyeGeo = new THREE.SphereGeometry(0.045, 8, 6);
      glow(body, eyeGeo, '#1a1a1a', -0.1, 1.4, 0.27); glow(body, eyeGeo, '#1a1a1a', 0.1, 1.4, 0.27);
      if (player) {
        box(body, 0.44, 0.5, 0.05, '#e07a5f', 0, 0.66, 0.3);
        cyl(body, 0.31, 0.31, 0.13, '#e07a5f', 0, 1.6, 0);
        box(body, 0.32, 0.04, 0.26, '#e07a5f', 0, 1.56, 0.3);
      }
      const carry = new THREE.Group(); carry.position.y = 2.05; root.add(carry);
      root.userData = { body, legL, legR, armL, armR, carry, phase: 0 };
      root.traverse(o => { if (o.isMesh && o.material !== outlineMat) o.castShadow = true; });
      return root;
    }

    // ---------- Produktionsmaskiner ----------
    // Maskinerna byggs av moduler i en rad längs x (papperet går från vänster till höger).
    // Framsidan pekar mot +z. Måtten är ungefärliga, i meter.
    const P = { iridesseBlue: '#2f6fb5', epsonBlue: '#1f5fae', epsonLight: '#cfe0f2', white: '#f1f2f4', light: '#d7dbe0', mid: '#a3abb5', dark: '#454b54', black: '#2a2d33', paper: '#ffffff' };
    const seam = (g, x, y, z, w, h) => box(g, w, h, 0.012, '#5b626c', x, y, z, false);
    const handle = (g, x, y, z, w = 0.3) => box(g, w, 0.035, 0.035, P.dark, x, y, z, false);
    function screenArm(g, x, top, z) {
      cyl(g, 0.025, 0.025, 0.45, P.dark, x, top + 0.22, z);
      const s = box(g, 0.42, 0.28, 0.04, P.black, x, top + 0.55, z + 0.06);
      s.rotation.x = -0.35;
      glow(s, new THREE.PlaneGeometry(0.36, 0.22), '#7ee8d0', 0, 0, 0.022);
    }
    function lamp(g, x, y, z, c = '#4ade80') { return glow(g, new THREE.SphereGeometry(0.03, 10, 8), c, x, y, z); }


    // Stativ + inmatningsrulle bak + upprullare fram (delas av storformatarna)
    function rollStand(g, w, bodyY, d) {
      [-1, 1].forEach(s => {
        box(g, 0.1, bodyY - 0.05, 0.12, P.black, s * (w / 2 - 0.25), (bodyY - 0.05) / 2, 0);
        box(g, 0.14, 0.05, d * 0.95, P.black, s * (w / 2 - 0.25), 0.025, 0);
      });
      box(g, w - 0.5, 0.06, 0.06, P.black, 0, 0.3, 0);
      const supply = cyl(g, 0.11, 0.11, w - 0.7, '#ffffff', 0, bodyY - 0.2, -d * 0.42); supply.rotation.z = Math.PI / 2;
      const core = cyl(g, 0.04, 0.04, w - 0.6, P.dark, 0, bodyY - 0.2, -d * 0.42, false); core.rotation.z = Math.PI / 2;
    }
    // Utskrivet media som rullar ut fram och ned till upprullaren. Returnerar en animationsfunktion.
    let printTexture = null;
    function getPrintTexture() {
      if (printTexture) return printTexture;
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 512; const c = cv.getContext('2d');
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, 256, 512);
      const cols = ['#e07a5f', '#3d405b', '#81b29a', '#f2cc8f', '#00a3e0', '#e6007e', '#ffe600'];
      for (let i = 0; i < 14; i++) {
        c.fillStyle = cols[i % cols.length];
        if (i % 3 === 0) c.fillRect(20 + (i * 37) % 180, (i * 53) % 480, 60 + (i * 13) % 90, 30 + (i * 7) % 40);
        else { c.beginPath(); c.arc((i * 71) % 256, (i * 97) % 512, 18 + (i * 5) % 30, 0, Math.PI * 2); c.fill(); }
      }
      c.fillStyle = '#2b2118'; c.font = '900 44px system-ui, sans-serif'; c.fillText('SALE', 60, 140); c.fillText('NYHET!', 40, 380);
      printTexture = new THREE.CanvasTexture(cv); printTexture.colorSpace = THREE.SRGBColorSpace;
      printTexture.wrapS = printTexture.wrapT = THREE.RepeatWrapping;
      return printTexture;
    }
    function mediaFlow(g, w, cw, bodyY, d) {
      const tex = getPrintTexture().clone(); tex.needsUpdate = true; tex.repeat.set(1, 0.6);
      const mw = cw - 0.15, top = bodyY - 0.08, bottom = 0.3, z = d * 0.46;
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(mw, top - bottom), new THREE.MeshToonMaterial({ map: tex, gradientMap: grad, side: THREE.DoubleSide }));
      sheet.position.set(0, (top + bottom) / 2, z); g.add(sheet);
      const take = cyl(g, 0.07, 0.07, mw + 0.04, '#ffffff', 0, bottom - 0.02, z - 0.05); take.rotation.z = Math.PI / 2;
      const core = cyl(g, 0.035, 0.035, w - 0.55, P.dark, 0, bottom - 0.02, z - 0.05, false); core.rotation.z = Math.PI / 2;
      return t => { tex.offset.y = t * 0.06; take.rotation.x = -t * 1.2; };
    }

    const MODULES = {
      // Högkapacitetsmatare med lådor
      feeder(g, w, h, d, o = {}) {
        const drawers = o.drawers || 2;
        box(g, w - 0.04, 0.08, d - 0.06, P.black, 0, 0.04, 0);
        box(g, w, h - 0.08, d, P.light, 0, 0.08 + (h - 0.08) / 2, 0);
        box(g, w + 0.02, 0.05, d + 0.02, P.mid, 0, h + 0.02, 0);
        const dh = (h - 0.16) / drawers;
        for (let i = 0; i < drawers; i++) {
          const y0 = 0.1 + dh * i;
          seam(g, 0, y0, d / 2 + 0.007, w - 0.06, 0.015);
          handle(g, 0, y0 + dh * 0.75, d / 2 + 0.02, w * 0.45);
          lamp(g, w / 2 - 0.08, y0 + dh * 0.75, d / 2 + 0.01, '#facc15');
        }
      },
      // Iridesse tryckmotor: lång, mörk underdel, ljus överdel, sex torrfärgsstationer
      iridesseEngine(g, w, h, d) {
        const lo = h * 0.48;
        box(g, w, lo, d, P.black, 0, lo / 2, 0);
        box(g, w, h - lo, d, P.iridesseBlue, 0, lo + (h - lo) / 2, 0);
        box(g, w + 0.02, 0.06, d + 0.02, P.light, 0, h + 0.03, 0);
        // dörrar
        [-w / 4, w / 4].forEach(x => { seam(g, x, lo / 2, d / 2 + 0.007, 0.015, lo - 0.1); handle(g, x - 0.06, lo * 0.7, d / 2 + 0.02, 0.04); });
        seam(g, 0, lo / 2, d / 2 + 0.007, 0.015, lo - 0.1);
        seam(g, 0, lo + 0.02, d / 2 + 0.007, w - 0.04, 0.015);
        seam(g, 0, lo + (h - lo) / 2, d / 2 + 0.007, 0.015, h - lo - 0.08);
        // torrfärg: guld, C, M, Y, K, silver
        box(g, w * 0.42, 0.16, 0.03, P.dark, -w * 0.22, h * 0.78, d / 2 + 0.01, false);
        ['#d4af37', '#00a3e0', '#e6007e', '#ffe600', '#1a1a1a', '#c0c0c0'].forEach((c, i) => {
          const cap = cyl(g, 0.045, 0.045, 0.04, c, -w * 0.22 + (i - 2.5) * w * 0.065, h * 0.78, d / 2 + 0.035, false);
          cap.rotation.x = Math.PI / 2;
        });
        box(g, 0.5, 0.04, d * 0.6, P.mid, w * 0.12, h + 0.08, -0.05);
        lamp(g, -w / 2 + 0.1, h + 0.1, d / 2 - 0.08);
        screenArm(g, w * 0.36, h, d / 2 - 0.15);
      },
      // Versant 280 tryckmotor: kompakt, ljus, med skanner/dokumentmatare ovanpå
      versantEngine(g, w, h, d) {
        const lo = h * 0.42;
        box(g, w, lo, d, P.light, 0, lo / 2, 0);
        box(g, w, h - lo, d, P.white, 0, lo + (h - lo) / 2, 0);
        box(g, w + 0.02, 0.05, d + 0.02, P.mid, 0, lo, 0, false);
        [0.12, 0.27].forEach(y => { seam(g, -w * 0.18, y, d / 2 + 0.007, w * 0.55, 0.015); });
        handle(g, -w * 0.18, 0.2, d / 2 + 0.02, w * 0.3); handle(g, -w * 0.18, 0.34, d / 2 + 0.02, w * 0.3);
        seam(g, w * 0.2, lo + (h - lo) / 2, d / 2 + 0.007, 0.015, h - lo - 0.1);
        handle(g, w * 0.26, lo + (h - lo) * 0.6, d / 2 + 0.02, 0.04);
        // skanner + dokumentmatare
        box(g, w * 0.6, 0.12, d * 0.85, P.light, -w * 0.12, h + 0.06, 0);
        const adf = box(g, w * 0.45, 0.1, d * 0.6, P.mid, -w * 0.15, h + 0.17, -0.02);
        adf.rotation.z = 0.08;
        box(g, w * 0.3, 0.02, d * 0.45, P.paper, -w * 0.18, h + 0.235, -0.02, false).rotation.z = 0.08;
        lamp(g, -w / 2 + 0.08, h - 0.05, d / 2 + 0.01);
        screenArm(g, w * 0.32, h, d / 2 - 0.12);
      },
      // Interface-modul / decurler (plattar till papperet)
      decurler(g, w, h, d) {
        box(g, w, h, d, P.light, 0, h / 2, 0);
        box(g, w + 0.02, 0.12, d + 0.02, P.dark, 0, h - 0.055, 0);
        seam(g, 0, h * 0.45, d / 2 + 0.007, w - 0.08, 0.015);
        handle(g, 0, h * 0.6, d / 2 + 0.02, w * 0.4);
        lamp(g, w / 2 - 0.06, h - 0.2, d / 2 + 0.01);
      },
      // Inserter (lägger in förtryckta ark/omslag)
      inserter(g, w, h, d) {
        const bh = h * 0.85;
        box(g, w, bh, d, P.light, 0, bh / 2, 0);
        seam(g, 0, bh * 0.5, d / 2 + 0.007, 0.015, bh - 0.15);
        const tray = box(g, w * 0.95, 0.03, d * 0.65, P.mid, 0, bh + 0.08, 0); tray.rotation.z = -0.12;
        const stack = box(g, w * 0.7, 0.06, d * 0.45, P.paper, 0, bh + 0.12, 0, false); stack.rotation.z = -0.12;
      },
      // Big- och tvåsidig trimningsmodul
      creaseTrimmer(g, w, h, d) {
        box(g, w, h, d, P.white, 0, h / 2, 0);
        box(g, w + 0.02, 0.1, d + 0.02, P.dark, 0, h - 0.045, 0);
        box(g, w * 0.7, h * 0.3, 0.04, P.dark, 0, h * 0.2, d / 2 + 0.02); // spilllåda
        handle(g, 0, h * 0.3, d / 2 + 0.05, w * 0.3);
        seam(g, 0, h * 0.62, d / 2 + 0.007, w - 0.08, 0.015);
        lamp(g, w / 2 - 0.06, h - 0.2, d / 2 + 0.01);
      },
      // C/Z-falsmodul med utmatningsfack för vikta ark
      folder(g, w, h, d) {
        box(g, w, h, d, P.light, 0, h / 2, 0);
        box(g, w + 0.02, 0.1, d + 0.02, P.mid, 0, h - 0.045, 0);
        const tray = box(g, w * 0.8, 0.04, 0.32, P.mid, 0, h * 0.4, d / 2 + 0.16); tray.rotation.x = 0.1;
        for (let i = 0; i < 3; i++) box(g, w * 0.5, 0.025, 0.2, P.paper, 0, h * 0.4 + 0.04 + i * 0.03, d / 2 + 0.16, false);
        seam(g, 0, h * 0.7, d / 2 + 0.007, w - 0.08, 0.015);
      },
      // Häftes- och efterbehandlingsenhet (bok-/häftesmaskin, staplingsfack)
      bookletFinisher(g, w, h, d) {
        const lo = h * 0.45;
        box(g, w, lo, d, P.light, 0, lo / 2, 0);
        box(g, w, h - lo, d, P.white, 0, lo + (h - lo) / 2, 0);
        box(g, w + 0.02, 0.06, d + 0.02, P.mid, 0, h + 0.02, 0);
        seam(g, 0, lo / 2, d / 2 + 0.007, 0.015, lo - 0.1);
        handle(g, -0.06, lo * 0.7, d / 2 + 0.02, 0.04); handle(g, 0.06, lo * 0.7, d / 2 + 0.02, 0.04);
        // staplingsfack åt höger
        const st = box(g, 0.5, 0.03, d * 0.6, P.mid, w / 2 + 0.24, h * 0.72, 0); st.rotation.z = 0.18;
        const sp = box(g, 0.36, 0.08, d * 0.42, P.paper, w / 2 + 0.22, h * 0.75, 0, false); sp.rotation.z = 0.18;
        const tt = box(g, 0.32, 0.03, d * 0.5, P.mid, w / 2 + 0.14, h * 0.95, 0); tt.rotation.z = 0.25;
        // häftesfack framtill
        box(g, w * 0.5, 0.04, 0.3, P.mid, -w * 0.18, lo + 0.05, d / 2 + 0.15);
        for (let i = 0; i < 3; i++) box(g, w * 0.3, 0.03, 0.2, i % 2 ? '#fde68a' : P.paper, -w * 0.18, lo + 0.09 + i * 0.035, d / 2 + 0.15, false);
        lamp(g, -w / 2 + 0.08, h - 0.1, d / 2 + 0.01);
      },
      // ----- Storformat (rullmedia: matas in bakifrån, ut framtill till en upprullare) -----
      epsonS80600(g, w, h, d) {
        const bodyY = 0.85;
        rollStand(g, w, bodyY, d);
        // huvudenhet: ljusgrå kåpa, mörka gavlar
        const cw = w - 0.6;
        box(g, cw, h - bodyY, d * 0.75, P.epsonLight, 0, bodyY + (h - bodyY) / 2, -0.02);
        box(g, cw, 0.08, d * 0.5, P.white, 0, h + 0.02, -0.05);
        box(g, 0.3, h - bodyY + 0.08, d * 0.85, P.epsonBlue, -w / 2 + 0.15, bodyY + (h - bodyY + 0.08) / 2, 0);
        box(g, 0.3, h - bodyY + 0.08, d * 0.85, P.epsonBlue, w / 2 - 0.15, bodyY + (h - bodyY + 0.08) / 2, 0);
        // eftervärmare/fläkt över utmatningen
        box(g, cw, 0.1, 0.16, P.black, 0, bodyY - 0.02, d * 0.36);
        glow(g, new THREE.BoxGeometry(cw - 0.1, 0.012, 0.012), '#fb923c', 0, bodyY - 0.075, d * 0.44);
        // kontrollpanel höger
        const panel = box(g, 0.24, 0.05, 0.18, P.black, w / 2 - 0.15, h + 0.1, d * 0.2); panel.rotation.x = 0.4;
        glow(panel, new THREE.PlaneGeometry(0.16, 0.1), '#7ee8d0', 0, 0.027, 0).rotation.x = -Math.PI / 2;
        // bläckfack till vänster – 10 färger
        box(g, 0.3, 0.32, d * 0.7, P.epsonBlue, -w / 2 + 0.15, bodyY - 0.22, 0);
        ['#00a3e0', '#e6007e', '#ffe600', '#1a1a1a', '#7fd3f5', '#f59ac6', '#777777', '#f97316', '#dc2626', '#e5e7eb'].forEach((c, i) => {
          box(g, 0.022, 0.08, 0.03, c, -w / 2 + 0.04 + (i % 5) * 0.055, bodyY - 0.15 - Math.floor(i / 5) * 0.12, d * 0.36, false);
        });
        lamp(g, w / 2 - 0.06, h - 0.05, d * 0.43);
        return mediaFlow(g, w, cw, bodyY, d);
      },
      // ----- Summa skärplotter (svart, rullmatad vinylskärare på stativ) -----
      summaCutter(g, w, h, d) {
        const bodyY = 0.95;
        [-1, 1].forEach(sx => {
          box(g, 0.08, bodyY - 0.1, 0.08, P.black, sx * (w / 2 - 0.3), (bodyY - 0.1) / 2, 0);
          box(g, 0.1, 0.05, d, P.black, sx * (w / 2 - 0.3), 0.025, 0);
        });
        box(g, w - 0.6, 0.05, 0.05, P.black, 0, 0.3, 0, false);
        // vinylrulle bak på stativet
        const roll = cyl(g, 0.09, 0.09, w - 0.8, '#e07a5f', 0, bodyY - 0.3, -d / 2 + 0.08); roll.rotation.z = Math.PI / 2;
        // kropp
        box(g, w - 0.4, 0.22, 0.4, '#1f2328', 0, bodyY + 0.1, 0);
        [-1, 1].forEach(sx => box(g, 0.2, 0.34, 0.46, '#111317', sx * (w / 2 - 0.1), bodyY + 0.12, 0));
        box(g, w - 0.45, 0.04, 0.45, '#2a2d33', 0, bodyY - 0.02, 0.02);
        // vinyl som matas ut framåt
        box(g, w - 0.9, 0.006, 0.4, '#e07a5f', 0, bodyY - 0.005, 0.38, false);
        // klämrullar
        [-0.6, -0.2, 0.2, 0.6].forEach(fx => box(g, 0.06, 0.06, 0.1, P.mid, fx * (w - 0.6) / 1.4, bodyY + 0.24, 0.12, false));
        // skärhuvud som åker i sidled
        const head = new THREE.Group(); g.add(head);
        box(head, 0.16, 0.16, 0.22, '#111317', 0, bodyY + 0.25, 0.08);
        glow(head, new THREE.BoxGeometry(0.03, 0.03, 0.02), '#f87171', 0, bodyY + 0.28, 0.2);
        // panel till höger
        glow(g, new THREE.PlaneGeometry(0.12, 0.06), '#7ee8d0', w / 2 - 0.1, bodyY + 0.2, 0.235);
        lamp(g, w / 2 - 0.16, bodyY + 0.1, 0.235);
        return t => { head.position.x = Math.sin(t * 1.6) * (w / 2 - 0.45); };
      },
      // ----- Colorcut FB9000: flatbäddsskärare med arkmatare och utmatning -----
      flatbedCutter(g, w, h, d) {
        const tY = 0.9, fw = 0.75, ow = 0.6, tw = w - fw - ow;
        // arkmatare (vänster)
        box(g, fw, tY + 0.1, d, P.light, -w / 2 + fw / 2, (tY + 0.1) / 2, 0);
        box(g, fw * 0.8, 0.25, d * 0.7, P.paper, -w / 2 + fw / 2, tY + 0.23, 0);
        box(g, fw * 0.8, 0.012, d * 0.7, '#fde68a', -w / 2 + fw / 2, tY + 0.36, 0, false);
        // skärbord (mitten)
        const tx = -w / 2 + fw + tw / 2;
        box(g, tw, tY - 0.05, d, P.dark, tx, (tY - 0.05) / 2, 0);
        box(g, tw + 0.02, 0.06, d + 0.02, '#1f2937', tx, tY, 0);
        for (let i = 1; i < 6; i++) box(g, 0.012, 0.005, d - 0.1, '#374151', tx - tw / 2 + i * tw / 6, tY + 0.033, 0, false);
        box(g, tw * 0.5, 0.01, d * 0.6, P.paper, tx - tw * 0.1, tY + 0.035, 0, false);
        const gantry = new THREE.Group(); gantry.position.x = tx; g.add(gantry);
        [-1, 1].forEach(sz => box(gantry, 0.14, 0.22, 0.1, P.white, 0, tY + 0.14, sz * (d / 2 + 0.02)));
        box(gantry, 0.16, 0.12, d + 0.14, P.white, 0, tY + 0.28, 0);
        box(gantry, 0.17, 0.03, d + 0.15, '#e07a5f', 0, tY + 0.32, 0, false);
        const head = new THREE.Group(); gantry.add(head);
        box(head, 0.18, 0.2, 0.16, P.black, 0, tY + 0.2, 0);
        glow(head, new THREE.BoxGeometry(0.03, 0.03, 0.03), '#f87171', 0.1, tY + 0.25, 0);
        // utmatning (höger)
        box(g, ow, tY - 0.15, d * 0.9, P.light, w / 2 - ow / 2, (tY - 0.15) / 2, 0);
        const tray = box(g, ow, 0.03, d * 0.8, P.mid, w / 2 - ow / 2, tY - 0.12, 0); tray.rotation.z = -0.08;
        for (let i = 0; i < 3; i++) box(g, 0.2, 0.02, 0.14, P.paper, w / 2 - ow / 2 - 0.12 + (i % 2) * 0.22, tY - 0.08 + i * 0.02, -0.12 + i * 0.12, false);
        // kontrollpanel
        const sc = box(g, 0.3, 0.2, 0.04, P.black, -w / 2 + fw / 2, tY + 0.6, -d / 2 + 0.1); sc.rotation.x = -0.3;
        glow(sc, new THREE.PlaneGeometry(0.25, 0.15), '#7ee8d0', 0, 0, 0.022);
        cyl(g, 0.02, 0.02, 0.5, P.dark, -w / 2 + fw / 2, tY + 0.3, -d / 2 + 0.06, false);
        lamp(g, w / 2 - 0.1, tY - 0.05, d * 0.45 + 0.01);
        return t => {
          gantry.position.x = tx + Math.sin(t * 0.9) * (tw / 2 - 0.15);
          head.position.z = Math.sin(t * 2.3) * (d / 2 - 0.15);
        };
      },
      // ----- Planprinter (flatbädd) med portal som åker över bädden -----
      flatbed(g, w, h, d) {
        const bedY = 0.85;
        box(g, w, bedY - 0.1, d, P.dark, 0, (bedY - 0.1) / 2, 0);
        box(g, w + 0.04, 0.1, d + 0.04, P.light, 0, bedY - 0.05, 0);
        for (let i = 1; i < 6; i++) box(g, 0.015, 0.006, d - 0.1, P.mid, -w / 2 + i * w / 6, bedY + 0.003, 0, false);
        const tex = getPrintTexture().clone(); tex.needsUpdate = true; tex.repeat.set(1, 0.5);
        const board = new THREE.Mesh(new THREE.BoxGeometry(w * 0.45, 0.02, d * 0.62), new THREE.MeshToonMaterial({ map: tex, gradientMap: grad }));
        board.position.set(-w * 0.15, bedY + 0.01, 0.05); board.castShadow = board.receiveShadow = true; g.add(board);
        box(g, w * 0.3, 0.06, d * 0.5, '#f8fafc', w * 0.25, bedY + 0.03, 0.1); // oskrivna skivor
        [-1, 1].forEach(sz => box(g, w, 0.06, 0.12, P.black, 0, bedY + 0.03, sz * (d / 2 + 0.08)));
        const gantry = new THREE.Group(); g.add(gantry);
        [-1, 1].forEach(sz => box(gantry, 0.3, 0.45, 0.16, P.white, 0, bedY + 0.25, sz * (d / 2 + 0.08)));
        box(gantry, 0.32, 0.3, d + 0.32, P.white, 0, bedY + 0.58, 0);
        box(gantry, 0.33, 0.06, d + 0.34, '#e07a5f', 0, bedY + 0.66, 0, false);
        const carriage = new THREE.Group(); gantry.add(carriage);
        box(carriage, 0.5, 0.36, 0.42, P.dark, 0, bedY + 0.3, 0);
        [-1, 1].forEach(sx => glow(carriage, new THREE.BoxGeometry(0.06, 0.05, 0.3), '#a78bfa', sx * 0.29, bedY + 0.16, 0));
        // kontrollstation vid kortsidan
        cyl(g, 0.04, 0.04, 1.1, P.dark, w / 2 + 0.4, 0.55, d / 2 - 0.3);
        const sc = box(g, 0.45, 0.3, 0.04, P.black, w / 2 + 0.4, 1.2, d / 2 - 0.25); sc.rotation.y = -0.6;
        glow(sc, new THREE.PlaneGeometry(0.39, 0.24), '#7ee8d0', 0, 0, 0.022);
        lamp(g, -w / 2 + 0.1, bedY, d / 2 + 0.03);
        return t => {
          const k = (Math.sin(t * 0.4) + 1) / 2;
          gantry.position.x = -w / 2 + 0.4 + k * (w - 0.8);
          carriage.position.z = Math.sin(t * 2.5) * (d / 2 - 0.35);
        };
      },
      // ----- Skärmaskin / pappersgiljotin med sidobord. Ryggen mot -z, operatören på +z-sidan -----
      guillotine(g, w, h, d) {
        const bw = 1.3, tableY = 0.9;
        box(g, bw, tableY - 0.05, d, P.light, 0, (tableY - 0.05) / 2, -0.05);
        box(g, bw + 0.04, 0.05, d + 0.25, '#e5e7eb', 0, tableY, 0.07);
        // sidobord (luftbord)
        [-1, 1].forEach(sx => {
          box(g, (w - bw) / 2 - 0.04, 0.05, d * 0.85, '#e5e7eb', sx * (bw / 2 + (w - bw) / 4), tableY, 0.05);
          box(g, 0.05, tableY - 0.05, 0.05, P.dark, sx * (w / 2 - 0.08), (tableY - 0.05) / 2, 0.35, false);
          box(g, 0.05, tableY - 0.05, 0.05, P.dark, sx * (w / 2 - 0.08), (tableY - 0.05) / 2, -0.25, false);
        });
        // överdel med knivbalk
        box(g, bw, h - tableY - 0.2, 0.45, '#2f4f7f', 0, tableY + 0.2 + (h - tableY - 0.2) / 2, -d / 2 + 0.2);
        [-1, 1].forEach(sx => box(g, 0.14, 0.45, 0.45, '#2f4f7f', sx * (bw / 2 - 0.07), tableY + 0.25, -d / 2 + 0.2));
        const knife = new THREE.Group(); g.add(knife);
        box(knife, bw - 0.3, 0.16, 0.08, P.mid, 0, tableY + 0.35, -0.07);
        box(knife, bw - 0.3, 0.06, 0.12, P.dark, 0, tableY + 0.24, 0.04, false);
        // pappersbunt
        box(g, 0.7, 0.14, 0.45, '#ffffff', 0, tableY + 0.095, 0.02);
        box(g, 0.68, 0.01, 0.43, '#fde68a', 0, tableY + 0.17, 0.02, false);
        // tvåhandsknappar och ljusridå
        [-1, 1].forEach(sx => {
          cyl(g, 0.035, 0.035, 0.03, '#22c55e', sx * 0.45, tableY + 0.04, d / 2 + 0.12, false);
          box(g, 0.04, 0.55, 0.04, P.black, sx * (bw / 2 - 0.02), tableY + 0.3, 0.2, false);
          glow(g, new THREE.BoxGeometry(0.012, 0.45, 0.012), '#f87171', sx * (bw / 2 - 0.02), tableY + 0.3, 0.225);
        });
        // pekskärm på arm till höger
        cyl(g, 0.02, 0.02, 0.4, P.dark, bw / 2 + 0.1, h - 0.1, -d / 2 + 0.25, false);
        const sc = box(g, 0.32, 0.22, 0.04, P.black, bw / 2 + 0.1, h + 0.15, -d / 2 + 0.32); sc.rotation.y = -0.4;
        glow(sc, new THREE.PlaneGeometry(0.27, 0.17), '#7ee8d0', 0, 0, 0.022);
        lamp(g, -bw / 2 + 0.1, h - 0.05, -d / 2 + 0.43);
        return t => {
          const c = t % 3.5;
          knife.position.y = c > 2.6 && c < 3.1 ? -0.18 * Math.sin((c - 2.6) / 0.5 * Math.PI) : 0;
        };
      },
      // ----- Klädtryck: arbetsbord med värmepress (clamshell) -----
      heatPressStation(g, w, h, d) {
        const top = 0.9;
        // bord
        box(g, w, 0.06, d, '#ecc89e', 0, top - 0.03, 0);
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => box(g, 0.07, top - 0.06, 0.07, '#8b5e3c', sx * (w / 2 - 0.06), (top - 0.06) / 2, sz * (d / 2 - 0.06)));
        box(g, w - 0.1, 0.04, d - 0.1, '#d9b386', 0, 0.22, 0);
        // kartong med tröjor på hyllan
        box(g, 0.5, 0.3, 0.4, '#c8a06a', -w / 2 + 0.4, 0.39, 0);
        box(g, 0.44, 0.02, 0.34, '#81b29a', -w / 2 + 0.4, 0.55, 0, false);
        // värmepressen
        const px = -0.2, base = top;
        box(g, 0.46, 0.08, 0.56, P.black, px, base + 0.04, 0.02);
        box(g, 0.4, 0.04, 0.48, P.mid, px, base + 0.1, 0.04);
        box(g, 0.1, 0.3, 0.1, P.black, px, base + 0.23, -0.27);
        const ctrl = box(g, 0.2, 0.13, 0.07, P.black, px, base + 0.27, -0.2);
        const display = glow(ctrl, new THREE.PlaneGeometry(0.14, 0.06), '#f87171', 0, 0.015, 0.037);
        // t-shirt på bottenplattan
        const shirt = new THREE.Group(); shirt.position.set(px, base + 0.125, 0.06); g.add(shirt);
        box(shirt, 0.28, 0.012, 0.34, '#ffffff', 0, 0, 0.02, false);
        [-1, 1].forEach(sx => { const sl = box(shirt, 0.12, 0.012, 0.11, '#ffffff', sx * 0.17, 0, -0.1, false); sl.rotation.y = sx * 0.5; });
        const logo = cyl(shirt, 0.07, 0.07, 0.006, '#e07a5f', 0, 0.01, 0.02, false, 24);
        // övre värmeplatta på en arm som fälls upp/ned
        const pivot = new THREE.Group(); pivot.position.set(px, base + 0.38, -0.27); g.add(pivot);
        box(pivot, 0.09, 0.08, 0.34, P.black, 0, 0, 0.15);
        box(pivot, 0.1, 0.12, 0.1, P.black, 0, -0.08, 0.31);
        box(pivot, 0.42, 0.05, 0.5, P.dark, 0, -0.165, 0.31);
        box(pivot, 0.4, 0.025, 0.48, '#d1d5db', 0, -0.2, 0.31, false);
        const handleBar = cyl(pivot, 0.022, 0.022, 0.3, '#e07a5f', 0, 0.02, 0.5); handleBar.rotation.z = Math.PI / 2;
        box(pivot, 0.04, 0.04, 0.2, P.black, 0, 0.0, 0.4, false);
        // högar med vikta tröjor och transferark
        ['#3d405b', '#ffffff', '#81b29a', '#f2cc8f', '#e5989b'].forEach((c, i) => box(g, 0.32, 0.05, 0.26, c, w / 2 - 0.3, top + 0.025 + i * 0.052, -0.12));
        for (let i = 0; i < 4; i++) box(g, 0.3, 0.006, 0.22, i % 2 ? '#fde68a' : '#ffffff', w / 2 - 0.62, top + 0.004 + i * 0.007, 0.15, false);
        const vinyl = cyl(g, 0.06, 0.06, 0.4, '#9b5de5', w / 2 - 0.62, top + 0.06, -0.22); vinyl.rotation.z = Math.PI / 2;
        // ånga när pressen öppnas
        const steam = Array.from({ length: 4 }, (_, i) => {
          const m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 }));
          m.position.set(px + (i - 1.5) * 0.08, base + 0.2, 0.08); g.add(m); return m;
        });
        // cykel: öppen → stänger → pressar → öppnar
        const OPEN = -1.0, CYCLE = 6;
        return t => {
          const c = t % CYCLE;
          let a;
          if (c < 1.5) a = OPEN;
          else if (c < 2) a = OPEN * (1 - (c - 1.5) / 0.5);
          else if (c < 4.5) a = 0;
          else if (c < 5) a = OPEN * ((c - 4.5) / 0.5);
          else a = OPEN;
          pivot.rotation.x = a;
          const pressing = c >= 2 && c < 4.5;
          display.material.color.set(pressing ? '#f87171' : '#4ade80');
          logo.visible = c >= 4.5 || c < 1.5; // trycket syns när pressen öppnats
          const s = c >= 4.6 ? (c - 4.6) / 1.4 : -1;
          steam.forEach((m, i) => {
            if (s < 0) { m.material.opacity = 0; return; }
            const k = Math.min(1, s + i * 0.08);
            m.position.y = base + 0.18 + k * 0.5; m.scale.setScalar(0.6 + k * 1.2);
            m.material.opacity = 0.6 * (1 - k);
          });
        };
      },
      hpLatex560(g, w, h, d) {
        const bodyY = 0.85;
        rollStand(g, w, bodyY, d);
        const cw = w - 0.5;
        box(g, w, h - bodyY - 0.1, d * 0.8, P.black, 0, bodyY + (h - bodyY - 0.1) / 2, -0.03);
        box(g, w + 0.02, 0.06, d * 0.8, P.dark, 0, h - 0.07, -0.03);
        // stort fönster ovanpå framsidan
        const win = new THREE.Mesh(new THREE.BoxGeometry(cw, 0.02, d * 0.42), new THREE.MeshBasicMaterial({ color: '#7fb8e6', transparent: true, opacity: 0.6 }));
        win.position.set(-0.05, h - 0.02, d * 0.08); win.rotation.x = 0.12; g.add(win);
        box(g, cw + 0.04, 0.04, 0.04, P.mid, -0.05, h - 0.04, d * 0.29, false);
        // härdningsenhet (curing) framtill, ljusgrå med varm glöd
        box(g, cw + 0.1, 0.16, 0.22, P.light, -0.05, bodyY + 0.02, d * 0.35);
        glow(g, new THREE.BoxGeometry(cw, 0.012, 0.012), '#f97316', -0.05, bodyY - 0.065, d * 0.44);
        // pekskärm till höger
        const scr = box(g, 0.3, 0.22, 0.04, P.black, w / 2 - 0.12, h + 0.08, d * 0.3); scr.rotation.x = -0.4;
        glow(scr, new THREE.PlaneGeometry(0.25, 0.17), '#7ee8d0', 0, 0, 0.022);
        // bläckpatroner nere till vänster – 6 färger + optimizer
        box(g, 0.45, 0.25, d * 0.6, P.dark, -w / 2 + 0.3, bodyY - 0.2, 0);
        ['#00a3e0', '#e6007e', '#ffe600', '#1a1a1a', '#7fd3f5', '#f59ac6', '#f8fafc'].forEach((c, i) => {
          box(g, 0.035, 0.12, 0.03, c, -w / 2 + 0.13 + i * 0.058, bodyY - 0.2, d * 0.31, false);
        });
        lamp(g, w / 2 - 0.05, h - 0.04, d * 0.36);
        return mediaFlow(g, w, cw, bodyY, d);
      },
    };

    const MACHINES = {
      iridesse: {
        name: 'Xerox Iridesse Production Press',
        short: 'Iridesse',
        desc: 'Produktionspress med sex färgstationer – CMYK plus specialfärger som guld, silver, vitt och klart. Byggd med matare, big/trim, falsning och häftesmaskin i en lång linje.',
        depth: 0.85,
        modules: [
          { key: 'feeder', name: 'Högkapacitetsmatare', w: 0.85, h: 1.0, o: { drawers: 2 } },
          { key: 'iridesseEngine', name: 'Tryckmotor (6 färgstationer)', w: 2.2, h: 1.35 },
          { key: 'decurler', name: 'Interface-modul / decurler', w: 0.4, h: 1.05 },
          { key: 'inserter', name: 'Inserter (omslag/förtryckt)', w: 0.4, h: 1.15 },
          { key: 'creaseTrimmer', name: 'Big- & trimningsmodul', w: 0.6, h: 1.05 },
          { key: 'folder', name: 'C/Z-falsmodul', w: 0.5, h: 1.05 },
          { key: 'bookletFinisher', name: 'Häftes- & efterbehandling', w: 0.95, h: 1.2 },
        ],
      },
      versant280: {
        name: 'Xerox Versant 280 Press',
        short: 'Versant 280',
        desc: 'Kompakt digitalpress (CMYK) för korta upplagor. Här med extra matare, falsning och häftesmaskin.',
        depth: 0.8,
        modules: [
          { key: 'feeder', name: 'Extra matare (OHCF)', w: 0.75, h: 0.95, o: { drawers: 2 } },
          { key: 'versantEngine', name: 'Tryckmotor + skanner', w: 1.6, h: 1.1 },
          { key: 'decurler', name: 'Interface-modul / decurler', w: 0.35, h: 1.0 },
          { key: 'creaseTrimmer', name: 'Big- & trimningsmodul', w: 0.55, h: 1.0 },
          { key: 'folder', name: 'C/Z-falsmodul', w: 0.45, h: 1.0 },
          { key: 'bookletFinisher', name: 'Häftes- & efterbehandling', w: 0.9, h: 1.15 },
        ],
      },
      epsonS80600: {
        name: 'Epson SureColor S80600',
        short: 'Epson S80600',
        desc: 'Storformatsskrivare på rulle, 64" (ca 162 cm media) med solventbläck. För skyltar, banderoller, dekaler och fordonsfoliering – upp till 10 färger, bl.a. orange, röd och vit/metallsilver.',
        depth: 0.95,
        flow: 'roll',
        modules: [{ key: 'epsonS80600', name: 'Epson S80600 (64")', w: 2.65, h: 1.25 }],
      },
      hpLatex560: {
        name: 'HP Latex 560',
        short: 'HP Latex 560',
        desc: 'Storformatsskrivare på rulle, 64" med vattenbaserat latexbläck. Trycket härdas direkt i maskinen och är torrt när det kommer ut – bra till skyltar, tapeter, textil och inomhusmiljöer.',
        depth: 0.85,
        flow: 'roll',
        modules: [{ key: 'hpLatex560', name: 'HP Latex 560 (64")', w: 2.55, h: 1.4 }],
      },
      heatPress: {
        name: 'Klädtryck – värmepress',
        short: 'Klädtryck',
        desc: 'Station för klädtryck: värmepress på ett arbetsbord. Transfertryck eller vinyl läggs på plagget och pressas fast med värme och tryck. Här finns tröjor, transferark och vinyl till hands.',
        depth: 0.8,
        flow: 'station',
        modules: [{ key: 'heatPressStation', name: 'Värmepress på arbetsbord', w: 1.6, h: 1.35 }],
      },
      flatbed: {
        name: 'Planprinter (flatbädd)',
        short: 'Planprinter',
        desc: 'Äldre flatbäddsskrivare som trycker direkt på skivor – t.ex. kapa, forex, akryl och wellplast. En portal med skrivhuvuden åker fram och tillbaka över bädden. Generisk modell tills vi vet märket.',
        depth: 2.2,
        flow: 'station',
        modules: [{ key: 'flatbed', name: 'Flatbädd med portal', w: 4.2, h: 1.55 }],
      },
      guillotine: {
        name: 'Skärmaskin (pappersgiljotin)',
        short: 'Skärmaskin',
        desc: 'Planskärare som skär pappersbuntar rakt – för visitkort, flyers och broschyrer efter tryck. Kniven går ned när operatören trycker på båda knapparna samtidigt.',
        depth: 1.1,
        flow: 'station',
        modules: [{ key: 'guillotine', name: 'Giljotin med sidobord', w: 2.5, h: 1.55 }],
      },
      colorcut: {
        name: 'Colorcut FB9000',
        short: 'Colorcut',
        desc: 'Digital flatbäddsskärare för papper och kartong. Matar in ark automatiskt och skär ut former, etiketter, förpackningar och visitkort med kniv efter registreringsmärken.',
        depth: 1.0,
        flow: 'station',
        modules: [{ key: 'flatbedCutter', name: 'Matare, skärbord och utmatning', w: 3.4, h: 1.5 }],
      },
      summa: {
        name: 'Summa skärplotter',
        short: 'Summa',
        desc: 'Svart rullmatad skärplotter från Summa för vinyl och folie. Man laddar rullen och sedan skär den ut text, logotyper och dekaler helt själv.',
        depth: 0.75,
        flow: 'station',
        modules: [{ key: 'summaCutter', name: 'Skärplotter på stativ', w: 2.3, h: 1.25 }],
      },
    };

    // Bygger en maskin centrerad kring origo. Returnerar grupp + info om modulerna.
    function buildMachine(id) {
      const def = MACHINES[id];
      const group = new THREE.Group();
      const gap = 0.02, d = def.depth;
      const total = def.modules.reduce((s, m) => s + m.w, 0) + gap * (def.modules.length - 1);
      let x = -total / 2;
      const animators = [];
      const modules = def.modules.map((m, i) => {
        const g = new THREE.Group(); g.position.x = x + m.w / 2; group.add(g);
        const anim = MODULES[m.key](g, m.w, m.h, d, m.o);
        if (typeof anim === 'function') animators.push(anim);
        g.traverse(o => { if (o.isMesh) o.userData.module = i; });
        const info = { ...m, index: i, x: x + m.w / 2, group: g };
        x += m.w + gap;
        return info;
      });
      const height = Math.max(...def.modules.map(m => m.h));
      // höjd på ovansidan vid ett visst x (för pappersflöde-animation)
      const topAt = px => { for (const m of modules) if (px <= m.x + m.w / 2 + gap) return m.h; return modules[modules.length - 1].h; };
      return { group, def, modules, length: total, depth: d, height, topAt, animate: t => animators.forEach(a => a(t)) };
    }


    // ---------- Möbler & inredning ----------
    // Alla tar (förälder, x, z, rotY, ...) och returnerar en grupp. Framsidan pekar mot +z om inget annat sägs.
    const CLOTHES = ['#e07a5f', '#3d405b', '#81b29a', '#f2cc8f', '#ffffff', '#1f2937', '#6d9dc5', '#e5989b', '#9b5de5', '#f9844a'];
    function grp(p, x, z, rotY = 0) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; g.userData.furniture = true; p.add(g); return g; }
    const FURN = {
      plant(p, x, z, s = 1) {
        const g = grp(p, x, z); g.scale.setScalar(s);
        cyl(g, 0.3, 0.24, 0.5, '#e07a5f', 0, 0.25, 0);
        sph(g, 0.42, '#5fa05a', 0, 0.82, 0); sph(g, 0.3, '#6fb86a', 0.18, 1.12, 0.1); sph(g, 0.26, '#5fa05a', -0.2, 1.06, -0.1);
        return g;
      },
      // kontorsstol – ryggen åt +z (man sitter vänd mot -z)
      chair(p, x, z, rotY = 0, color = '#3d405b') {
        const g = grp(p, x, z, rotY);
        [0, Math.PI / 2].forEach(r => { box(g, 0.55, 0.04, 0.06, P.black, 0, 0.05, 0, false).rotation.y = r; });
        cyl(g, 0.03, 0.03, 0.4, P.mid, 0, 0.26, 0, false);
        box(g, 0.48, 0.08, 0.46, color, 0, 0.48, 0);
        box(g, 0.46, 0.5, 0.07, color, 0, 0.8, 0.22);
        return g;
      },
      // skrivbord med skärm – skärmen mot -z, stolen på +z-sidan
      desk(p, x, z, rotY = 0, accent = '#e07a5f') {
        const g = grp(p, x, z, rotY);
        box(g, 1.4, 0.05, 0.72, '#f4efe6', 0, 0.735, 0);
        [-0.66, 0.66].forEach(sx => box(g, 0.05, 0.71, 0.64, P.dark, sx, 0.355, 0));
        box(g, 1.27, 0.32, 0.02, P.dark, 0, 0.52, -0.32, false);
        box(g, 0.26, 0.02, 0.18, P.black, 0, 0.77, -0.2);
        box(g, 0.05, 0.24, 0.04, P.black, 0, 0.89, -0.23);
        const mon = box(g, 0.64, 0.38, 0.03, P.black, 0, 1.12, -0.2);
        glow(mon, new THREE.PlaneGeometry(0.58, 0.32), '#bfe3ff', 0, 0, 0.017);
        box(g, 0.46, 0.02, 0.15, '#e5e7eb', 0, 0.77, 0.1, false);
        box(g, 0.06, 0.02, 0.1, '#e5e7eb', 0.34, 0.77, 0.12, false);
        cyl(g, 0.04, 0.035, 0.1, accent, -0.5, 0.81, -0.02);
        box(g, 0.22, 0.03, 0.3, '#ffffff', 0.45, 0.775, -0.1, false);
        FURN.chair(g, 0, 0.6, 0);
        return g;
      },
      // klädställning med hängande plagg längs x
      clothingRack(p, x, z, rotY = 0, len = 1.4, seed = 0, metal = P.mid) {
        const g = grp(p, x, z, rotY);
        [-1, 1].forEach(sx => {
          cyl(g, 0.025, 0.025, 1.5, metal, sx * len / 2, 0.75, 0, false);
          box(g, 0.05, 0.04, 0.5, P.dark, sx * len / 2, 0.03, 0, false);
        });
        const rail = cyl(g, 0.02, 0.02, len, metal, 0, 1.48, 0, false); rail.rotation.z = Math.PI / 2;
        const n = Math.floor((len - 0.15) / 0.11);
        for (let i = 0; i < n; i++) {
          const c = CLOTHES[(i * 3 + seed) % CLOTHES.length];
          const sx = -len / 2 + 0.12 + i * 0.11;
          box(g, 0.05, 0.6, 0.44, c, sx, 1.13, 0);
          box(g, 0.03, 0.12, 0.62, c, sx, 1.36, 0, false); // axlar/ärmar
        }
        return g;
      },
      // vägghylla med vikta plagg och kepsar – rygg mot -z
      wallShelf(p, x, z, rotY = 0, w = 1.6, seed = 0) {
        const g = grp(p, x, z, rotY);
        box(g, w, 2.0, 0.04, '#8b5e3c', 0, 1.0, -0.2);
        [-1, 1].forEach(sx => box(g, 0.04, 2.0, 0.42, '#8b5e3c', sx * w / 2, 1.0, 0));
        [0.08, 0.5, 0.92, 1.34, 1.76].forEach((y, row) => {
          box(g, w, 0.03, 0.42, '#b5713f', 0, y, 0, false);
          if (row === 4) {
            for (let i = 0; i < Math.floor(w / 0.35); i++) {
              const c = CLOTHES[(i + seed) % CLOTHES.length], cx = -w / 2 + 0.2 + i * 0.35;
              const cap = sph(g, 0.11, c, cx, y + 0.02, 0); cap.scale.set(1, 0.75, 1);
              box(g, 0.14, 0.015, 0.12, c, cx, y + 0.025, 0.12, false);
            }
            return;
          }
          const stacks = Math.floor(w / 0.38);
          for (let i = 0; i < stacks; i++) {
            const c = CLOTHES[(i * 2 + row + seed) % CLOTHES.length];
            const k = 2 + ((i + row) % 3);
            for (let j = 0; j < k; j++) box(g, 0.3, 0.07, 0.3, c, -w / 2 + 0.22 + i * 0.38, y + 0.05 + j * 0.075, 0.02, j === k - 1);
          }
        });
        return g;
      },
      mannequin(p, x, z, rotY = 0, shirt = '#e07a5f', pants = '#3d405b') {
        const g = grp(p, x, z, rotY);
        cyl(g, 0.22, 0.25, 0.05, P.dark, 0, 0.025, 0);
        cyl(g, 0.025, 0.025, 0.6, P.mid, 0, 0.35, 0, false);
        cyl(g, 0.2, 0.17, 0.3, pants, 0, 0.75, 0);
        cyl(g, 0.24, 0.2, 0.5, shirt, 0, 1.1, 0);
        sph(g, 0.24, shirt, 0, 1.33, 0).scale.set(1.1, 0.5, 0.8);
        cyl(g, 0.05, 0.05, 0.1, '#e5e7eb', 0, 1.47, 0);
        sph(g, 0.14, '#e5e7eb', 0, 1.62, 0);
        return g;
      },
      // visningsbord med muggar, kepsar och tygkassar
      displayTable(p, x, z, rotY = 0, top = '#ecc89e', base = '#b5713f') {
        const g = grp(p, x, z, rotY);
        box(g, 1.5, 0.06, 0.85, top, 0, 0.75, 0);
        box(g, 1.3, 0.72, 0.7, base, 0, 0.36, 0);
        [-0.5, -0.25, 0, 0.25].forEach((mx, i) => { cyl(g, 0.055, 0.05, 0.12, '#ffffff', mx, 0.84, -0.22); cyl(g, 0.057, 0.057, 0.04, CLOTHES[i], mx, 0.85, -0.22, false); });
        [-0.4, 0.05].forEach((cx, i) => { const c = sph(g, 0.13, CLOTHES[i + 5], cx, 0.8, 0.15); c.scale.set(1, 0.7, 1); box(g, 0.16, 0.015, 0.14, CLOTHES[i + 5], cx, 0.79, 0.3, false); });
        [0.45, 0.6].forEach((bx, i) => box(g, 0.3, 0.35, 0.03, i ? '#f2cc8f' : '#81b29a', bx, 0.96, 0.1 - i * 0.2));
        return g;
      },
      // kunddisk – kunderna står på -z-sidan, personalen på +z-sidan
      serviceCounter(p, x, z, len = 4, rotY = 0, style = 'wood') {
        const g = grp(p, x, z, rotY);
        if (style === 'tisdag') {
          // svart disk med vitt lådskåp i mitten (som i butiken)
          box(g, len, 1.05, 0.7, '#2a2d33', 0, 0.525, 0);
          box(g, len + 0.1, 0.05, 0.84, '#1f2328', 0, 1.075, -0.02);
          const cw = Math.min(1.6, len * 0.4);
          box(g, cw, 1.12, 0.9, '#f4f4f2', 0, 0.56, -0.12);
          for (let i = 0; i < 4; i++) box(g, cw - 0.1, 0.012, 0.012, '#c9c9c4', 0, 0.28 + i * 0.26, -0.575, false);
          box(g, 0.012, 1.0, 0.012, '#c9c9c4', 0, 0.55, -0.575, false);
        } else {
          box(g, len, 1.05, 0.7, '#b5713f', 0, 0.525, 0);
          box(g, len + 0.12, 0.06, 0.86, '#ecc89e', 0, 1.08, -0.03);
          box(g, len - 0.2, 0.5, 0.02, '#e07a5f', 0, 0.55, -0.36, false);
        }
        // kassa/dator mot personalen
        box(g, 0.24, 0.02, 0.16, P.black, -len / 4, 1.12, 0.1);
        box(g, 0.05, 0.2, 0.04, P.black, -len / 4, 1.22, 0.08);
        const mon = box(g, 0.56, 0.34, 0.03, P.black, -len / 4, 1.42, 0.08); mon.rotation.y = Math.PI;
        glow(mon, new THREE.PlaneGeometry(0.5, 0.28), '#bfe3ff', 0, 0, 0.017);
        box(g, 0.1, 0.03, 0.18, P.black, len / 4, 1.13, -0.2).rotation.x = -0.3; // kortterminal
        // broschyrställ på kundsidan
        const br = box(g, 0.4, 0.3, 0.12, '#e5e7eb', len / 2 - 0.4, 1.26, -0.25);
        ['#e07a5f', '#81b29a', '#6d9dc5'].forEach((c, i) => box(br, 0.1, 0.22, 0.02, c, -0.13 + i * 0.13, 0.04, -0.065, false));
        return g;
      },
      // soffa – ryggen åt +z (vänd mot -z)
      sofa(p, x, z, rotY = 0, color = '#5b6472', w = 2.2) {
        const g = grp(p, x, z, rotY);
        [-1, 1].forEach(sx => [-1, 1].forEach(sz => box(g, 0.06, 0.1, 0.06, P.black, sx * (w / 2 - 0.1), 0.05, sz * 0.33, false)));
        box(g, w, 0.3, 0.85, color, 0, 0.25, 0);
        const n = Math.round(w / 0.7);
        for (let i = 0; i < n; i++) box(g, (w - 0.3) / n - 0.03, 0.12, 0.6, color, -w / 2 + 0.15 + ((w - 0.3) / n) * (i + 0.5), 0.46, -0.06);
        box(g, w, 0.5, 0.2, color, 0, 0.6, 0.33);
        [-1, 1].forEach(sx => box(g, 0.16, 0.5, 0.85, color, sx * (w / 2 - 0.08), 0.4, 0));
        return g;
      },
      // fåtölj – ryggen åt +z
      armchair(p, x, z, rotY = 0, color = '#f4c430') {
        const g = grp(p, x, z, rotY);
        [-1, 1].forEach(sx => [-1, 1].forEach(sz => box(g, 0.05, 0.12, 0.05, '#8b5e3c', sx * 0.32, 0.06, sz * 0.3, false)));
        box(g, 0.85, 0.28, 0.8, color, 0, 0.26, 0);
        box(g, 0.55, 0.1, 0.55, color, 0, 0.44, -0.05);
        box(g, 0.85, 0.52, 0.18, color, 0, 0.62, 0.31);
        [-1, 1].forEach(sx => box(g, 0.15, 0.42, 0.8, color, sx * 0.35, 0.4, 0));
        return g;
      },
      coffeeTable(p, x, z) {
        const g = grp(p, x, z);
        cyl(g, 0.5, 0.5, 0.05, '#ecc89e', 0, 0.42, 0, true, 28);
        cyl(g, 0.05, 0.05, 0.38, P.dark, 0, 0.2, 0, false);
        cyl(g, 0.25, 0.25, 0.03, P.dark, 0, 0.015, 0, false);
        cyl(g, 0.045, 0.04, 0.09, '#ffffff', 0.15, 0.49, 0.1);
        box(g, 0.28, 0.02, 0.2, '#e07a5f', -0.15, 0.455, -0.05, false).rotation.y = 0.3;
        box(g, 0.26, 0.02, 0.19, '#81b29a', -0.12, 0.475, -0.02, false).rotation.y = -0.2;
        return g;
      },
      rug(p, x, z, w, d, color = '#c9d6c3') {
        return box(p, w, 0.02, d, color, x, 0.01, z, false);
      },
      // vit ribbpanel (slatwall) mot vägg med plagg och kepsar – rygg mot -z
      slatwall(p, x, z, rotY = 0, w = 1.8, h = 2.0, seed = 0) {
        const g = grp(p, x, z, rotY);
        box(g, w, h, 0.05, '#f6f6f3', 0, h / 2 + 0.1, -0.2);
        for (let i = 1; i < 10; i++) box(g, w - 0.02, 0.012, 0.012, '#d4d4cf', 0, 0.1 + i * h / 10, -0.17, false);
        // plagg som hänger med framsidan utåt
        const n = Math.max(2, Math.floor(w / 0.5));
        for (let i = 0; i < n; i++) {
          const c = CLOTHES[(i * 3 + seed) % CLOTHES.length], cx = -w / 2 + w / n * (i + 0.5);
          box(g, 0.02, 0.02, 0.22, P.mid, cx, h * 0.72, -0.08, false);
          box(g, 0.42, 0.62, 0.06, c, cx, h * 0.72 - 0.38, -0.02);
          [-1, 1].forEach(sx => box(g, 0.1, 0.45, 0.05, c, cx + sx * 0.24, h * 0.72 - 0.33, -0.03, false));
        }
        // hylla med kepsar längst ned
        box(g, w - 0.1, 0.03, 0.3, '#f6f6f3', 0, 0.55, -0.05);
        for (let i = 0; i < Math.floor(w / 0.35); i++) {
          const c = CLOTHES[(i + seed + 4) % CLOTHES.length], cx = -w / 2 + 0.2 + i * 0.35;
          const cap = sph(g, 0.1, c, cx, 0.58, -0.05); cap.scale.set(1, 0.75, 1);
          box(g, 0.13, 0.015, 0.11, c, cx, 0.585, 0.06, false);
        }
        return g;
      },
      // hög glasmonter med kepsar, mössor och väskor
      glassCabinet(p, x, z, rotY = 0, seed = 0) {
        const g = grp(p, x, z, rotY);
        const w = 0.6, d = 0.45, h = 1.9;
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => box(g, 0.03, h, 0.03, '#c9c9c4', sx * w / 2, h / 2, sz * d / 2, false));
        box(g, w, 0.04, d, '#c9c9c4', 0, h, 0, false);
        const glass = new THREE.Mesh(new THREE.BoxGeometry(w - 0.02, h - 0.05, d - 0.02), new THREE.MeshBasicMaterial({ color: '#d6efff', transparent: true, opacity: 0.25, depthWrite: false }));
        glass.position.y = h / 2; g.add(glass);
        [0.1, 0.55, 1.0, 1.45].forEach((y, i) => {
          box(g, w - 0.04, 0.015, d - 0.04, '#e8f4fb', 0, y, 0, false);
          const c = CLOTHES[(i * 2 + seed) % CLOTHES.length];
          if (i % 2) { const b = sph(g, 0.12, c, 0, y + 0.12, 0); b.scale.set(1, 1.1, 1); }
          else { const cap = sph(g, 0.11, c, -0.1, y + 0.03, 0); cap.scale.set(1, 0.75, 1); box(g, 0.24, 0.25, 0.12, CLOTHES[(i + 5) % CLOTHES.length], 0.14, y + 0.135, 0); }
        });
        return g;
      },
      // pallställ – längs x, framsidan mot +z
      palletRack(p, x, z, rotY = 0, len = 4.6, d = 1.1, h = 2.6) {
        const g = grp(p, x, z, rotY);
        const bays = Math.max(1, Math.round(len / 2.3)), bw = len / bays;
        for (let i = 0; i <= bays; i++) [-1, 1].forEach(sz => box(g, 0.08, h, 0.08, '#2563eb', -len / 2 + i * bw, h / 2, sz * (d / 2 - 0.04)));
        [0.15, 1.35].forEach(y => [-1, 1].forEach(sz => box(g, len, 0.1, 0.06, '#f97316', 0, y, sz * (d / 2 - 0.04))));
        box(g, len, 0.1, 0.06, '#f97316', 0, h - 0.1, d / 2 - 0.04); box(g, len, 0.1, 0.06, '#f97316', 0, h - 0.1, -d / 2 + 0.04);
        const cartons = ['#c8a06a', '#d9b386', '#b98d5a'];
        for (let i = 0; i < bays; i++) [0.2, 1.4].forEach((y, lvl) => {
          const cx = -len / 2 + bw * (i + 0.5);
          box(g, bw * 0.75, 0.12, d * 0.9, '#b5713f', cx, y + 0.11, 0);
          const n = (i + lvl) % 3 + 1;
          for (let k = 0; k < n; k++) box(g, bw * 0.65, 0.3, d * 0.75, cartons[(i + k + lvl) % 3], cx, y + 0.32 + k * 0.31, 0);
        });
        return g;
      },
      // packbord med kartonger, tejp och våg – framsidan mot +z
      packTable(p, x, z, rotY = 0, w = 3.2, d = 1.2) {
        const g = grp(p, x, z, rotY);
        box(g, w, 0.06, d, '#ecc89e', 0, 0.9, 0);
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => box(g, 0.07, 0.87, 0.07, P.dark, sx * (w / 2 - 0.06), 0.435, sz * (d / 2 - 0.06)));
        box(g, w - 0.1, 0.04, d - 0.1, '#d9b386', 0, 0.2, 0);
        for (let i = 0; i < 4; i++) box(g, 0.9, 0.04, 0.7, '#c8a06a', -w / 2 + 0.6, 0.24 + i * 0.045, 0, false); // platta kartonger
        box(g, 0.6, 0.4, 0.45, '#c8a06a', -w / 2 + 0.5, 1.13, -0.15);
        box(g, 0.45, 0.3, 0.35, '#d9b386', -w / 2 + 1.1, 1.08, -0.2);
        box(g, 0.5, 0.06, 0.4, P.mid, w / 2 - 0.5, 0.96, -0.1); // våg
        glow(g, new THREE.PlaneGeometry(0.15, 0.06), '#7ee8d0', w / 2 - 0.5, 0.965, 0.11);
        const tape = cyl(g, 0.08, 0.08, 0.06, '#e07a5f', 0.2, 1.0, 0.25); tape.rotation.x = Math.PI / 2;
        const film = cyl(g, 0.12, 0.12, 0.5, '#e5e7eb', 0.8, 0.13, 0.3); film.rotation.z = Math.PI / 2;
        return g;
      },
      // garageport (uppfälld) – bredd längs x
      garageDoor(p, x, z, rotY = 0, w = 4, h = 3) {
        const g = grp(p, x, z, rotY); g.userData.furniture = false;
        [-1, 1].forEach(sx => {
          box(g, 0.25, h, 0.3, P.mid, sx * (w / 2 + 0.12), h / 2, 0);
          for (let i = 0; i < 5; i++) box(g, 0.26, 0.2, 0.02, i % 2 ? '#1f2937' : '#facc15', sx * (w / 2 + 0.12), 0.2 + i * 0.4, 0.16, false);
        });
        box(g, w + 0.5, 0.4, 0.5, P.light, 0, h + 0.2, 0);
        const roll = cyl(g, 0.22, 0.22, w, '#cbd5e1', 0, h - 0.15, -0.1); roll.rotation.z = Math.PI / 2;
        return g;
      },
      // skåpbil – längs z, fronten mot +z
      van(p, x, z, rotY = 0, color = '#f4efe6') {
        const g = grp(p, x, z, rotY);
        const glass = '#7fb8e6';
        // lastutrymme
        box(g, 1.9, 1.7, 3.3, color, 0, 1.3, -0.75);
        // hytt (lite smalare så ytorna inte krockar)
        box(g, 1.84, 1.05, 1.15, color, 0, 1.0, 1.45);
        const hood = box(g, 1.84, 0.12, 0.75, color, 0, 1.25, 1.55); hood.rotation.x = 0.35;
        box(g, 1.86, 0.5, 0.35, color, 0, 0.72, 2.15);
        // rutor
        const ws = box(g, 1.6, 0.55, 0.04, glass, 0, 1.68, 1.02, false); ws.rotation.x = -0.45;
        [-1, 1].forEach(sx => box(g, 0.02, 0.4, 0.7, glass, sx * 0.93, 1.3, 1.35, false));
        // dekor + lyktor + stötfångare
        [-1, 1].forEach(sx => box(g, 0.02, 0.25, 3.0, '#e07a5f', sx * 0.96, 1.05, -0.75, false));
        box(g, 1.9, 0.18, 0.12, P.dark, 0, 0.5, 2.35);
        box(g, 1.9, 0.18, 0.1, P.dark, 0, 0.5, -2.45);
        [-0.65, 0.65].forEach(sx => glow(g, new THREE.BoxGeometry(0.3, 0.12, 0.02), '#fde68a', sx, 0.85, 2.33));
        [-0.75, 0.75].forEach(sx => glow(g, new THREE.BoxGeometry(0.15, 0.3, 0.02), '#ef4444', sx, 1.0, -2.41));
        // hjul
        [[-1, 1.45], [1, 1.45], [-1, -1.55], [1, -1.55]].forEach(([sx, wz]) => {
          const w = cyl(g, 0.36, 0.36, 0.28, P.black, sx * 0.86, 0.36, wz); w.rotation.z = Math.PI / 2;
          const hub = cyl(g, 0.15, 0.15, 0.3, P.mid, sx * 0.86, 0.36, wz, false); hub.rotation.z = Math.PI / 2;
        });
        return g;
      },
      // dörr i öppning med glasruta – bredd längs x
      door(p, x, z, rotY = 0, w = 1.2, h = 2.2) {
        const g = grp(p, x, z, rotY);
        g.userData.furniture = false; // dörren ska gå att gå igenom
        [-1, 1].forEach(sx => box(g, 0.08, h, 0.24, P.dark, sx * (w / 2 + 0.04), h / 2, 0));
        box(g, w + 0.16, 0.1, 0.24, P.dark, 0, h + 0.05, 0);
        const leaf = new THREE.Group(); leaf.position.set(-w / 2, 0, 0); leaf.rotation.y = -1.1; g.add(leaf);
        box(leaf, w / 2, h - 0.05, 0.05, P.dark, w / 4, h / 2, 0);
        const glass = new THREE.Mesh(new THREE.BoxGeometry(w / 2 - 0.12, h - 0.4, 0.055), new THREE.MeshBasicMaterial({ color: '#bfe3ff', transparent: true, opacity: 0.6 }));
        glass.position.set(w / 4, h / 2 + 0.05, 0); leaf.add(glass);
        return g;
      },
    };


    // ---------- Logga som utskuren frigolitskylt (3D-bokstäver från SVG) ----------
    // SVGLoaderClass = three/addons SVGLoader. Skylten ligger i XY-planet och pekar mot +z.
    function buildLogoSign(SVGLoaderClass, svgText, { width = 2.4, depth = 0.06, color = '#fafafa' } = {}) {
      const data = new SVGLoaderClass().parse(svgText);
      const shapes = data.paths.flatMap(p => SVGLoaderClass.createShapes(p));
      const geo = new THREE.ExtrudeGeometry(shapes, { depth: 1, bevelEnabled: false, curveSegments: 6 });
      geo.computeBoundingBox();
      const bb = geo.boundingBox, sw = bb.max.x - bb.min.x, k = width / sw;
      geo.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, 0);
      geo.scale(k, -k, depth); // SVG har y nedåt
      geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, new THREE.MeshToonMaterial({ color, gradientMap: grad, side: THREE.DoubleSide }));
      mesh.castShadow = true;
      const g = new THREE.Group(); g.add(mesh);
      g.userData.size = { w: width, h: (bb.max.y - bb.min.y) * k };
      return g;
    }

    return { THREE, grad, mat, outlineMat, box, cyl, sph, glow, makePerson, MACHINES, buildMachine, FURN, P, buildLogoSign };
  }
  window.TryckeriModels = { create };
})();
