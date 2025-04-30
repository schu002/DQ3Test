import Player from "./player.js";
import NPC from "./NPC.js";
import FieldScene from "./field.js";
import MonsterData from "./MonsterData.js";
import OccupationData from "./OccupationData.js";
import Command from "./Command.js";
import { updatePosition, getInverseDir } from "./util.js";

// 移動間隔
const TILE_OBS = 15;
const TILE_DESK = 20;
const IMG_MERCHANT = "image/merchant.png";

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

	    let npc = this.findNPC(player);

	    // 町人をプレイヤーのいる方向に向ける
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

    findNPC(player) {
	    let pos = [player.row, player.col];
	    if (!updatePosition(pos, player.direction)) return null;

	    let npc = npcList.find(n => n.row === pos[0] && n.col === pos[1]);
	    if (!npc) {
			if (getTileIndex(this, pos[0], pos[1]) != TILE_DESK) return null;
		    if (!updatePosition(pos, player.direction)) return null;
		    npc = npcList.find(n => n.row === pos[0] && n.col === pos[1]);
		    if (!npc) return null;
		    if (npc.image != IMG_MERCHANT) return null;
	    }
	    return npc;
    }

    update() {
        update.call(this);
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
    if (!gameData || !townData || !townData.start || !townData.NPCs) {
    	console.error("Error: town data not found in JSON.");
	    return;
    }

    MAP_WIDTH = townData.width * TILE_SIZE * SCALE;
    MAP_HEIGHT = townData.height * TILE_SIZE * SCALE;

    // マップを読み込む
    const map = this.make.tilemap({ key: "townMap" });
    const tileset = map.addTilesetImage("townTiles");

    // 地面レイヤーを作成
    this.townLayer = map.createLayer("Town", tileset, 0, 0);
    this.townLayer.setScale(SCALE);
    this.luidaLayer = map.createLayer("Luida", tileset, 0, 0);
    this.luidaLayer.setScale(SCALE);
    this.luidaLayer.setVisible(false);
    this.command = null;

    // プレイヤーを追加
    const startData = townData.start;
    members = [];
    gameData.members.forEach(member => {
        members.push(new Player(this, member, startData.row, startData.col, startData.dir, CARA_OFFSET));
    });
    player = members[0];

    // 町人を追加
    const npcData = townData.NPCs.Town;
    npcList = [];
    npcData.forEach(npc => {
        npcList.push(new NPC(this, npc.row, npc.col, npc.name, npc.image, npc.move, npc.dir, npc.talks));
    });

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
            npcList.forEach(npc => npc.updateFrame());
        }
    });

    // 町人のランダム移動を個別に処理
    this.time.addEvent({
        delay: 2000,
        loop: true,
        callback: () => {
	        npcList.forEach(npc => moveNPC(this, npc));
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

    // const pre = Object.assign({}, members[0]);
    let dir = members[0].direction;
	members[0].direction = newDir;

    let pos = [members[0].row, members[0].col];
    if (!updatePosition(pos, newDir)) return;

    // 壁などにぶつからないようにチェック
    this.isMoving = canMove(this, pos, true);
    if (!this.isMoving) return;

    let row = pos[0], col = pos[1], lastIdx = 0;
    for (let idx = 0; idx < members.length; idx++) {
        let preRow = members[idx].row, preCol = members[idx].col;
        let preDir = (idx == 0)? dir : members[idx].direction;
        if (idx > 0) {
            if (row == preRow && col == preCol) break;
	        lastIdx = idx;
            members[idx].direction = dir;
        }
	    members[idx].move(this, row, col, CARA_OFFSET, () => {
		    if (idx == lastIdx) this.isMoving = false;
	    });
	    row = preRow, col = preCol, dir = preDir;
    }

    if (pos[1] < 6) {
	    exitTown(this);
    }
}

function moveNPC(scene, npc) {
    if (!npc.movable) return;
    if (npc.isTalking) return;

    npc.direction = Phaser.Math.Between(0, 3);
    let pos = [npc.row, npc.col];
    if (!updatePosition(pos, npc.direction)) return;

    // 壁などにぶつからないようにチェック
    if (!canMove(scene, pos, false)) return;

    npc.move(pos);
}

function canMove(scene, position, isPlayer)
{
	let row = position[0], col = position[1];
	let idx = getTileIndex(scene, row, col);
	if (idx < 0) return false;
	if (idx >= TILE_OBS) {
    	if (isPlayer) changeLayer(scene, position);
		return false;
	}
	if (!isPlayer) {
	    if (members.some(mem => row == mem.row && col == mem.col)) return false;
    }
    if (npcList.some(npc => row == npc.row && col == npc.col)) return false;
	return true;
}

function changeLayer(scene, pos)
{
	let idx = getTileIndex(scene, pos[0], pos[1]);
	if (scene.townLayer.visible) {
		if (pos[0] == 16 && (pos[1] == 9 || pos[1] == 10)) {
		    scene.townLayer.setVisible(false);
		    scene.luidaLayer.setVisible(true);
		    swapNPCs(scene, "Luida");
		}
	} else if (scene.luidaLayer.visible) {
		if (pos[0] == 17 && (pos[1] == 9 || pos[1] == 10)) {
		    scene.townLayer.setVisible(true);
		    scene.luidaLayer.setVisible(false);
		    swapNPCs(scene, "Town");
		}
	}
}

function swapNPCs(scene, layer)
{
    // 既存の NPC を削除
    npcList.forEach(npc => npc.sprite.destroy());
    npcList = [];

    const npcData = scene.cache.json.get("townData").NPCs[layer];
    npcData.forEach(npc => {
        npcList.push(new NPC(scene, npc.row, npc.col, npc.name, npc.image, npc.move, npc.dir));
    });
}

function getTileIndex(scene, row, col)
{
    let tile;
    if (scene.townLayer.visible) {
	    tile = scene.townLayer.getTileAt(col, row);
    } else {
	    tile = scene.luidaLayer.getTileAt(col, row);
    }
    return tile ? tile.index : -1;
}

function exitTown(scene) {
    camera.fadeOut(200, 0, 0, 0);
    camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
	    bgm.stop();
	    scene.scene.start("FieldScene", { row: 213, col: 172 }); 
    });
}

export default TownScene;
