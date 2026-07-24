import * as THREE from "three";

export function buildLevel(scene, collision) {
  const group = new THREE.Group();
  scene.add(group);

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x35342f,
    roughness: 0.95,
    metalness: 0.05,
  });
  const darkStone = new THREE.MeshStandardMaterial({ color: 0x22201c, roughness: 1 });
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0x1a3a2a,
    emissive: 0x0a2818,
    emissiveIntensity: 0.8,
    roughness: 0.9,
  });
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x0a1520,
    roughness: 0.2,
    metalness: 0.4,
    transparent: true,
    opacity: 0.85,
  });

  function floor(w, d, x, z, mat = stoneMat) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0, z);
    m.receiveShadow = true;
    group.add(m);
  }

  function wallBox(w, h, d, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), stoneMat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  }

  function pillar(x, z, r = 0.6, h = 3.5) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.1, h, 8), darkStone);
    m.position.set(x, h / 2, z);
    m.castShadow = true;
    group.add(m);
    collision.addCircle(x, z, r + 0.3);
    return { x, z, r: r + 0.5 };
  }

  const coverSpots = [];

  // ===== ① 入口回廊 =====
  floor(6, 30, 0, -12);
  wallBox(6, 2.4, 0.3, 0, 1.2, 5.15); // 入口壁
  wallBox(0.3, 2.4, 30, -3.15, 1.2, -12);
  wallBox(0.3, 2.4, 30, 3.15, 1.2, -12);
  wallBox(6, 2.4, 0.3, 0, 1.2, -27.15); // 回廊終端
  wallBox(6, 0.3, 30, 0, 2.55, -12); // 天井

  // 回廊の左右・背後の壁(薄いコリジョン帯)
  collision.addWall(-3.3, -2.5, 4, -28);
  collision.addWall(2.5, 3.3, 4, -28);
  collision.addWall(-2.5, 2.5, 4, 5);

  // 瓦礫
  [[-1.6, -6], [1.8, -13], [-1.2, -18]].forEach(([x, z]) => {
    const d = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 1.2), darkStone);
    d.position.set(x, 0.7, z);
    d.castShadow = true;
    group.add(d);
    collision.addCircle(x, z, 0.9);
  });

  // 水たまり(チュートリアル)
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(1.5, 16), new THREE.MeshStandardMaterial({
    color: 0x1a2530,
    roughness: 0.1,
    metalness: 0.6,
  }));
  puddle.rotation.x = -Math.PI / 2;
  puddle.position.set(0, 0.02, -22);
  group.add(puddle);

  // ===== ② 分岐回廊 =====
  // 左: 祈祷の間
  floor(8, 14, -6, -36);
  wallBox(0.3, 2.4, 14, -2.15, 1.2, -36);
  wallBox(0.3, 2.4, 14, -9.85, 1.2, -36);
  wallBox(8, 2.4, 0.3, -6, 1.2, -43.15);
  wallBox(8, 0.3, 14, -6, 2.55, -36);

  // 右: 使徒の墓所
  floor(8, 14, 6, -36);
  wallBox(0.3, 2.4, 14, 2.15, 1.2, -36);
  wallBox(0.3, 2.4, 14, 9.85, 1.2, -36);
  wallBox(8, 2.4, 0.3, 6, 1.2, -43.15);
  wallBox(8, 0.3, 14, 6, 2.55, -36);

  // 分岐接続部の壁(中央通路)
  wallBox(4, 2.4, 0.3, 0, 1.2, -28.15);

  collision.addWall(-10.3, -2, -28, -43);
  collision.addWall(-10, -9.7, -28, -43);
  collision.addWall(-10, -2, -43, -43.3);
  collision.addWall(2, 10.3, -28, -43);
  collision.addWall(9.7, 10, -28, -43);
  collision.addWall(2, 10, -43, -43.3);

  // ===== ③ 水没大聖堂 =====
  floor(32, 36, 0, -62, waterMat);
  // 外壁
  wallBox(0.5, 5, 36, -16.25, 2.5, -62);
  wallBox(0.5, 5, 36, 16.25, 2.5, -62);
  wallBox(32, 5, 0.5, 0, 2.5, -44.25);
  wallBox(32, 5, 0.5, 0, 2.5, -79.75);

  collision.addWall(-16.3, 16.3, -44, -80);
  collision.addWall(-16, 16, -44, -43.7);
  collision.addWall(-16, 16, -79.7, -80);

  // 石柱(隠れ場所)
  coverSpots.push(pillar(-8, -52));
  coverSpots.push(pillar(8, -52));
  coverSpots.push(pillar(-10, -65));
  coverSpots.push(pillar(10, -65));
  coverSpots.push(pillar(0, -58));

  // 燐光模様
  [[-14, -50], [12, -55], [-5, -70], [14, -72]].forEach(([x, z]) => {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), glowMat);
    g.rotation.y = Math.random() * Math.PI;
    g.position.set(x, 1.5, z);
    group.add(g);
    const pl = new THREE.PointLight(0x1a5040, 0.4, 6);
    pl.position.set(x, 1.5, z);
    group.add(pl);
  });

  // ===== ④ 書庫 (左) =====
  floor(8, 12, -20, -58);
  wallBox(0.3, 3, 12, -16.15, 1.5, -58);
  wallBox(0.3, 3, 12, -23.85, 1.5, -58);
  wallBox(8, 3, 0.3, -20, 1.5, -52.15);
  wallBox(8, 3, 0.3, -20, 1.5, -63.85);
  collision.addWall(-24.3, -16, -52, -64);
  collision.addWall(-24, -16.3, -52, -64);
  collision.addWall(-24, -16, -52, -51.7);
  collision.addWall(-24, -16, -63.7, -64);

  // ===== ⑤ 生贄の間 (右) =====
  floor(8, 12, 20, -58);
  wallBox(0.3, 3, 12, 16.15, 1.5, -58);
  wallBox(0.3, 3, 12, 23.85, 1.5, -58);
  wallBox(8, 3, 0.3, 20, 1.5, -52.15);
  wallBox(8, 3, 0.3, 20, 1.5, -63.85);
  collision.addWall(16, 24.3, -52, -64);
  collision.addWall(23.7, 24, -52, -64);
  collision.addWall(16, 24, -52, -51.7);
  collision.addWall(16, 24, -63.7, -64);

  // 書庫・生贄への壁(大聖堂側)
  wallBox(0.3, 3, 8, -14.15, 1.5, -58);
  wallBox(0.3, 3, 8, 14.15, 1.5, -58);

  // 書庫・生贄への側壁(開口部は x±14 付近)
  collision.addWall(-16.3, -14, -62, -54);
  collision.addWall(14, 16.3, -62, -54);

  // ===== ⑦ 祭壇の間 =====
  floor(10, 8, 0, -74);
  wallBox(0.3, 4, 8, -5.15, 2, -74);
  wallBox(0.3, 4, 8, 5.15, 2, -74);
  wallBox(10, 4, 0.3, 0, 2, -70.15);
  wallBox(10, 4, 0.3, 0, 2, -77.85);

  const altar = new THREE.Mesh(new THREE.BoxGeometry(3, 1.2, 2), darkStone);
  altar.position.set(0, 0.6, -74);
  altar.castShadow = true;
  group.add(altar);

  const altarLight = new THREE.PointLight(0x604020, 0.6, 12);
  altarLight.position.set(0, 3, -74);
  group.add(altarLight);

  // 脱出扉(初期は閉)
  const exitDoor = wallBox(4, 3.5, 0.4, 0, 1.75, -45.2);
  exitDoor.name = "exitDoor";

  // 接続通路(分岐→大聖堂)
  floor(20, 4, 0, -45);
  collision.addWall(-10.3, 10.3, -43, -47);
  collision.addWall(-10, 10, -43, -42.7);
  collision.addWall(-10, 10, -46.7, -47);

  // 祭壇部屋の壁
  collision.addWall(-5.3, 5.3, -70, -78);
  collision.addWall(-5, -4.7, -70, -78);
  collision.addWall(4.7, 5, -70, -78);
  collision.addWall(-5, 5, -70, -69.7);
  collision.addWall(-5, 5, -77.7, -78);

  const guardianWaypoints = [
    new THREE.Vector3(0, 0, -55),
    new THREE.Vector3(-10, 0, -60),
    new THREE.Vector3(10, 0, -62),
    new THREE.Vector3(5, 0, -70),
    new THREE.Vector3(-8, 0, -68),
    new THREE.Vector3(0, 0, -50),
  ];

  return {
    group,
    coverSpots,
    altarPos: new THREE.Vector3(0, 0, -74),
    exitDoor,
    guardianWaypoints,
    spawnPos: { x: 0, z: 0 },
  };
}
