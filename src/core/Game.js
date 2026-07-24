import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { Input } from "./Input.js";
import { CollisionWorld } from "./Collision.js";
import { Player } from "../player/Player.js";
import { buildLevel } from "../world/buildLevel.js";
import { Interactables } from "../world/Interactables.js";
import { Guardian } from "../entities/Guardian.js";
import { HUD } from "../ui/HUD.js";
import { Checkpoint } from "../save/Checkpoint.js";

export class Game {
  constructor(container) {
    this.container = container;
    this.state = "menu"; // menu | playing | gameover | win
    this.checkpoint = new Checkpoint();
    this.savedCheckpoint = null;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x020208, 0.028);
    this.scene.background = new THREE.Color(0x020208);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      120
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    this.controls = new PointerLockControls(this.camera, this.renderer.domElement);
    this.scene.add(this.controls.getObject());

    const ambient = new THREE.AmbientLight(0x0a0a14, 0.45);
    this.scene.add(ambient);

    this.collision = new CollisionWorld();
    this.level = buildLevel(this.scene, this.collision);
    this.input = new Input();
    this.player = new Player(this.controls, this.collision, this.camera);
    this.hud = new HUD();

    this.interactables = new Interactables(this.scene);
    this.interactables.addKey("key1", -6, -38, "祈祷の間");
    this.interactables.addKey("key2", -20, -58, "書庫");
    this.interactables.addKey("key3", 20, -58, "生贄の間");
    this.interactables.setupAltar(0, -74);

    this.guardian = new Guardian(this.scene, this.collision, this.level.guardianWaypoints);

    this.interactables.onKeyCollect = (id) => {
      this.savedCheckpoint = {
        x: this.player.position.x,
        z: this.player.position.z,
        keys: [...this.player.keys],
      };
      this.checkpoint.save(this.savedCheckpoint);
      this.guardian.escalateDifficulty(this.player.keys.size);
      this.hud.setKeys(this.player.keys.size);
    };

    this.interactables.onAltarOffer = () => {
      this.level.exitDoor.visible = false;
      this.hud.setPrompt("入口へ戻れ…！");
    };

