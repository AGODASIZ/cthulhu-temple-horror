import * as THREE from "three";

const WALK_SPEED = 3.2;
const CROUCH_SPEED = 1.4;
const STAND_HEIGHT = 1.7;
const CROUCH_HEIGHT = 1.0;

export class Player {
  constructor(controls, collision, camera) {
    this.controls = controls;
    this.collision = collision;
    this.camera = camera;
    this.velocity = new THREE.Vector3();
    this.keys = new Set();
    this.isMoving = false;
    this.noiseLevel = 0;

    this.flashlight = new THREE.SpotLight(0xfff2d0, 3.5, 14, Math.PI / 7, 0.4, 1.5);
    this.flashlight.castShadow = true;
    this.flashlight.visible = true;
    camera.add(this.flashlight);
    camera.add(this.flashlight.target);
    this.flashlight.target.position.set(0, 0, -1);

    controls.getObject().position.set(0, STAND_HEIGHT, 0);
  }

  get position() {
    return this.controls.getObject().position;
  }

  get isCrouching() {
    return this._crouching ?? false;
  }

  get lightOn() {
    return this.flashlight.visible;
  }

  setSpawn(x, z) {
    this.position.set(x, STAND_HEIGHT, z);
  }

  hasAllKeys(total = 3) {
    return this.keys.size >= total;
  }

  collectKey(id) {
    this.keys.add(id);
  }

  update(delta, input) {
    if (!this.controls.isLocked) return;

    this._crouching = input.move.crouch;
    const speed = this._crouching ? CROUCH_SPEED : WALK_SPEED;
    const targetHeight = this._crouching ? CROUCH_HEIGHT : STAND_HEIGHT;

    const obj = this.controls.getObject();
    obj.position.y += (targetHeight - obj.position.y) * Math.min(1, delta * 10);

    this.velocity.x -= this.velocity.x * 8.0 * delta;
    this.velocity.z -= this.velocity.z * 8.0 * delta;

    const dir = new THREE.Vector3(
      Number(input.move.right) - Number(input.move.left),
      0,
      Number(input.move.backward) - Number(input.move.forward)
    );
    if (dir.lengthSq() > 0) dir.normalize();

    this.velocity.x -= dir.x * speed * 10.0 * delta;
    this.velocity.z -= dir.z * speed * 10.0 * delta;

    this.controls.moveRight(-this.velocity.x * delta);
    this.controls.moveForward(-this.velocity.z * delta);
    this.collision.resolve(obj.position);

    const moving = dir.lengthSq() > 0;
    this.isMoving = moving;
    if (moving) {
      this.noiseLevel = this._crouching ? 0.35 : this.lightOn ? 1.0 : 0.7;
    } else {
      this.noiseLevel = 0;
    }
  }

  toggleLight() {
    this.flashlight.visible = !this.flashlight.visible;
  }
}
