import Player from "./player.js";
import NPC from "./NPC.js";
import Layer from "./Layer.js";
import OccupationData from "./OccupationData.js";
import Command from "./Command.js";
import TalkManager from "./TalkManager.js";
import { updatePosition } from "./util.js";

const TILE_OBS = 16;
let MAP_WIDTH = 0;
let MAP_HEIGHT = 0;

class TownScene extends Phaser.Scene {
    constructor() {
        super({ key: "TownScene" });
    }

    destroy() {
        TalkManager.clear();
	    this.bgm.stop();
    }

    preload() {
        preload.call(this);
    }

    create() {
        create.call(this);

        // Aキーの入力設定
        this.input.keyboard.on("keydown-Z", this.onButtonA, this);
        this.input.keyboard.on("keydown-X", this.onButtonB, this);
    }

    onButtonA() {
        if (this.command) return;
        if (!this.layer) return;

        this.command = new Command(this, this.members, this.layer);
    }

    onButtonB() {
    }

    exitCommand() {
        this.command.destroy();
        // 0.5秒だけキー入力を無視する
        this.time.delayedCall(500, () => {
            this.command = null;
        });
    }

    update() {
        update.call(this);
    }

    // パーティのメンバーリストを取得する
    getMemberList() {
        return this.members;
    }

    // どうぐ屋の売り物リストを取得する
    getItemList() {
        const townData = this.cache.json.get("townData");
        return townData.items;
    }

    // 武器と防具の店の売り物リストを取得する
    getWeaponList() {
        const townData = this.cache.json.get("townData");
        return townData.weapons;
    }

    setLayer(layname, pos=null) {
        let layer = this.layerMap[layname];
        if (!layer || this.layer == layer) return false;

        let newpos = (pos)? [...pos] : [...layer.start];
        npcList = [];
        this.layer = layer;
        npcList = layer.npcs;
        this.members.forEach(member => member.setPosition(newpos));
        layer.setVisible(true);
        this.cameras.main.fadeIn(1000, 0, 0, 0);
        return true;
    }

    changeLayer(pos) {
        let toLayer = this.layer.getToLayerAt(pos);
        if (!toLayer) return false;

        this.isMoving = true;
        if (this.layer) {
            if (toLayer.sound) this.stepSound.play();
            camera.fadeOut(500, 0, 0, 0);
            this.time.delayedCall(500, () => {
                this.layer.setVisible(false);
                this.layer = null;
            });
        }

        this.time.delayedCall(500, () => {
            this.setLayer(toLayer.layer, toLayer.to);
            this.isMoving = false;
        });
        return true;
    }

    moveNPC(npc) {
        if (!npc.movable) return;
        if (npc.isTalking) return;

        npc.direction = Phaser.Math.Between(0, 3);
        let pos = [...npc.pos];
        if (!updatePosition(pos, npc.direction)) return;

        // 壁などにぶつからないようにチェック
        if (!this.canMove(pos, false)) return;

        npc.move(pos);
    }

    canMove(pos, isPlayer) {
        if (!this.layer) return false;
        let idx = this.layer.getTileIndex(pos);
        if (idx < 0) return false;

        if (idx >= TILE_OBS) {
            if (isPlayer) this.changeLayer(pos);
            return false;
        }
        if (!isPlayer) {
            if (this.members.some(mem => pos[0] == mem.pos[0] && pos[1] == mem.pos[1])) return false;
        }
        if (npcList.some(npc => pos[0] == npc.pos[0] && pos[1] == npc.pos[1])) return false;
        return true;
    }

    postMove(pos) {
        if (this.layer.name == "Town" &&
            (pos[0] < this.range[0] || pos[0] > this.range[2] ||
             pos[1] < this.range[1] || pos[1] > this.range[3])) {
            exitTown(this);
        } else {
            this.changeLayer(pos);
        }
    }
}

let player, camera;
let npcList = [];	// 町人リスト

function preload()
{
}