    this.clock = new THREE.Clock();
    this.bindEvents();
    this.showMenu();
  }

  bindEvents() {
    window.addEventListener("resize", () => this.onResize());

    this.hud.overlay.addEventListener("click", () => {
      if (this.state === "menu") {
        this.startGame();
      } else if (this.state === "gameover" || this.state === "win") {
        if (this.state === "gameover") this.retry();
        else this.showMenu();
      }
    });

    this.controls.addEventListener("lock", () => {
      if (this.state === "playing") this.hud.hideOverlay();
    });
    this.controls.addEventListener("unlock", () => {
      if (this.state === "playing") {
        this.hud.showOverlay("一時停止", "クリックで再開", true);
      }
    });
  }

  showMenu() {
    this.state = "menu";
    this.controls.unlock();
    this.hud.showOverlay(
      "深淵神殿",
      "調査隊は仲間と離れ、封印された神殿に取り残された。<br>3つの印を集め、祭壇に捧げ、脱出せよ。<br><br><small>WASD 移動 / マウス 視点 / Shift しゃがみ / F ライト / E 調べる</small><br><br>クリックして開始"
    );
  }

  startGame() {
    this.state = "playing";
    this.resetPlayer(false);
    this.controls.lock();
    this.hud.hideOverlay();
    this.hud.setKeys(this.player.keys.size);
  }

  resetPlayer(fromCheckpoint) {
    this.player.keys.clear();

    if (fromCheckpoint && this.savedCheckpoint) {
      for (const id of this.savedCheckpoint.keys) {
        this.player.collectKey(id);
      }
      this.interactables.resetAll();
      for (const id of this.savedCheckpoint.keys) {
        const item = this.interactables.items.find((i) => i.id === id);
        if (item) {
          item.collected = true;
          this.interactables.group.remove(item.mesh);
          this.interactables.group.remove(item.light);
        }
      }
      if (this.savedCheckpoint.keys.length >= 3) {
        this.interactables.altar.offered = true;
        this.level.exitDoor.visible = false;
      } else {
        this.interactables.altar.offered = false;
        this.level.exitDoor.visible = true;
      }
      this.player.setSpawn(this.savedCheckpoint.x, this.savedCheckpoint.z);
    } else {
      this.interactables.resetAll();
      this.level.exitDoor.visible = true;
      this.player.setSpawn(this.level.spawnPos.x, this.level.spawnPos.z);
      this.savedCheckpoint = null;
      this.checkpoint.clear();
    }

    this.guardian.group.position.copy(this.level.guardianWaypoints[0]);
    this.guardian.waypointIndex = 0;
    this.guardian.transitionTo("patrol");
    this.guardian.escalateDifficulty(this.player.keys.size);
  }

  retry() {
    this.state = "playing";
    this.resetPlayer(true);
    this.controls.lock();
    this.hud.hideOverlay();
    this.hud.setKeys(this.player.keys.size);
  }

  gameOver() {
    this.state = "gameover";
    this.controls.unlock();
    this.hud.setChaseVignette(false);
    this.hud.showOverlay(
      "捕まった…",
      "守護者の触手が視界を覆う。<br><br>クリックでチェックポイントから再試行"
    );
  }

  win() {
    this.state = "win";
    this.controls.unlock();
    this.checkpoint.clear();
    this.savedCheckpoint = null;
    this.hud.setChaseVignette(false);
    this.hud.showOverlay(
      "脱出",
      "封印が解け、大聖堂の水位が下がる。<br>微かな光の向こうに、海面が見えた。<br><br>クリックでタイトルに戻る"
    );
  }

  isNearCover(playerPos) {
    for (const spot of this.level.coverSpots) {
      const dx = playerPos.x - spot.x;
      const dz = playerPos.z - spot.z;
      if (Math.sqrt(dx * dx + dz * dz) < spot.r + 0.8) return true;
    }
    return false;
  }

  updatePrompt() {
    const target = this.interactables.getNearest(this.player.position);
    if (!target) {
      this.hud.setPrompt("");
      return;
    }
    if (target.type === "key") {
      this.hud.setPrompt("[E] 印を手に入れる");
    } else if (target.type === "altar") {
      if (this.player.hasAllKeys(3)) {
        this.hud.setPrompt("[E] 祭壇に印を捧げる");
      } else {
        this.hud.setPrompt("祭壇にはまだ印が足りない…");
      }
    }
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  update(delta) {
    if (this.state !== "playing") return;

    if (this.input.consumeToggleLight()) {
      this.player.toggleLight();
    }

    this.player.update(delta, this.input);

    if (this.input.consumeInteract()) {
      const result = this.interactables.tryInteract(this.player);
      if (result?.type === "altar_locked") {
        this.hud.setPrompt("祭壇には3つの印が必要だ…");
      }
    }

    const ctx = {
      player: this.player,
      collision: this.collision,
      playerNearCover: this.isNearCover(this.player.position) && this.player.isCrouching,
      onCaught: () => this.gameOver(),
    };

    this.guardian.update(delta, ctx);
    this.interactables.update(performance.now());
    this.updatePrompt();

    this.hud.setGuardianState(this.guardian.stateName);
    this.hud.setChaseVignette(this.guardian.stateName === "chase");
    this.hud.setKeys(this.player.keys.size);

    // 祭壇完成後: 入口付近(z > -47)へ戻ればクリア
    if (this.interactables.altar.offered && this.player.position.z > -47) {
      this.win();
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = Math.min(this.clock.getDelta(), 0.05);
    this.update(delta);
    this.renderer.render(this.scene, this.camera);
  }

  start() {
    const saved = this.checkpoint.load();
    if (saved) this.savedCheckpoint = saved;
    this.animate();
  }
}
