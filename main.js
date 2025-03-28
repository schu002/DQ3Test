// 画面サイズ�E�E倍に拡大�E�E
const SCREEN_WIDTH = 960;
const SCREEN_HEIGHT = 720;

// タイルサイズ
const TILE_SIZE = 32;

// マップサイズ�E�タイルマップ�E大きさ�E�E
const MAP_WIDTH = 32 * TILE_SIZE;
const MAP_HEIGHT = 39 * TILE_SIZE;

// 移動間隁E
const MOVE_DELAY = 280;
const CARA_OFFSET = 8;

var DIR = {
	DOWN	: 0,
	UP		: 1,
	LEFT	: 2,
	RIGHT	: 3
};

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: "MainScene" });
        this.isTalking = false;  // 会話中かどぁE��のフラグ
    }

    preload() {
        preload.call(this);
    }

    create() {
        create.call(this);

        // Aキーの入力設宁E
        this.input.keyboard.on("keydown-A", this.toggleConversation, this);

        // 会話ウィンドウ�E�黒い背景の四角）を作�E
        this.dialogBox = this.add.graphics();
        this.dialogBox.fillStyle(0x000000, 0.9);
        this.dialogBox.fillRect(280, 400, 400, 130);
        this.dialogBox.setScrollFactor(0);
        this.dialogBox.setDepth(10);
        this.dialogBox.setVisible(false);  // 初めは非表示

        // 会話チE��スチE
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
            // 会話を閉じる
            this.dialogBox.setVisible(false);
            this.dialogText.setVisible(false);
        } else {
            // 会話を表示
            this.dialogBox.setVisible(true);
            this.dialogText.setVisible(true);
        }
        this.isTalking = !this.isTalking;
    }

    update() {
        update.call(this);
    }
}

class Player extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, name, dir) {
        super(scene, x * TILE_SIZE, y * TILE_SIZE-CARA_OFFSET, name);
        this.scene = scene;
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
        this.setOrigin(0, 0);
        this.direction = dir;
        this.stepCount = 0;
        this.isMoving = false;
    }

    move(dir) {
	    if (this.isMoving) return;
    	this.direction = dir;
    	if (dir < 0) return;

        let targetX = this.x;
        let targetY = this.y;
        if (this.direction == DIR.DOWN) targetY += TILE_SIZE;
        else if (this.direction == DIR.UP) targetY -= TILE_SIZE;
        else if (this.direction == DIR.LEFT) targetX -= TILE_SIZE;
        else if (this.direction == DIR.RIGHT) targetX += TILE_SIZE;
        else return;

        // 壁などには移動できなぁE
        this.isMoving = canMove(this.scene, targetX, targetY);
        if (!this.isMoving) return;

        this.scene.tweens.add({
            targets: this,
            x: targetX,
            y: targetY,
            duration: MOVE_DELAY,
            onComplete: () => {
                this.isMoving = false;
            }
        });
    }

    updateFrame() {
        this.stepCount ^= 1;
        this.setFrame(this.direction * 2 + this.stepCount);
    }
}

class NPC {
    constructor(scene, x, y, name, move, dir) {
        this.scene = scene;
        this.sprite = scene.physics.add.sprite(x * TILE_SIZE, y * TILE_SIZE-CARA_OFFSET, name, 0);
        this.sprite.setOrigin(0, 0);
        this.direction = (dir < 0)? Phaser.Math.Between(0, 3) : dir; // ランダムな方吁E
        this.canMove = move;
        this.stepCount = 0;
    }

    move() {
        if (!this.canMove) return;

        let targetX = this.sprite.x;
        let targetY = this.sprite.y;
        this.direction = Phaser.Math.Between(0, 3);

        if (this.direction == DIR.DOWN) targetY += TILE_SIZE;
        else if (this.direction == DIR.UP) targetY -= TILE_SIZE;
        else if (this.direction == DIR.LEFT) targetX -= TILE_SIZE;
        else targetX += TILE_SIZE;

        // 壁などにぶつからなぁE��ぁE��チェチE��
        if (!canMove(this.scene, targetX, targetY)) return;

        // 移動�E琁E
        this.scene.tweens.add({
            targets: this.sprite,
            x: targetX,
            y: targetY,
            duration: MOVE_DELAY
        });
    }

    updateFrame() {
        this.stepCount ^= 1;
        this.sprite.setFrame(this.direction * 2 + this.stepCount);
    }
}

let player, cursors, camera, bgm;
let npcList = [];	// 町人リスチE

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
    this.load.image("tiles", "town.png"); // タイルセチE��画僁E
    this.load.json("townData", "ariahan.json");
    this.load.audio("bgm", "town.mp3");
}

function create() {
    const townData = this.cache.json.get("townData");
    if (!townData || !townData.player || !townData.objects) {
    	console.error("Error: player data not found in JSON.");
	    return;
    }

    const playerData = townData.player;
    this.load.spritesheet(playerData.name, playerData.image, { frameWidth: 32, frameHeight: 32 });

    // 画像をローチE
    npcList = [];
    const npcData = townData.objects;
    npcData.forEach(npc => {
        this.load.spritesheet(npc.name, npc.image, { frameWidth: 32, frameHeight: 32 });
    });

    // 追加のロードを開姁E
    this.load.once("complete", () => {
	    // マップを読み込む
	    const map = this.make.tilemap({ key: "map" });
	    const tileset = map.addTilesetImage('tiles');

	    // 地面レイヤーを作�E
	    this.groundLayer = map.createLayer("Town", tileset, 0, 0);
	    this.groundLayer.setScale(1);

	    // プレイヤーを追加
	    player = new Player(this, playerData.x, playerData.y, playerData.name, playerData.dir);
        npcData.forEach(npc => {
            npcList.push(new NPC(this, npc.x, npc.y, npc.name, npc.move, npc.dir));
        });

	    // カメラ設宁E
	    this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
	    camera = this.cameras.main;
	    camera.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
	    camera.startFollow(player, true, 0.1, 0.1);
	    camera.setZoom(2);
    }, this);
    this.load.start();

    // キーボ�Eド�E劁E
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

    // 町人のランダム移動を個別に処琁E
    this.time.addEvent({
        delay: 2000, // 2秒ごとに移勁E
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

function canMove(scene, x, y) {
    var tile = scene.groundLayer.getTileAtWorldXY(x, y+CARA_OFFSET);
    if (!tile || tile.index > 16) return false;
    if (x == player.x && y == player.y) return false;
    if (npcList.some(npc => x == npc.sprite.x && y == npc.sprite.y)) return false;
	return true;
}
