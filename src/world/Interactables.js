import * as THREE from "three";

export class Interactables {
  constructor(scene) {
    this.items = [];
    this.group = new THREE.Group();
    scene.add(this.group);
    this.onKeyCollect = null;
    this.onAltarOffer = null;
    this.onWin = null;
  }

  addKey(id, x, z, label) {
    const geo = new THREE.OctahedronGeometry(0.25, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xc8a040,
      emissive: 0x403010,
      emissiveIntensity: 0.6,
      roughness: 0.4,
      metalness: 0.7,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 1.1, z);
    this.group.add(mesh);

    const light = new THREE.PointLight(0xc8a040, 0.5, 4);
    light.position.copy(mesh.position);
    this.group.add(light);

    this.items.push({
      type: "key",
      id,
      label,
      mesh,
      light,
      collected: false,
      x,
      z,
    });
  }

  setupAltar(x, z) {
    this.altar = { x, z, offered: false };
  }

  getNearest(playerPos, maxDist = 2.2) {
    let best = null;
    let bestDist = maxDist;

    for (const item of this.items) {
      if (item.collected) continue;
      const dx = playerPos.x - item.x;
      const dz = playerPos.z - item.z;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d < bestDist) {
        bestDist = d;
        best = item;
      }
    }

    if (this.altar && !this.altar.offered) {
      const dx = playerPos.x - this.altar.x;
      const dz = playerPos.z - this.altar.z;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d < bestDist) {
        return { type: "altar", dist: d };
      }
    }

    return best;
  }

  tryInteract(player) {
    const target = this.getNearest(player.position);
    if (!target) return null;

    if (target.type === "key") {
      target.collected = true;
      this.group.remove(target.mesh);
      this.group.remove(target.light);
      player.collectKey(target.id);
      this.onKeyCollect?.(target.id);
      return { type: "key", id: target.id };
    }

    if (target.type === "altar" && player.hasAllKeys(3)) {
      this.altar.offered = true;
      this.onAltarOffer?.();
      return { type: "altar" };
    }

    if (target.type === "altar" && !player.hasAllKeys(3)) {
      return { type: "altar_locked" };
    }

    return null;
  }

  update(time) {
    for (const item of this.items) {
      if (!item.collected) {
        item.mesh.rotation.y = time * 0.002;
        item.mesh.position.y = 1.1 + Math.sin(time * 0.003) * 0.08;
      }
    }
  }

  restoreKeys(collectedIds) {
    for (const item of this.items) {
      if (collectedIds.includes(item.id) && !item.collected) {
        item.collected = true;
        this.group.remove(item.mesh);
        this.group.remove(item.light);
      }
    }
  }

  resetAll() {
    this.altar.offered = false;
    for (const item of this.items) {
      if (item.collected) {
        item.collected = false;
        this.group.add(item.mesh);
        this.group.add(item.light);
      }
    }
  }
}
