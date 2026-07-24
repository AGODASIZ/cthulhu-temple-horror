const PLAYER_RADIUS = 0.35;

export class CollisionWorld {
  constructor() {
    this.walls = [];
    this.circles = [];
  }

  addWall(minX, maxX, minZ, maxZ) {
    this.walls.push({ minX, maxX, minZ, maxZ });
  }

  addCircle(x, z, r) {
    this.circles.push({ x, z, r });
  }

  resolve(pos) {
    for (let i = 0; i < 4; i++) {
      for (const w of this.walls) {
        this.resolveBox(pos, w);
      }
      for (const c of this.circles) {
        this.resolveCircle(pos, c);
      }
    }
    return pos;
  }

  resolveBox(pos, w) {
    const px = pos.x;
    const pz = pos.z;
    if (px + PLAYER_RADIUS <= w.minX || px - PLAYER_RADIUS >= w.maxX) return;
    if (pz + PLAYER_RADIUS <= w.minZ || pz - PLAYER_RADIUS >= w.maxZ) return;

    const overlapLeft = px + PLAYER_RADIUS - w.minX;
    const overlapRight = w.maxX - (px - PLAYER_RADIUS);
    const overlapTop = pz + PLAYER_RADIUS - w.minZ;
    const overlapBottom = w.maxZ - (pz - PLAYER_RADIUS);
    const min = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

    if (min === overlapLeft) pos.x -= overlapLeft;
    else if (min === overlapRight) pos.x += overlapRight;
    else if (min === overlapTop) pos.z -= overlapTop;
    else pos.z += overlapBottom;
  }

  resolveCircle(pos, c) {
    const dx = pos.x - c.x;
    const dz = pos.z - c.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const minDist = PLAYER_RADIUS + c.r;
    if (dist < minDist && dist > 0.0001) {
      const push = minDist - dist;
      pos.x += (dx / dist) * push;
      pos.z += (dz / dist) * push;
    }
  }

  lineOfSight(from, to, maxDist) {
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > maxDist) return false;

    const steps = Math.ceil(dist / 0.5);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = from.x + dx * t;
      const z = from.z + dz * t;
      for (const w of this.walls) {
        if (x > w.minX && x < w.maxX && z > w.minZ && z < w.maxZ) return false;
      }
      for (const c of this.circles) {
        const cdx = x - c.x;
        const cdz = z - c.z;
        if (cdx * cdx + cdz * cdz < c.r * c.r) return false;
      }
    }
    return true;
  }
}
