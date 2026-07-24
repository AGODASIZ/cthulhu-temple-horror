export class Input {
  constructor() {
    this.move = { forward: false, backward: false, left: false, right: false, crouch: false };
    this.interact = false;
    this.toggleLight = false;

    document.addEventListener("keydown", (e) => this.onKeyDown(e));
    document.addEventListener("keyup", (e) => this.onKeyUp(e));
  }

  onKeyDown(e) {
    switch (e.code) {
      case "KeyW": this.move.forward = true; break;
      case "KeyS": this.move.backward = true; break;
      case "KeyA": this.move.left = true; break;
      case "KeyD": this.move.right = true; break;
      case "ShiftLeft":
      case "ShiftRight":
        this.move.crouch = true;
        break;
      case "KeyF":
        this.toggleLight = true;
        break;
      case "KeyE":
        this.interact = true;
        break;
    }
  }

  onKeyUp(e) {
    switch (e.code) {
      case "KeyW": this.move.forward = false; break;
      case "KeyS": this.move.backward = false; break;
      case "KeyA": this.move.left = false; break;
      case "KeyD": this.move.right = false; break;
      case "ShiftLeft":
      case "ShiftRight":
        this.move.crouch = false;
        break;
    }
  }

  consumeInteract() {
    const v = this.interact;
    this.interact = false;
    return v;
  }

  consumeToggleLight() {
    const v = this.toggleLight;
    this.toggleLight = false;
    return v;
  }
}
