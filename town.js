import Player from "./player.js";
import NPC from "./NPC.js";
import Layer from "./Layer.js";
import FieldScene from "./field.js";
import MonsterData from "./MonsterData.js";
import OccupationData from "./OccupationData.js";
import Command from "./Command.js";
import { updatePosition, getInverseDir } from "./util.js";

const TILE_OBS = 15;
let MAP_WIDTH = 0;
let MAP_HEIGHT = 0;

class TownScene extends Phaser.Scene {
    constructor() {
        super({ key: "TownScene" });
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

	    // 町人をプレイヤーのいる方向に向ける
	    let npc = this.layer.findNPC(player.pos, player.direction);
	    if (npc) {
            npc.direction = getInverseDir(player.direction); // プレイヤーと反対向き
            npc.sprite.setFrame(npc.direction * 2); // 町人の向きを即座に反映
            npc.isTalking = true;
		}

        this.command = new Command(this, members, npc);
    }

    onButtonB() {
    }

    exitCommand() {
        this.command.destroy();
        this.command = null;
    }

    update() {
        update.call(this);
    }

    setLayer(layname, pos=null) {
        let layer = this.layerMap[layname];
        if (!layer || this.layer == layer) return false;

        if (this.layer) {
            camera.fadeOut(1000, 0, 0, 0);
            this.layer.setVisible(false);
            this.layer = null;
        }

        npcList = [];
        this.layer = layer;
        npcList = layer.npcs;
        members.forEach(member => member.setPosition((pos)? pos : layer.start));
        layer.setVisible(true);
        this.cameras.main.fadeIn(1000, 0, 0, 0);
        return true;
    }

    changeLayer(pos) {
        let toLayer = this.layer.getToLayerAt(pos);
        if (!toLayer) return false;
        return this.setLayer(toLayer.layer, toLayer.to);
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
        let idx = this.layer.getTileIndex(pos);
        if (idx < 0) return false;

        if (isPlayer) {
            if (this.changeLayer(pos)) return false;
        }
        if (idx >= TILE_OBS) {
            return false;
        }
        if (!isPlayer) {
            if (members.some(mem => pos[0] == mem.pos[0] && pos[1] == mem.pos[1])) return false;
        }
        if (npcList.some(npc => pos[0] == npc.pos[0] && pos[1] == npc.pos[1])) return false;
        return true;
    }

}

let player, camera, bgm;
let members = [];	// パーティメンバ
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
    this.range = townData.range;
    this.field = townData.field;
    MAP_WIDTH = townData.width * TILE_SIZE * SCALE;
    MAP_HEIGHT = townData.height * TILE_SIZE * SCALE;

    // マップを読み込む
    const map = this.make.tilemap({ key: "townMap" });
    const tileset = map.addTilesetImage("townTiles");

    // 各レイヤーを作成
    this.layer = null;
    this.layerMap = {};
    townData.layers.forEach(layData => {
        let drawLayer = map.createLayer(layData.name, tileset, 0, 0);
        drawLayer.setScale(SCALE);
        drawLayer.setVisible(false);
        let layer = new Layer(this, layData, drawLayer);
        this.layerMap[layData.name] = layer;
    });
    this.setLayer("Town");

    // プレイヤーを追加
    let order = 1;
    members = [];
    gameData.members.forEach(member => {
        members.push(new Player(this, member, order++, this.layer.start, this.layer.dir, CARA_OFFSET));
    });
    player = members[0];

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
    bgm = this.sound.add("townBGM", { loop: true, volume: 0.3 });
    bgm.play();
    this.buttonSound = this.sound.add("button", { loop: false, volume: 0.2 });
    this.isMoving = false;

    // 歩行アニメーション
    this.time.addEvent({
        delay: 250,
        loop: true,
        callback: () => {
            members.forEach(member => member.updateFrame());
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

    let dir = members[0].direction;
	members[0].direction = newDir;

    let pos = [...members[0].pos];
    if (!updatePosition(pos, newDir)) return;

    // 壁などにぶつからないようにチェック
    this.isMoving = this.canMove(pos, true);
    if (!this.isMoving) return;

    let row = pos[0], col = pos[1], lastIdx = 0;
    for (let idx = 0; idx < members.length; idx++) {
        let prePos = [...members[idx].pos];
        let preDir = (idx == 0)? dir : members[idx].direction;
        if (idx > 0) {
            if (row == prePos[0] && col == prePos[1]) break;
	        lastIdx = idx;
            members[idx].direction = dir;
        }
	    members[idx].move(this, [row, col], CARA_OFFSET, () => {
		    if (idx == lastIdx) this.isMoving = false;
	    });
	    row = prePos[0], col = prePos[1], dir = preDir;
    }

    if (this.layer.name == "Town" &&
        pos[0] < this.range[0] || pos[0] > this.range[2] ||
        pos[1] < this.range[1] || pos[1] > this.range[3]) {
	    exitTown(this);
    }
}

function exitTown(scene) {
    camera.fadeOut(200, 0, 0, 0);
    camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
	    bgm.stop();
	    scene.scene.start("FieldScene", { pos: scene.field }); 
    });
}

export default TownScene;
