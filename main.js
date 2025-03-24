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

let player, cursors, camera, bgm;
let isMoving = false; // 移動中かどうかのフラグ
let stepCount = 0; // 歩行フレームの管理
let direction = 0; // 方向（0:正面, 1:後ろ, 2:左, 3:右）
let moveTimer = 0; // 次の移動までのカウント

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
    this.load.audio("bgm", "town.mp3");
}

function create() {
    // マップを読み込む
    const map = this.make.tilemap({ key: "map" });
    const tileset = map.addTilesetImage('tiles');

    // 地面レイヤーを作成
    this.groundLayer = map.createLayer("Town", tileset, 0, 0);
    this.groundLayer.setScale(1);
    map.setCollision([7, 17, 18]);

    // プレイヤーの初期位置
    let startX = Phaser.Math.Snap.To(10, TILE_SIZE);
    let startY = Phaser.Math.Snap.To(800, TILE_SIZE);

    // プレイヤーを追加
    player = this.physics.add.sprite(startX, startY, 'character', 0);
    player.setOrigin(0, 0);
    player.setCollideWorldBounds(true);
    this.physics.add.collider(player, this.groundLayer);

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
            player.setFrame(getCurrentFrame());
        }
    });
}

function update(time) {
    if (isMoving) return; // 移動中ならキー入力を無視

    let moveX = 0, moveY = 0;

    if (Phaser.Input.Keyboard.JustDown(cursors.left)) {
        moveX = -TILE_SIZE;
        direction = 2;
    } else if (Phaser.Input.Keyboard.JustDown(cursors.right)) {
        moveX = TILE_SIZE;
        direction = 3;
    } else if (Phaser.Input.Keyboard.JustDown(cursors.up)) {
        moveY = -TILE_SIZE;
        direction = 1;
    } else if (Phaser.Input.Keyboard.JustDown(cursors.down)) {
        moveY = TILE_SIZE;
        direction = 0;
    }

    if (moveX === 0 && moveY === 0 && time > moveTimer) {
        if (cursors.left.isDown) {
            moveX = -TILE_SIZE;
            direction = 2;
        } else if (cursors.right.isDown) {
            moveX = TILE_SIZE;
            direction = 3;
        } else if (cursors.up.isDown) {
            moveY = -TILE_SIZE;
            direction = 1;
        } else if (cursors.down.isDown) {
            moveY = TILE_SIZE;
            direction = 0;
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
        if (tile.index > 16) {
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

function getCurrentFrame() {
    return direction * 2 + stepCount;
}
