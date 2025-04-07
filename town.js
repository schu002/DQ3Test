import Player from "./player.js";
import FieldScene from "./field.js";
import MonsterData from "./MonsterData.js";
import OccupationData from "./OccupationData.js";
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
        this.isTalking = false;  // 会話中かどうかのフラグ
    }

    preload() {
        preload.call(this);
    }

    create() {
        create.call(this);

        // Aキーの入力設定
        this.input.keyboard.on("keydown-Z", this.toggleConversation, this);

        // 会話ウィンドウ（黒い背景の四角）を作成
        this.dialogBox = this.add.graphics();
        this.dialogBox.fillStyle(0x000000, 0.9);
        this.dialogBox.fillRect(280, 400, 400, 130);
        this.dialogBox.setScrollFactor(0);
        this.dialogBox.setDepth(10);
        this.dialogBox.setVisible(false);

        // 会話テキスト
        this.dialogText = this.add.text(300, 410, "こんにちは", {
            fontFamily: "PixelMplus10-Regular",
            fontSize: "24px",
            fill: "#ffffff",
        });
        this.dialogText.setScrollFactor(0);
        this.dialogText.setDepth(11);
        this.dialogText.setVisible(false);
    }

    toggleConversation() {
        if (this.isTalking) {
            this.dialogBox.setVisible(false);
            this.dialogText.setVisible(false);
	        this.isTalking = false;
	        let npc = npcList.find(n => n.isTalking);
	        if (npc) npc.isTalking = false;
	        return;
        }

	    let pos = [player.row, player.col];
	    if (!updatePosition(pos, player.direction)) return;

	    let npc = npcList.find(n => n.row === pos[0] && n.col === pos[1]);
	    if (!npc) {
			if (getTileIndex(this, pos[0], pos[1]) != TILE_DESK) return;
		    if (!updatePosition(pos, player.direction)) return;
		    npc = npcList.find(n => n.row === pos[0] && n.col === pos[1]);
		    if (!npc) return;
		    if (npc.image != IMG_MERCHANT) return;
	    }

	    // 町人をプレイヤーのいる方向に向ける
	    npc.direction = getInverseDir(player.direction); // プレイヤーと反対向き
	    npc.sprite.setFrame(npc.direction * 2); // 町人の向きを即座に反映
	    npc.isTalking = true;

        this.dialogBox.setVisible(true);
        this.dialogText.setVisible(true);
        this.isTalking = true;
    }

    update() {
        update.call(this);
    }
}

class NPC {
    constructor(scene, row, col, name, image, move, dir) {
        this.scene = scene;
        this.row = row;
        this.col = col;
        this.name = name;
        this.image = image;
        this.sprite = scene.physics.add.sprite(col * TILE_SIZE, row * TILE_SIZE-CARA_OFFSET, image, 0);
        this.sprite.setOrigin(0, 0);
        this.direction = (dir < 0)? Phaser.Math.Between(0, 3) : dir; // ランダムな方向
        this.movable = move;
        this.isTalking = false;
        this.stepCount = 0;
    }

    move() {
        if (!this.movable) return;
        if (this.isTalking) return;

        this.direction = Phaser.Math.Between(0, 3);
        let pos = [this.row, this.col];
        if (!updatePosition(pos, this.direction)) return;

        // 壁などにぶつからないようにチェック
        if (!canMove(this.scene, pos, false)) return;

        // 移動処理
        this.scene.tweens.add({
            targets: this.sprite,
            x: pos[1] * TILE_SIZE,
            y: pos[0] * TILE_SIZE - CARA_OFFSET,
            duration: MOVE_DELAY,
            onComplete: () => {
                this.row = pos[0];
                this.col = pos[1];
            }
        });
    }

    updateFrame() {
        this.stepCount ^= 1;
        this.sprite.setFrame(this.direction * 2 + this.stepCount);
    }
}

let player, camera, bgm;
let members = [];	// パーティメンバ
let npcList = [];	// 町人リスト

function preload() {
}

