// Planlösning för tryckeriet, efter skissen. Mått i meter (skissen skalad ca 0,105 m per pixel).
// Koordinater: x = vänster→höger på ritningen, z = uppifrån→nedåt.
// Fyra rum: Klädtryck (remsa överst), Profilkläder (uppe till höger, med 45°-kant),
// Kontor (avlångt, under profilrummet) och Maskinhall (stora rummet till vänster).
// Används av lokal.html (och senare spelet).
(function () {
  // Beräknar en roterad kollisionsruta (OBB) för ett objekt: {x, z, hw, hd, rot}
  function colliderOf(THREE, obj, pad = 0) {
    const ry = obj.rotation.y; obj.rotation.y = 0; obj.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(obj);
    obj.rotation.y = ry; obj.updateMatrixWorld(true);
    const ox = (b.min.x + b.max.x) / 2 - obj.position.x, oz = (b.min.z + b.max.z) / 2 - obj.position.z;
    const c = Math.cos(ry), s = Math.sin(ry);
    return { x: obj.position.x + ox * c + oz * s, z: obj.position.z - ox * s + oz * c, hw: (b.max.x - b.min.x) / 2 + pad, hd: (b.max.z - b.min.z) / 2 + pad, rot: ry, top: b.max.y };
  }

  function build(M, THREE, opts = {}) {
    const { box, FURN, makePerson } = M;
    const root = new THREE.Group();
    const labels = [];
    const colliders = [];
    const solid = (obj, pad = 0.03) => { root.updateMatrixWorld(true); colliders.push(colliderOf(THREE, obj, pad)); return obj; };

    const H = 2.6;      // full vägghöjd (bortre ytterväggar)
    const MID = 1.2;    // innerväggar – halvhöga så man ser in i rummen
    const LOW = 0.3;    // ytterväggar närmast kameran (dockskåpsvy)
    const WALL = '#f4efe6', INNER = '#e9dfcf', BLACK = '#2a2d33';

    // ---------- Mått från skissen ----------
    const W = 18.3;          // hela husets bredd
    const D = 21.5;          // huvuddelens djup
    const TOP = -3.7;        // överkant på klädtrycks-remsan
    const PX = 8.7;          // profilrummets vänstra vägg
    const DIAG_Z = 5.3;      // där 45°-kanten börjar
    const OX = 13.1;         // kontorets vänstra vägg (= där snedkanten slutar)
    const OZ = 10.0;         // gräns profilrum / kontor (disken)

    // ---------- Hjälpare ----------
    function floor(points, c1, c2, tile) {
      const shape = new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, -z)));
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.15, bevelEnabled: false });
      const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
      g.fillStyle = c1; g.fillRect(0, 0, 64, 64); g.fillStyle = c2; g.fillRect(0, 0, 32, 32); g.fillRect(32, 32, 32, 32);
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.magFilter = THREE.NearestFilter; tex.repeat.set(1 / (tile * 2), 1 / (tile * 2));
      const m = new THREE.Mesh(geo, [new THREE.MeshToonMaterial({ map: tex, gradientMap: M.grad }), M.mat('#c9b79c')]);
      m.rotation.x = -Math.PI / 2; m.position.y = -0.15; m.receiveShadow = true; root.add(m);
    }
    function wall(x1, z1, x2, z2, h = H, color = WALL, t = 0.2) {
      const len = Math.hypot(x2 - x1, z2 - z1);
      const m = box(root, len + t, h, t, color, (x1 + x2) / 2, h / 2, (z1 + z2) / 2);
      m.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
      return solid(m, 0);
    }
    const label = (text, x, y, z, cls = '') => labels.push({ text, pos: new THREE.Vector3(x, y, z), cls });

    // ---------- Golv ----------
    const LX2 = 9.0;         // gräns lager / klädtryck i övre remsan
    const LAGER = [[0, TOP], [LX2, TOP], [LX2, 0], [0, 0]];
    const KLADTRYCK = [[LX2, TOP], [W, TOP], [W, 0], [LX2, 0]];
    const PROFIL = [[PX, 0], [W, 0], [W, OZ], [OX, OZ], [PX, DIAG_Z]];
    const KONTOR = [[OX, OZ], [W, OZ], [W, D], [OX, D]];
    const HALL = [[0, 0], [PX, 0], [PX, DIAG_Z], [OX, OZ], [OX, D], [0, D]];
    floor(LAGER, '#c9c9c4', '#bfbfba', 1);
    floor(KLADTRYCK, '#4a4d53', '#44474d', 0.5);       // mörk matta
    floor(PROFIL, '#c9c9c4', '#bfbfba', 1);             // beige/grått golv (samma som lager och hall)
    floor(KONTOR, '#4a4d53', '#44474d', 0.5);           // mörk matta
    floor(HALL, '#c9c9c4', '#bfbfba', 1);

    // ---------- Väggar ----------
    // bortre ytterväggar (hela höjden)
    wall(0, TOP, W, TOP);                                    // överkant
    wall(0, TOP, 0, D);                                      // vänster
    // närmre ytterväggar (låga)
    wall(W, TOP, W, 0, LOW); wall(W, 0, W, 1.8, LOW, BLACK); wall(W, 3.2, W, OZ, LOW, BLACK); wall(W, OZ, W, D, LOW);
    wall(0, D, 7.3, D, LOW); wall(11.7, D, W, D, LOW);       // nedre vägg med garageport
    // entré: vindfång utanför huset med två dörrar – innerdörr i ytterväggen och ytterdörr längst ut
    FURN.door(root, W, 2.5, Math.PI / 2, 1.4);                // innerdörr
    const VX = W + 1.7;                                        // vindfångets yttervägg
    floor([[W, 1.3], [VX, 1.3], [VX, 3.7], [W, 3.7]], '#4a4d53', '#44474d', 0.5);
    function glassWall(x1, z1, x2, z2, h = 2.2) {
      const len = Math.hypot(x2 - x1, z2 - z1), g = new THREE.Group();
      g.position.set((x1 + x2) / 2, 0, (z1 + z2) / 2); g.rotation.y = -Math.atan2(z2 - z1, x2 - x1); root.add(g);
      [-1, 1].forEach(sx => box(g, 0.06, h, 0.08, BLACK, sx * len / 2, h / 2, 0));
      box(g, len, 0.06, 0.08, BLACK, 0, h, 0); box(g, len, 0.1, 0.08, BLACK, 0, 0.05, 0);
      const glass = new THREE.Mesh(new THREE.BoxGeometry(len - 0.06, h - 0.12, 0.03), new THREE.MeshBasicMaterial({ color: '#bfe3ff', transparent: true, opacity: 0.35, depthWrite: false }));
      glass.position.y = h / 2 + 0.02; g.add(glass);
      return solid(g, 0);
    }
    glassWall(W, 1.3, VX, 1.3);
    glassWall(W, 3.7, VX, 3.7);
    glassWall(VX, 1.3, VX, 1.95);
    glassWall(VX, 3.05, VX, 3.7);
    FURN.door(root, VX, 2.5, Math.PI / 2, 1.1);              // ytterdörr
    box(root, 1.2, 0.03, 1.8, '#3d405b', W + 0.85, 0.015, 2.5, false); // entrématta i vindfånget
    label('Entré', W + 0.85, 2.7, 2.5);
    // klädtryck ↔ resten (öppningar till maskinhallen och profilrummet)
    wall(0, 0, 2.0, 0, MID, INNER, 0.15);
    wall(3.6, 0, 9.2, 0, MID, INNER, 0.15);
    wall(12.4, 0, W, 0, MID, BLACK, 0.15);
    // profilrummets vänstra vägg + 45°-kanten
    wall(PX, 0, PX, DIAG_Z, MID, BLACK, 0.15);
    wall(PX, DIAG_Z, OX, OZ, MID, BLACK, 0.15);
    // kontorets vänstra vägg mot maskinhallen, med dörröppning
    wall(OX, OZ, OX, OZ + 1.4, MID, BLACK, 0.15);
    wall(OX, OZ + 2.8, OX, D - 4.0, MID, BLACK, 0.15);
    wall(OX, D - 4.0, OX, D, H - 0.2, BLACK, 0.15);           // högre vägg vid soffhörnan med loggan
    // profilrum ↔ kontor: halvvägg, disk, passage längst till höger
    wall(OX, OZ, 13.6, OZ, 1.05, BLACK, 0.15);

    // ---------- Lager (övre remsan, vänster) ----------
    label('Lager', LX2 / 2, 2.8, TOP / 2);
    wall(LX2, TOP, LX2, -2.6, MID, INNER, 0.15);             // vägg mot klädtryck, öppning nedtill
    FURN.palletRack(root, 2.3, TOP + 0.7, 0, 4.2, 1.1);
    FURN.palletRack(root, 6.6, TOP + 0.7, 0, 4.0, 1.1);
    // pallar med papper
    [[5.2, -1.0], [6.6, -1.0], [8.0, -1.0]].forEach(([px, pz], i) => {
      const g = new THREE.Group(); g.position.set(px, 0, pz); g.userData.furniture = true; root.add(g);
      box(g, 1.2, 0.14, 1.0, '#b5713f', 0, 0.07, 0);
      for (let k = 0; k < 3 + (i % 2); k++) box(g, 1.05, 0.22, 0.9, k % 2 ? '#f8fafc' : '#e2e8f0', 0, 0.25 + k * 0.23, 0);
    });

    // ---------- Klädtryck (övre remsan, höger) ----------
    label('Klädtryck', 13.4, 2.6, TOP / 2);
    const press = M.buildMachine('heatPress');
    press.group.position.set(W - 1.1, 0, -2.6); root.add(press.group);   // värmepressen längst till höger
    // hyllor med plagg att trycka på
    [10.0, 11.7, 13.4, 15.1].forEach((x, i) => FURN.wallShelf(root, x, TOP + 0.3, 0, 1.6, i * 2));
    FURN.clothingRack(root, 12.6, -1.3, 0, 2.0, 5);
    FURN.clothingRack(root, 15.3, -1.3, 0, 1.6, 2);

    // ---------- Profilkläder ----------
    label('Profilkläder', 13.5, 2.9, 4.6);
    // vita ribbpaneler med plagg på de svarta väggarna (som i butiken)
    [13.4, 15.3, 17.2].forEach((x, i) => FURN.slatwall(root, x, 0.3, 0, 1.8, 2.0, i * 3));
    [4.8, 6.7, 8.6].forEach((z, i) => FURN.slatwall(root, W - 0.3, z, -Math.PI / 2, 1.8, 2.0, i * 2 + 1));
    [1.1, 3.0, 4.6].forEach((z, i) => FURN.slatwall(root, PX + 0.25, z, Math.PI / 2, 1.6, 2.0, i * 3 + 2));
    // svarta klädställningar
    FURN.clothingRack(root, 12.0, 3.4, 0, 1.6, 0, '#1f2328');
    FURN.clothingRack(root, 14.6, 3.4, 0, 1.6, 4, '#1f2328');
    FURN.clothingRack(root, 12.2, 5.9, 0, 1.6, 7, '#1f2328');
    FURN.clothingRack(root, 14.8, 5.9, 0, 1.6, 2, '#1f2328');
    FURN.glassCabinet(root, 10.2, 1.0, 0, 4);
    FURN.displayTable(root, 13.3, 8.1, 0, '#f6f6f3', '#2a2d33');
    FURN.displayTable(root, 16.1, 8.1, 0, '#f6f6f3', '#2a2d33');
    FURN.mannequin(root, 11.4, 1.3, 0.3, '#e07a5f');
    FURN.mannequin(root, 9.9, 5.6, 0.8, '#3d405b', '#6b4f3a');
    FURN.plant(root, W - 0.6, 0.8, 0.9);

    // ---------- Disk (mellan profilrummet och kontoret) ----------
    FURN.serviceCounter(root, 15.5, OZ, 3.6, 0, 'tisdag');
    label('Disk', 15.5, 1.9, OZ);

    // ---------- Kontor: 2 rader om 4 längs med rummet, en i mitten och en mot högra väggen ----------
    label('Kontor', 15.7, 2.4, OZ + 1.6);
    const deskZ = [OZ + 1.9, OZ + 3.4, OZ + 4.9, OZ + 6.4];
    [15.9, W - 0.46].forEach((x, r) => deskZ.forEach((z, i) => FURN.desk(root, x, z, -Math.PI / 2, ['#e07a5f', '#81b29a', '#6d9dc5', '#f2cc8f'][(i + r) % 4])));
    // soffhörna längst ned
    const LX = (OX + W) / 2;
    FURN.rug(root, LX, D - 1.6, 4.2, 2.9);
    FURN.coffeeTable(root, LX, D - 1.8);
    FURN.sofa(root, LX, D - 0.65, 0, '#5b6472', 2.4);
    FURN.armchair(root, LX - 1.5, D - 1.9, -Math.PI / 2);
    FURN.armchair(root, LX + 1.5, D - 1.9, Math.PI / 2);
    FURN.armchair(root, LX, D - 3.2, Math.PI);
    FURN.plant(root, OX + 0.5, D - 0.5, 0.8);
    FURN.plant(root, W - 0.5, D - 0.5, 0.8);
    label('Soffhörna', LX + 0.6, 1.1, D - 1.2);
    // plats för Tisdag-loggan som frigolitskylt på den svarta väggen (byggs i sidan som laddar SVG:n)
    const signSpot = { x: OX + 0.09, y: 1.55, z: D - 2.0, rotY: Math.PI / 2, width: 2.6 };

    // ---------- Maskinhall ----------
    label('Maskinhall', 1.8, 3.2, 14.6);
    // punkt längs snedväggen (t = meter från övre änden), flyttad ut i hallen
    const dl = Math.hypot(OX - PX, OZ - DIAG_Z), ux = (OX - PX) / dl, uz = (OZ - DIAG_Z) / dl;
    const alongDiag = (t, off) => [PX + ux * t - uz * off, DIAG_Z + uz * t + ux * off];
    const diagRot = -Math.atan2(uz, ux);
    const [c1x, c1z] = alongDiag(1.9, 0.7), [c2x, c2z] = alongDiag(4.5, 0.7);
    // [id, x, z, rotation, etikett]  – framsidan pekar mot +z vid rotation 0
    const machineSpots = [
      ['epsonS80600', 5.0, 1.4, 0, 'Epson 1'],            // överst
      ['epsonS80600', 5.3, 5.6, 0, 'Epson 2'],            // under, i mitten
      ['epsonS80600', PX - 0.55, 3.0, -Math.PI / 2, 'Epson 3'], // på högkant mot profilrummets vägg
      ['hpLatex560', 0.9, 4.2, Math.PI / 2],               // längs vänstra väggen
      ['flatbed', 4.6, 9.4, 0],                            // planprintern
      ['guillotine', c1x, c1z, diagRot, 'Skärmaskin 1'],   // två skärmaskiner längs 45°-väggen
      ['guillotine', c2x, c2z, diagRot, 'Skärmaskin 2'],
      ['iridesse', 6.6, 13.2, Math.PI],                    // de stora pressarna rygg mot rygg
      ['versant280', 6.4, 14.3, 0],
      ['colorcut', 3.0, 17.3, 0, 'Colorcut FB9000'],       // utskärningsmaskin ovanför packbordet
      ['summa', 0.8, 10.2, Math.PI / 2, 'Summa'],          // skärplotter längs vänstra väggen
    ];
    const machines = [press, ...machineSpots.map(([id, x, z, ry, name]) => {
      const m = M.buildMachine(id);
      m.group.position.set(x, 0, z); m.group.rotation.y = ry; root.add(m.group);
      m.spotName = name || m.def.short;
      if (!opts.game) label(m.spotName, x, m.height + 0.9, z, 'small');
      return m;
    })];
    press.spotName = 'Värmepress';
    // nycklar som spelet använder för varje maskinplats
    ['press', 'epson1', 'epson2', 'epson3', 'hp', 'flatbed', 'cut1', 'cut2', 'iridesse', 'versant', 'colorcut', 'summa'].forEach((k, i) => { machines[i].key = k; });

    // ---------- Garage, pallställ och packbord (nederst i hallen) ----------
    const GX1 = 7.1, GX2 = 11.9, GZ1 = 15.2;
    box(root, GX2 - GX1, 0.02, D - GZ1, '#b4b0aa', (GX1 + GX2) / 2, 0.01, (GZ1 + D) / 2, false);
    [[GX1, GZ1, GX1, D], [GX2, GZ1, GX2, D], [GX1, GZ1, GX2, GZ1]].forEach(([x1, z1, x2, z2]) =>
      box(root, Math.max(0.1, x2 - x1), 0.025, Math.max(0.1, z2 - z1), '#facc15', (x1 + x2) / 2, 0.012, (z1 + z2) / 2, false));
    FURN.garageDoor(root, (GX1 + GX2) / 2, D, 0, 4.0, 3.0);
    label('Garage', (GX1 + GX2) / 2, 3.4, D);
    FURN.palletRack(root, 6.05, 19.15, Math.PI / 2, 4.6, 1.1);
    label('Pallställ', 6.05, 3.0, 19.15);
    FURN.packTable(root, 3.3, D - 0.75, Math.PI, 3.2, 1.2);
    label('Packbord', 3.3, 1.9, D - 0.75);

    // ---------- Folk för liv och skala ----------
    const people = new THREE.Group(); if (!opts.game) root.add(people);
    FURN.van(people, 9.5, 18.4, Math.PI);
    const add = (opts, x, z, ry) => { const p = makePerson(opts); p.position.set(x, 0, z); p.rotation.y = ry; people.add(p); return p; };
    add({ shirt: '#f2cc8f', skin: '#f1c27d', hair: '#5a3825', pants: '#3d405b', player: true }, 15.0, OZ + 0.55, Math.PI);
    add({ shirt: '#6d9dc5', skin: '#e0ac69', hair: '#2b1d14' }, 14.8, OZ - 0.85, 0);
    add({ shirt: '#e5989b', skin: '#ffdbac', hair: '#d4a017' }, 13.3, 2.0, Math.PI);
    add({ shirt: '#81b29a', skin: '#8d5524', hair: '#1a1a1a', pants: '#3d405b', player: true }, W - 1.1, -1.75, Math.PI);
    add({ shirt: '#9b5de5', skin: '#f1c27d', hair: '#a52a2a', pants: '#3d405b', player: true }, 3.6, 3.4, Math.PI);
    // möbler som man inte kan gå igenom
    root.children.forEach(o => { if (o.isGroup && o.userData.furniture) solid(o); });

    return {
      group: root, labels, people, machines, colliders, signSpot,
      colliderOf: (obj, pad) => colliderOf(THREE, obj, pad),
      center: new THREE.Vector3(W / 2, 0, (TOP + D) / 2), size: { w: W, d: D - TOP },
      bounds: { x1: 0.3, x2: W - 0.3, z1: TOP + 0.3, z2: D - 0.3 },
      dims: { W, D, TOP, PX, DIAG_Z, OX, OZ },
      // spelpunkter
      entrance: { outside: new THREE.Vector3(W + 3.2, 0, 2.5), aisleX: W - 1.0 },
      slots: [14.3, 16.7, 15.5],   // kassaplatser längs disken (x)
      counterZ: OZ,
      playerStart: new THREE.Vector3(15.5, 0, OZ + 1.1),
      dropTable: { x: 11.4, z: OZ + 5.2, rot: Math.PI / 2 },
    };
  }
  window.TryckeriLokal = { build };
})();
