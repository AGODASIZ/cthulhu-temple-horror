import * as THREE from "three";
import { STATES } from "./GuardianStates.js";

export class Guardian {
  constructor(scene, collision, waypoints) {
    this.scene = scene;
    this.collision = collision;
    this.waypoints = waypoints;
    this.waypointIndex = 0;
    this.wanderTimer = 2;
    this.lostSightTimer = 0;
    this.alertTimer = 0;
    this.searchTimer = 0;
    this.lastKnown = new THREE.Vector3();
    this.difficulty = 1;

    this.speeds = { patrol: 1.8, alert: 2.8, chase: 4.2 };
    this.visionRange = 14;
    this.visionAngle = Math.PI / 2.5;
    this.hearingRange = 9;

    this.group = new THREE.Group();
    this.mesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.55, 1.6, 4, 8),
      new THREE.MeshStandardMaterial({
        color: 0x2a1f28,
        roughness: 0.3,
        metalness: 0.2,
        emissive: 0x110808,
      })
    );
    this.mesh.position.y = 1.4;
    this.mesh.castShadow = true;
    this.group.add(this.mesh);

    // 触手プレースホルダー
    const tentMat = new THREE.MeshStandardMaterial({ color: 0x1a1218, roughness: 0.4 });
    for (let i = 0; i < 6; i++) {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.2 + Math.random() * 0.5, 5), tentMat);
      const angle = (i / 6) * Math.PI * 2 + Math.random() * 0.4;
      t.position.set(Math.cos(angle) * 0.7, 0.3, Math.sin(angle) * 0.7);
      t.rotation.x = 0.5 + Math.random() * 0.3;
      t.rotation.z = Math.cos(angle) * 0.4;
      this.group.add(t);
    }

    this.group.position.copy(waypoints[0]);
    scene.add(this.group);

    this.states = {};
    for (const [name, Cls] of Object.entries(STATES)) {
      this.states[name] = new Cls();
    }
    this.currentState = null;
    this.transitionTo("patrol");
  }

  get position() {
    return this.group.position;
  }

  get stateName() {
    return this._stateName;
  }

  transitionTo(name, _ctx) {
    if (this.currentState) this.currentState.exit(this);
    this._stateName = name;
    this.currentState = this.states[name];
    this.currentState.enter(this);
  }

  escalateDifficulty(keysCollected) {
    this.difficulty = 1 + keysCollected * 0.25;
    this.hearingRange = 9 + keysCollected * 1.5;
    this.speeds.chase = 4.2 + keysCollected * 0.3;
  }

  moveToward(tx, tz, speed, delta) {
    const dx = tx - this.position.x;
    const dz = tz - this.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 0.01) return;

    const step = speed * delta;
    const nx = dx / dist;
    const nz = dz / dist;
    this.position.x += nx * Math.min(step, dist);
    this.position.z += nz * Math.min(step, dist);
    this.collision.resolve(this.position);
    this.group.rotation.y = Math.atan2(dx, dz);
  }

  distanceToPlayer(ctx) {
    const dx = ctx.player.position.x - this.position.x;
    const dz = ctx.player.position.z - this.position.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  canSeePlayer(ctx) {
    const player = ctx.player;
    const dist = this.distanceToPlayer(ctx);
    let range = this.visionRange;
    if (!player.lightOn) range *= 0.55;
    if (player.isCrouching) range *= 0.7;
    if (ctx.playerNearCover) range *= 0.5;
    range *= this.difficulty;

    if (dist > range) return false;

    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.group.rotation.y);
    const toPlayer = new THREE.Vector3(
      player.position.x - this.position.x,
      0,
      player.position.z - this.position.z
    ).normalize();
    const angle = forward.angleTo(toPlayer);
    if (angle > this.visionAngle) return false;

    return ctx.collision.lineOfSight(
      { x: this.position.x, z: this.position.z },
      { x: player.position.x, z: player.position.z },
      range
    );
  }

  canHearPlayer(ctx) {
    const player = ctx.player;
    if (player.noiseLevel <= 0) return false;

    const dist = this.distanceToPlayer(ctx);
    let hearRange = this.hearingRange * player.noiseLevel;
    if (!player.lightOn) hearRange *= 0.85;
    hearRange *= this.difficulty;

    return dist < hearRange;
  }

  update(delta, ctx) {
    this.currentState.update(this, delta, ctx);

    // 触手のゆらぎ
    this.mesh.position.y = 1.4 + Math.sin(performance.now() * 0.003) * 0.05;
  }

  dispose() {
    this.scene.remove(this.group);
  }
}
