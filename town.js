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
        this.npc = null; // 会話中の町人
        this.cursor = null;
        this.talkList = [];
    }

    preload() {
        preload.call(this);
    }

    create() {
        create.call(this);

        // Aキーの入力設定
        this.input.keyboard.on("keydown-Z", this.onButtonA, this);
        this.input.keyboard.on("keydown-X", this.onButtonB, this);

        // 会話ウィンドウ（黒い背景の四角）を作成
        this.drawRect(332, 500, 310, 148);
    }

    onButtonA() {
        if (!this.npc) {
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

	        this.rectList.setVisible(true);
	        this.npc = npc;
	        this.talkList = [...npc.talks];
	    }

        updateTalk.call(this);
    }

    onButtonB() {
    }

    drawCursor(x, y, blink=true) {
        const w = 18, h = 10;
        this.cursor = this.add.graphics();
        this.cursor.fillStyle(0xffffff, 1); // ���F�A�s����
        this.cursor.beginPath();
        this.cursor.moveTo(x, y);
        this.cursor.lineTo(x+w, y);
        this.cursor.lineTo(x+w, y+4);
        this.cursor.lineTo(x+w/2, y+h);
        this.cursor.lineTo(x, y+4);
        this.cursor.closePath();
        this.cursor.fillPath();
        this.cursor.setDepth(11);
        this.cursor.setScrollFactor(0);
        this.cursor.setVisible(true);
        this.tweens.add({
            targets: this.cursor,
            alpha: { from: 1, to: 0 },
            ease: 'Linear',
            duration: 250,
            yoyo: true,
            repeat: -1
        });
	}

    drawRect(x, y, w, h) {
	    this.rectList = this.add.container(x, y);
	    this.rectList.setScrollFactor(0);
	    this.rectList.setDepth(10);
        /* let rect1 = this.add.graphics();
        rect1.fillStyle(0x000000, 0.9);
        rect1.fillRect(x, y, w, h);
        rect1.setScrollFactor(0);
        rect1.setDepth(10);
        rect1.setVisible(false);
	    this.rectList.add(rect1); */

        let rect2 = this.add.graphics({ x: 0, y: 0 });
        rect2.lineStyle(10, 0xffffff);
        rect2.fillStyle(0x000000, 0.9);
        rect2.strokeRoundedRect(0, 0, w, h, 5);
        rect2.fillRoundedRect(0, 0, w, h, 5);
	    this.rectList.add(rect2);
	    this.rectList.setVisible(false);
    }

    update() {
        update.call(this);
    }
}

class NPC {
    constructor(scene, row, col, name, image, move, dir, talks) {
        this.scene = scene;
        this.row = row;
        this.col = col;
        this.name = name;
        this.image = image;
        this.sprite = scene.physics.add.sprite(col * TILE_SIZE, row * TILE_SIZE-CARA_OFFSET, image, 0);
        this.sprite.setOrigin(0, 0);
        this.direction = (dir < 0)? Phaser.Math.Between(0, 3) : dir; // 繝ゥ繝ウ繝な方向
        this.talks = talks;
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
let container = null;

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
        npcList.push(new NPC(this, npc.row, npc.col, npc.name, npc.image, npc.move, npc.dir, npc.talks));
    });

    // カメラ設定
    this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    camera = this.cameras.main;
    camera.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    camera.setZoom(2);
    camera.startFollow(player.sprite, true, 1, 1, -8, -24);

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
    this.buttonSound = this.sound.add("button", { loop: false, volume: 0.3 });
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
    if (this.npc) return;

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

function updateTalk() {
    if (!this.npc) return;

    this.buttonSound.play();
    if (container) container.destroy();

    if (this.talkList.length == 0) {
        this.rectList.setVisible(false);
        this.npc = null;
        let npc = npcList.find(n => n.isTalking);
        if (npc) npc.isTalking = false;
        return;
    }

    container = this.add.container(0, 0);
    container.setDepth(11);
    this.cursor = null;

    let y = 524, cnt = 0;
    while (this.talkList.length > 0) {
        let str = this.talkList.shift();
        if (str == "▼") {
            this.drawCursor(488, y);
	        container.add(this.cursor);
            break;
        }
        str = ((cnt++ == 0)? "＊「" : "　　") + str;
        // 会話テキスト
        let text = this.add.text(340, y, str, {
            fontFamily: "PixelMplus10-Regular",
            fontSize: "18px",
            color: "#ffffff",
        });
        text.setScrollFactor(0);
        text.setScale(0.9, 1.0);
        text.setDepth(11);
        container.add(text);
        y += 32;
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
