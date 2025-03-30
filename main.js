// 画面サイズ（2倍に拡大）
const SCREEN_WIDTH = 960;
const SCREEN_HEIGHT = 720;

// 移動間隔
const MOVE_DELAY = 280;
const CARA_OFFSET = 8;
const TILE_OBS = 15;
const TILE_DESK = 20;
const IMG_MERCHANT = "merchant.png";

let TILE_SIZE = 32;
let MAP_WIDTH = 0;
let MAP_HEIGHT = 0;

var DIR = {
	DOWN	: 0,
	UP		: 1,
	LEFT	: 2,
	RIGHT	: 3
};

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: "MainScene" });
        this.isTalking = false;  // 会話中かどうかのフラグ
    }

    preload() {
        preload.call(this);
    }

    create() {
        create.call(this);

        // Aキーの入力設定
        this.input.keyboard.on("keydown-A", this.toggleConversation, this);

        // 会話ウィンドウ（黒い背景の四角）を作成
        this.dialogBox = this.add.graphics();
        this.dialogBox.fillStyle(0x000000, 0.9);
        this.dialogBox.fillRect(280, 400, 400, 130);
        this.dialogBox.setScrollFactor(0);
        this.dialogBox.setDepth(10);
        this.dialogBox.setVisible(false);

        // 会話テキスト
        this.dialogText = this.add.text(300, 410, "こんにちは", {
            fontSize: "24px",
            fill: "#ffffff",
            fontFamily: "MS UI Gothic"
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

class Player {
    constructor(scene, row, col, name, dir) {
        this.scene = scene;
        this.row = row;
        this.col = col;
    	this.sprite = scene.physics.add.sprite(col * TILE_SIZE, row * TILE_SIZE-CARA_OFFSET, name, 0);
        this.sprite.setOrigin(0, 0);
        this.direction = dir;
        this.isMoving = false;
        this.stepCount = 0;
    }

    move(dir) {
	    if (this.isMoving) return;
    	this.direction = dir;
    	if (dir < 0) return;

        let pos = [this.row, this.col];
        if (!updatePosition(pos, dir)) return;

        // 壁などにぶつからないようにチェック
        this.isMoving = canMove(this.scene, pos);
        if (!this.isMoving) {
			let idx = getTileIndex(this.scene, pos[0], pos[1]);
			if (pos[0] == 16 && pos[1] == 9) {
			    this.scene.townLayer.setVisible(false);
			    this.scene.luidaLayer.setVisible(true);
			}
	        return;
        }

        this.scene.tweens.add({
            targets: this.sprite,
            x: pos[1] * TILE_SIZE,
            y: pos[0] * TILE_SIZE - CARA_OFFSET,
            duration: MOVE_DELAY,
            onComplete: () => {
                this.isMoving = false;
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

class NPC {
    constructor(scene, row, col, name, image, move, dir) {
        this.scene = scene;
        this.row = row;
        this.col = col;
        this.name = name;
        this.image = image;
        this.sprite = scene.physics.add.sprite(col * TILE_SIZE, row * TILE_SIZE-CARA_OFFSET, name, 0);
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
        if (!canMove(this.scene, pos)) return;

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

let player, cursors, camera, bgm;
let npcList = [];	// 町人リスト

const config = {
    type: Phaser.AUTO,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    scene: [MainScene],
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    }
};

const game = new Phaser.Game(config);

function preload() {
    this.load.tilemapTiledJSON("map", "ariahan.json"); // マップデータ
    this.load.image("tiles", "town.png"); // タイルセット画像
    this.load.json("townData", "ariahan.json");
    this.load.audio("bgm", "town.mp3");
}

function create() {
    const townData = this.cache.json.get("townData");
    if (!townData || !townData.player || !townData.objects) {
    	console.error("Error: player data not found in JSON.");
	    return;
    }

    TILE_SIZE = townData.tilewidth;
    MAP_WIDTH = townData.width * TILE_SIZE;
    MAP_HEIGHT = townData.height * TILE_SIZE;

    const playerData = townData.player;
    this.load.spritesheet(playerData.name, playerData.image, { frameWidth: 32, frameHeight: 32 });

    // 町人画像をロード
    npcList = [];
    const npcData = townData.objects;
    npcData.forEach(npc => {
        this.load.spritesheet(npc.name, npc.image, { frameWidth: 32, frameHeight: 32 });
    });

    // 追加のロードを開始
    this.load.once("complete", () => {
	    // マップを読み込む
	    const map = this.make.tilemap({ key: "map" });
	    const tileset = map.addTilesetImage('tiles');

	    // 地面レイヤーを作成
	    this.townLayer = map.createLayer("Town", tileset, 0, 0);
	    this.townLayer.setScale(1);
	    this.luidaLayer = map.createLayer("Luida", tileset, 0, 0);
	    this.luidaLayer.setScale(1);
	    this.luidaLayer.setVisible(false);

	    // プレイヤーと町人を追加
	    player = new Player(this, playerData.row, playerData.col, playerData.name, playerData.dir);
        npcData.forEach(npc => {
            npcList.push(new NPC(this, npc.row, npc.col, npc.name, npc.image, npc.move, npc.dir));
        });

	    // カメラ設定
	    this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
	    camera = this.cameras.main;
	    camera.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
	    camera.startFollow(player.sprite, true, 0.1, 0.1);
	    camera.setZoom(2);
    }, this);
    this.load.start();

    // キーボード入力
    cursors = this.input.keyboard.createCursorKeys();

    // BGM
    bgm = this.sound.add('bgm', { loop: true, volume: 0.3 });
    bgm.play();

    // 歩行アニメーション
    this.time.addEvent({
        delay: 250,
        loop: true,
        callback: () => {
            player.updateFrame();
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
    let dir = 0;
	if (cursors.left.isDown) dir = DIR.LEFT;
    else if (cursors.right.isDown) dir = DIR.RIGHT;
    else if (cursors.up.isDown) dir = DIR.UP;
    else if (cursors.down.isDown) dir = DIR.DOWN;
    else return;

    player.move(dir);
}

function updatePosition(position, dir)
{
    if		(dir == DIR.DOWN)  position[0] += 1;
    else if (dir == DIR.UP)	   position[0] -= 1;
    else if (dir == DIR.LEFT)  position[1] -= 1;
    else if (dir == DIR.RIGHT) position[1] += 1;
    else return false;
    return true;
}

function canMove(scene, position) {
	let row = position[0], col = position[1];
	let idx = getTileIndex(scene, row, col);
	if (idx < 0 || idx >= TILE_OBS) return false;
    if (row == player.row && col == player.col) return false;
    if (npcList.some(npc => row == npc.row && col == npc.col)) return false;
	return true;
}

function getInverseDir(dir)
{
	if		(dir == DIR.DOWN)  return DIR.UP;
	else if (dir == DIR.UP)	   return DIR.DOWN;
	else if (dir == DIR.LEFT)  return DIR.RIGHT;
	else if (dir == DIR.RIGHT) return DIR.LEFT;
	else return dir;
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
