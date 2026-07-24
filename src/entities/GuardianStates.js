export class GuardianState {
  enter(_guardian) {}
  update(_guardian, _delta, _ctx) {}
  exit(_guardian) {}
}

export class PatrolState extends GuardianState {
  update(guardian, delta, ctx) {
    const wp = guardian.waypoints[guardian.waypointIndex];
    const dx = wp.x - guardian.position.x;
    const dz = wp.z - guardian.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 1.2) {
      guardian.waypointIndex = (guardian.waypointIndex + 1) % guardian.waypoints.length;
    } else {
      guardian.moveToward(wp.x, wp.z, guardian.speeds.patrol, delta);
    }

    guardian.wanderTimer -= delta;
    if (guardian.wanderTimer <= 0) {
      guardian.wanderTimer = 2 + Math.random() * 3;
      if (Math.random() < 0.3) {
        guardian.waypointIndex = Math.floor(Math.random() * guardian.waypoints.length);
      }
    }

    if (guardian.canSeePlayer(ctx)) {
      guardian.transitionTo("chase", ctx);
    } else if (guardian.canHearPlayer(ctx)) {
      guardian.lastKnown.copy(ctx.player.position);
      guardian.transitionTo("alert", ctx);
    }
  }
}

export class AlertState extends GuardianState {
  enter(guardian) {
    guardian.alertTimer = 6;
  }

  update(guardian, delta, ctx) {
    guardian.moveToward(guardian.lastKnown.x, guardian.lastKnown.z, guardian.speeds.alert, delta);
    guardian.alertTimer -= delta;

    if (guardian.canSeePlayer(ctx)) {
      guardian.transitionTo("chase", ctx);
      return;
    }

    const dx = guardian.position.x - guardian.lastKnown.x;
    const dz = guardian.position.z - guardian.lastKnown.z;
    if (Math.sqrt(dx * dx + dz * dz) < 1.5 || guardian.alertTimer <= 0) {
      guardian.transitionTo("search", ctx);
    } else if (guardian.canHearPlayer(ctx)) {
      guardian.lastKnown.copy(ctx.player.position);
      guardian.alertTimer = 4;
    }
  }
}

export class ChaseState extends GuardianState {
  enter(guardian) {
    guardian.mesh.material.emissive.setHex(0x331111);
  }

  exit(guardian) {
    guardian.mesh.material.emissive.setHex(0x110808);
  }

  update(guardian, delta, ctx) {
    const p = ctx.player.position;
    guardian.lastKnown.copy(p);
    guardian.moveToward(p.x, p.z, guardian.speeds.chase, delta);

    if (guardian.distanceToPlayer(ctx) < 1.3) {
      ctx.onCaught();
      return;
    }

    if (guardian.canSeePlayer(ctx)) {
      guardian.lostSightTimer = 0;
    } else {
      guardian.lostSightTimer += delta;
      if (guardian.lostSightTimer > 2.5) {
        guardian.transitionTo("search", ctx);
      }
    }
  }
}

export class SearchState extends GuardianState {
  enter(guardian) {
    guardian.searchTimer = 5;
    guardian.searchAngle = 0;
  }

  update(guardian, delta, ctx) {
    guardian.searchTimer -= delta;
    guardian.searchAngle += delta * 2;
    const r = 2;
    const tx = guardian.lastKnown.x + Math.cos(guardian.searchAngle) * r;
    const tz = guardian.lastKnown.z + Math.sin(guardian.searchAngle) * r;
    guardian.moveToward(tx, tz, guardian.speeds.patrol * 0.8, delta);

    if (guardian.canSeePlayer(ctx)) {
      guardian.transitionTo("chase", ctx);
      return;
    }
    if (guardian.canHearPlayer(ctx)) {
      guardian.lastKnown.copy(ctx.player.position);
      guardian.transitionTo("alert", ctx);
      return;
    }
    if (guardian.searchTimer <= 0) {
      guardian.transitionTo("patrol", ctx);
    }
  }
}

export const STATES = {
  patrol: PatrolState,
  alert: AlertState,
  chase: ChaseState,
  search: SearchState,
};
