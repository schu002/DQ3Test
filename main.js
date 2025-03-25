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

let player, npc, cursors, camera, bgm;
let isMoving = false; // 移動中かどうかのフラグ
let stepCount = 0;	// 歩行フレームの管理
let playerDir = 0;	// プレイヤーの移動方向（0:正面, 1:後ろ, 2:左, 3:右）
let moveTimer = 0;	// 次の移動までのカウント
let npcMoveTimer = 0; // 町人の移動タイマー
let npcDir = 0;		// 町人の移動方向（0:正面, 1:後ろ, 2:左, 3:右）

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
    this.load.spritesheet("npc", "npc.png", { frameWidth: 32, frameHeight: 32 }); // 町人
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

    // 町人を追加
    let npcX = 15 * TILE_SIZE; // X座標（タイル単位で指定）
    let npcY = 20 * TILE_SIZE; // Y座標
    npc = this.add.sprite(npcX, npcY, "npc", 0);
    npc.setOrigin(0, 0);

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
            npc.setFrame(getNpcFrame());
        }
    });

    // 町人のランダム移動用のタイマーイベントを追加
    this.time.addEvent({
        delay: 2000, // 2秒ごとに移動
        loop: true,
        callback: () => moveNPC(this)
    });
}

// ?? 町人をランダムな方向に移動させる関数
function moveNPC(scene) {
    if (npcMoveTimer > scene.time.now) return;

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
    let tile = scene.groundLayer.getTileAtWorldXY(targetX, targetY);
    if (!tile || tile.index > 16) return; // 壁なら移動しない

    // NPC の移動
    npcMoveTimer = scene.time.now + MOVE_DELAY;
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

    if (moveX === 0 && moveY === 0 && time > moveTimer) {
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
        moveTimer = time + MOVE_DELAY;
    }

    if (moveX !== 0 || moveY !== 0) {
        isMoving = true;
        moveTimer = time + MOVE_DELAY;

        let targetX = player.x + moveX;
        let targetY = player.y + moveY;

        // 壁などには移動できない
        var tile = this.groundLayer.getTileAtWorldXY(targetX, targetY);
        if (!tile || tile.index > 16) {
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