function create() {
    const gameData = this.cache.json.get("gameData");
    const townData = this.cache.json.get("townData");
    if (!gameData || !townData || !townData.start || !townData.objects) {
    	console.error("Error: town data not found in JSON.");
	    return;
    }

    TILE_SIZE = townData.tilewidth;
    MAP_WIDTH = townData.width * TILE_SIZE;
    MAP_HEIGHT = townData.height * TILE_SIZE;

    // マップを読み込む
    const map = this.make.tilemap({ key: "townMap" });
    const tileset = map.addTilesetImage("townTiles");

    // 地面レイヤーを作成
    this.townLayer = map.createLayer("Town", tileset, 0, 0);
    this.townLayer.setScale(1);
    this.luidaLayer = map.createLayer("Luida", tileset, 0, 0);
    this.luidaLayer.setScale(1);
    this.luidaLayer.setVisible(false);

    // プレイヤーを追加
    const startData = townData.start;
    members = [];
    gameData.members.forEach(member => {
        members.push(new Player(this, member.name, member.occupation, member.level, startData.row, startData.col, startData.dir, CARA_OFFSET));
    });
    player = members[0];

    // 町人を追加
    const npcData = townData.objects.NPC;
    npcList = [];
    npcData.forEach(npc => {
        npcList.push(new NPC(this, npc.row, npc.col, npc.name, npc.image, npc.move, npc.dir));
    });

    // カメラ設定
    this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    camera = this.cameras.main;
    camera.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    camera.setZoom(2);
    camera.startFollow(player.sprite, true, 0.1, 0.1);

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
	        npcList.forEach(npc => npc.move());
        }
    });
}

function update(time) {
    if (this.isMoving) return;
    let dir = -1;
	if		(this.keys.left.isDown	|| this.wasd.left.isDown)  dir = DIR.LEFT;
    else if (this.keys.right.isDown || this.wasd.right.isDown) dir = DIR.RIGHT;
    else if (this.keys.up.isDown	|| this.wasd.up.isDown)	   dir = DIR.UP;
    else if (this.keys.down.isDown	|| this.wasd.down.isDown)  dir = DIR.DOWN;
    else return;

    const pre = Object.assign({}, members[0]);
	members[0].direction = dir;

    let pos = [members[0].row, members[0].col];
    if (!updatePosition(pos, dir)) return;

    // 壁などにぶつからないようにチェック
    this.isMoving = canMove(this, pos, true);
    if (!this.isMoving) return;

    let moveIdx = (pre.row != members[1].row || pre.col != members[1].col)? 1 : 0;
    members[0].move(this, pos[0], pos[1], CARA_OFFSET, () => {
	    if (moveIdx == 0) this.isMoving = false;
    });

    if (moveIdx == 1) {
		members[1].direction = pre.direction;
	    members[1].move(this, pre.row, pre.col, CARA_OFFSET, () => {
            this.isMoving = false;
        });
    }

    if (pos[1] < 6) {
	    exitTown(this);
    }
}

function canMove(scene, position, isPlayer) {
	let row = position[0], col = position[1];
	let idx = getTileIndex(scene, row, col);
	if (idx < 0) return false;
	if (idx >= TILE_OBS) {
    	if (isPlayer) changeLayer(scene, position);
		return false;
	}
    if (row == player.row && col == player.col) return false;
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
		    swapNPCs(scene, "luida");
		}
	} else if (scene.luidaLayer.visible) {
		if (pos[0] == 17 && (pos[1] == 9 || pos[1] == 10)) {
		    scene.townLayer.setVisible(true);
		    scene.luidaLayer.setVisible(false);
		    swapNPCs(scene, "town");
		}
	}
}

function swapNPCs(scene, layer) {
    // 既存の NPC を削除
    npcList.forEach(npc => npc.sprite.destroy());
    npcList = [];

    const npcData = scene.cache.json.get("townData").objects[layer];
    npcData.forEach(npc => {
        npcList.push(new NPC(scene, npc.row, npc.col, npc.name, npc.image, npc.move, npc.dir));
    });
}

function getTileIndex(scene, row, col) {
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
