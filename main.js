// 画面サイズ（2倍に拡大）
const SCREEN_WIDTH = 960;
const SCREEN_HEIGHT = 720;

// タイルサイズ
const TILE_SIZE = 32;

// マップサイズ（タイルマップの大きさ）
const MAP_WIDTH = 32 * TILE_SIZE;
const MAP_HEIGHT = 39 * TILE_SIZE;

// 移動間隔
const MOVE_DELAY = 250;

var DIR = {
	DOWN	: 0,
	UP		: 1,
	LEFT	: 2,
	RIGHT	: 3
};

class NPC {
    constructor(scene, x, y, texture) {
        this.scene = scene;
        this.sprite = scene.physics.add.sprite(x * TILE_SIZE, y * TILE_SIZE, texture, 0);
        this.sprite.setOrigin(0, 0);
        this.direction = Phaser.Math.Between(0, 3); // ランダムな方向
        this.moveTimer = 0;
    }

    move() {
        if (this.moveTimer > this.scene.time.now) return;

        let targetX = this.sprite.x;
        let targetY = this.sprite.y;
        this.direction = Phaser.Math.Between(0, 3);

        if (this.direction == DIR.DOWN) targetY += TILE_SIZE;
        else if (this.direction == DIR.UP) targetY -= TILE_SIZE;
        else if (this.direction == DIR.LEFT) targetX -= TILE_SIZE;
        else targetX += TILE_SIZE;

        // 壁などにぶつからないようにチェック
        if (!canMove(this.scene, targetX, targetY)) return;

        // 移動処理
        this.moveTimer = this.scene.time.now + MOVE_DELAY;
        this.scene.tweens.add({
            targets: this.sprite,
            x: targetX,
            y: targetY,
            duration: MOVE_DELAY
        });
    }

    updateFrame() {
        this.sprite.setFrame(this.direction * 2 + stepCount);
    }
}

let player, cursors, camera, bgm;
let npcList = [];	// 町人リスト
let isMoving = false; // 移動中かどうかのフラグ
let stepCount = 0;	// 歩行フレームの管理
let playerDir = 0;	// プレイヤーの移動方向（0:正面, 1:後ろ, 2:左, 3:右）
let playerTimer = 0; // 次の移動までのカウント

const config = {
    type: Phaser.AUTO,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

function preload() {
    this.load.tilemapTiledJSON("map", "ariahan.json"); // マップデータ
    this.load.image("tiles", "town.png"); // タイルセット画像
    this.load.spritesheet("character", "soldier.png", { frameWidth: 32, frameHeight: 32 });
    this.load.json("npcData", "ariahan.json");
    this.load.audio("bgm", "town.mp3");
}

function create() {
    // マップを読み込む
    const map = this.make.tilemap({ key: "map" });
    const tileset = map.addTilesetImage('tiles');

    // 地面レイヤーを作成
    this.groundLayer = map.createLayer("Town", tileset, 0, 0);
    this.groundLayer.setScale(1);

    // プレイヤーを追加
    let startX = Phaser.Math.Snap.To(10, TILE_SIZE);
    let startY = Phaser.Math.Snap.To(800, TILE_SIZE);
    player = this.physics.add.sprite(startX, startY, 'character', 0);
    player.setOrigin(0, 0);

    // 画像をロード
    npcList = [];
    const npcData = this.cache.json.get("npcData").objects;
    if (!npcData) return;
    npcData.forEach(npc => {
        this.load.spritesheet(npc.name, npc.image, { frameWidth: 32, frameHeight: 32 });
    });

    // 追加のロードを開始
    this.load.once("complete", () => {
        npcData.forEach(npc => {
            npcList.push(new NPC(this, npc.x, npc.y, npc.name));
        });
    }, this);
    this.load.start();

    // カメラ設定
    this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    camera = this.cameras.main;
    camera.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    camera.startFollow(player, true, 0.1, 0.1);
    camera.setZoom(2);

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
            stepCount = (stepCount + 1) % 2; // 0, 1 を交互に
            player.setFrame(getPlayerFrame());
            npcList.forEach(npc => npc.updateFrame());
        }
    });

    // 町人のランダム移動を個別に処理
    this.time.addEvent({
        delay: 2000, // 2秒ごとに移動
        loop: true,
        callback: () => {
	        npcList.forEach(npc => npc.move());
        }
    });
}

// 町人をランダムな方向に移動させる関数
function moveNPC(scene) {
    let targetX = npc.x;
    let targetY = npc.y;

    npcDir = Phaser.Math.Between(0, 3);
    if (npcDir == DIR.DOWN) {
        targetY += TILE_SIZE;
    } else if (npcDir == DIR.UP) {
        targetY -= TILE_SIZE;
    } else if (npcDir == DIR.LEFT) {
        targetX -= TILE_SIZE;
    } else {
        targetX += TILE_SIZE;
    }

    // 壁などにぶつからないようにチェック
    if (!canMove(scene, targetX, targetY)) return;

    // NPC の移動
    scene.tweens.add({
        targets: npc,
        x: targetX,
        y: targetY,
        duration: MOVE_DELAY
    });
}

function update(time) {
    if (isMoving) return; // 移動中ならキー入力を無視

    let moveX = 0, moveY = 0;

    if (Phaser.Input.Keyboard.JustDown(cursors.left)) {
        moveX = -TILE_SIZE;
        playerDir = DIR.LEFT;
    } else if (Phaser.Input.Keyboard.JustDown(cursors.right)) {
        moveX = TILE_SIZE;
        playerDir = DIR.RIGHT;
    } else if (Phaser.Input.Keyboard.JustDown(cursors.up)) {
        moveY = -TILE_SIZE;
        playerDir = DIR.UP;
    } else if (Phaser.Input.Keyboard.JustDown(cursors.down)) {
        moveY = TILE_SIZE;
        playerDir = DIR.DOWN;
    }

    if (moveX === 0 && moveY === 0 && time > playerTimer) {
        if (cursors.left.isDown) {
            moveX = -TILE_SIZE;
            playerDir = DIR.LEFT;
        } else if (cursors.right.isDown) {
            moveX = TILE_SIZE;
            playerDir = DIR.RIGHT;
        } else if (cursors.up.isDown) {
            moveY = -TILE_SIZE;
            playerDir = DIR.UP;
        } else if (cursors.down.isDown) {
            moveY = TILE_SIZE;
            playerDir = DIR.DOWN;
        }
        playerTimer = time + MOVE_DELAY;
    }

    if (moveX !== 0 || moveY !== 0) {
        isMoving = true;
        playerTimer = time + MOVE_DELAY;

        let targetX = player.x + moveX;
        let targetY = player.y + moveY;

        // 壁などには移動できない
        if (!canMove(this, targetX, targetY)) {
            isMoving = false;
        } else {
            this.tweens.add({
                targets: player,
                x: targetX,
                y: targetY,
                duration: MOVE_DELAY,
                onComplete: () => {
                    isMoving = false;
                }
            });
        }
    }
}

function getPlayerFrame() { return playerDir * 2 + stepCount; }
function getNpcFrame() { return npcDir * 2 + stepCount; }
function canMove(scene, x, y) {
    var tile = scene.groundLayer.getTileAtWorldXY(x, y);
    if (!tile || tile.index > 16) return false;
    if (x == player.x && y == player.y) return false;
    if (npcList.some(npc => x == npc.sprite.x && y == npc.sprite.y)) return false;
	return true;
}