function create()
{
    const gameData = this.cache.json.get("gameData");
    const townData = this.cache.json.get("townData");
    if (!gameData || !townData || !townData.layers) {
    	console.error("Error: town data not found in JSON.");
	    return;
    }

    this.command = null;
    this.layerMap = {};
    this.members = [];
    this.isMoving = true;
    this.range = townData.range;
    this.field = townData.field;
    MAP_WIDTH = townData.width * TILE_SIZE * SCALE;
    MAP_HEIGHT = townData.height * TILE_SIZE * SCALE;

    // マップを読み込む
    const map = this.make.tilemap({ key: "townMap" });
    const tileset = map.addTilesetImage("townTiles");

    // 各レイヤーを作成
    this.layer = null;
    townData.layers.forEach(layData => {
        let drawLayer = map.createLayer(layData.name, tileset, 0, 0);
        drawLayer.setScale(SCALE);
        drawLayer.setVisible(false);
        let layer = new Layer(this, layData, drawLayer);
        this.layerMap[layData.name] = layer;
    });
    this.setLayer("Town");

    // 会話データをロード
    TalkManager.load("talk/ariahan.txt");

    // プレイヤーを追加
    let order = 1;
    gameData.members.forEach(member => {
        this.members.push(new Player(this, member, order++, this.layer.start, this.layer.dir, CARA_OFFSET));
    });
    player = this.members[0];

    // カメラ設定
    this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    camera = this.cameras.main;
    camera.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    camera.startFollow(player.sprite, true, 1, 1, -8*SCALE, -24*SCALE);

    // キーボード入力
    this.keys = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
	    up: Phaser.Input.Keyboard.KeyCodes.W,
	    down: Phaser.Input.Keyboard.KeyCodes.S,
	    left: Phaser.Input.Keyboard.KeyCodes.A,
	    right: Phaser.Input.Keyboard.KeyCodes.D
	});

    // BGM
    this.bgm = this.sound.add("townBGM", { loop: true, volume: 0.3 });
    this.stepSound = this.sound.add("step", { loop: false, volume: 0.2 });

    this.time.delayedCall(500, () => {
        this.bgm.play();
        this.isMoving = false;
    });

    // 歩行アニメーション
    this.time.addEvent({
        delay: 250,
        loop: true,
        callback: () => {
            this.members.forEach(member => member.updateFrame());
        }
    });

    // 町人のランダム移動を個別に処理
    this.time.addEvent({
        delay: 2000,
        loop: true,
        callback: () => {
	        npcList.forEach(npc => this.moveNPC(npc));
        }
    });
}

function update(time)
{
    if (this.isMoving) return;
    if (this.command) return;

    let newDir = -1;
	if		(this.keys.left.isDown	|| this.wasd.left.isDown)  newDir = DIR.LEFT;
    else if (this.keys.right.isDown || this.wasd.right.isDown) newDir = DIR.RIGHT;
    else if (this.keys.up.isDown	|| this.wasd.up.isDown)	   newDir = DIR.UP;
    else if (this.keys.down.isDown	|| this.wasd.down.isDown)  newDir = DIR.DOWN;
    else return;

    let dir = this.members[0].direction;
	this.members[0].direction = newDir;

    let pos = [...this.members[0].pos];
    if (!updatePosition(pos, newDir)) return;

    // 壁などにぶつからないようにチェック
    if (!this.canMove(pos, true)) return;

    this.isMoving = true;
    let wkpos = [...pos], lastIdx = 0;
    for (let idx = 0; idx < this.members.length; idx++) {
        let prePos = [...this.members[idx].pos];
        let preDir = (idx == 0)? dir : this.members[idx].direction;
        if (idx > 0) {
            if (wkpos[0] == prePos[0] && wkpos[1] == prePos[1]) break;
	        lastIdx = idx;
            this.members[idx].direction = dir;
        }
	    this.members[idx].move(this, wkpos, CARA_OFFSET, () => {
		    if (idx == lastIdx) {
                this.isMoving = false;
                this.postMove(pos);
            }
	    });
	    wkpos = [...prePos], dir = preDir;
    }
}

function exitTown(scene) {
    scene.stepSound.play();
    scene.isMoving = true;
    camera.fadeOut(200, 0, 0, 0);
    camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        scene.destroy();
	    scene.scene.start("FieldScene", { pos: scene.field }); 
    });
}

export default TownScene;
