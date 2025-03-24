// ��ʃT�C�Y�i2�{�Ɋg��j
const SCREEN_WIDTH = 960;
const SCREEN_HEIGHT = 720;

// �^�C���T�C�Y
const TILE_SIZE = 32;

// �}�b�v�T�C�Y�i�^�C���}�b�v�̑傫���j
const MAP_WIDTH = 32 * TILE_SIZE;
const MAP_HEIGHT = 39 * TILE_SIZE;

// �ړ��Ԋu
const MOVE_DELAY = 250;

let player, cursors, camera, bgm;
let isMoving = false; // �ړ������ǂ����̃t���O
let stepCount = 0; // ���s�t���[���̊Ǘ�
let direction = 0; // �����i0:����, 1:���, 2:��, 3:�E�j
let moveTimer = 0; // ���̈ړ��܂ł̃J�E���g

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
    this.load.tilemapTiledJSON("map", "ariahan.json"); // �}�b�v�f�[�^
    this.load.image("tiles", "town.png"); // �^�C���Z�b�g�摜
    this.load.spritesheet("character", "soldier.png", { frameWidth: 32, frameHeight: 32 });
    this.load.audio("bgm", "town.mp3");
}

function create() {
    // �}�b�v��ǂݍ���
    const map = this.make.tilemap({ key: "map" });
    const tileset = map.addTilesetImage('tiles');

    // �n�ʃ��C���[���쐬
    this.groundLayer = map.createLayer("Town", tileset, 0, 0);
    this.groundLayer.setScale(1);
    map.setCollision([7, 17, 18]);

    // �v���C���[�̏����ʒu
    let startX = Phaser.Math.Snap.To(10, TILE_SIZE);
    let startY = Phaser.Math.Snap.To(800, TILE_SIZE);

    // �v���C���[��ǉ�
    player = this.physics.add.sprite(startX, startY, 'character', 0);
    player.setOrigin(0, 0);
    player.setCollideWorldBounds(true);
    this.physics.add.collider(player, this.groundLayer);

    // �J�����ݒ�
    this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    camera = this.cameras.main;
    camera.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    camera.startFollow(player, true, 0.1, 0.1);
    camera.setZoom(2);

    // �L�[�{�[�h����
    cursors = this.input.keyboard.createCursorKeys();

    // BGM
    bgm = this.sound.add('bgm', { loop: true, volume: 0.3 });
    bgm.play();

    // ���s�A�j���[�V����
    this.time.addEvent({
        delay: 250,
        loop: true,
        callback: () => {
            stepCount = (stepCount + 1) % 2; // 0, 1 �����݂�
            player.setFrame(getCurrentFrame());
        }
    });
}

function update(time) {
    if (isMoving) return; // �ړ����Ȃ�L�[���͂𖳎�

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

        // �ǂȂǂɂ͈ړ��ł��Ȃ�
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
