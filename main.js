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
        this.direction = Phaser.Math.Between(0, 3); // �����_���ȕ���
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

        // �ǂȂǂɂԂ���Ȃ��悤�Ƀ`�F�b�N
        if (!canMove(this.scene, targetX, targetY)) return;

        // �ړ�����
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
let npcList = [];	// ���l���X�g
let isMoving = false; // �ړ������ǂ����̃t���O
let stepCount = 0;	// ���s�t���[���̊Ǘ�
let playerDir = 0;	// �v���C���[�̈ړ������i0:����, 1:���, 2:��, 3:�E�j
let playerTimer = 0; // ���̈ړ��܂ł̃J�E���g

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
    this.load.json("npcData", "ariahan.json");
    this.load.audio("bgm", "town.mp3");
}

function create() {
    // �}�b�v��ǂݍ���
    const map = this.make.tilemap({ key: "map" });
    const tileset = map.addTilesetImage('tiles');

    // �n�ʃ��C���[���쐬
    this.groundLayer = map.createLayer("Town", tileset, 0, 0);
    this.groundLayer.setScale(1);

    // �v���C���[��ǉ�
    let startX = Phaser.Math.Snap.To(10, TILE_SIZE);
    let startY = Phaser.Math.Snap.To(800, TILE_SIZE);
    player = this.physics.add.sprite(startX, startY, 'character', 0);
    player.setOrigin(0, 0);

    // �摜�����[�h
    npcList = [];
    const npcData = this.cache.json.get("npcData").objects;
    if (!npcData) return;
    npcData.forEach(npc => {
        this.load.spritesheet(npc.name, npc.image, { frameWidth: 32, frameHeight: 32 });
    });

    // �ǉ��̃��[�h���J�n
    this.load.once("complete", () => {
        npcData.forEach(npc => {
            npcList.push(new NPC(this, npc.x, npc.y, npc.name));
        });
    }, this);
    this.load.start();

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
            player.setFrame(getPlayerFrame());
            npcList.forEach(npc => npc.updateFrame());
        }
    });

    // ���l�̃����_���ړ����ʂɏ���
    this.time.addEvent({
        delay: 2000, // 2�b���ƂɈړ�
        loop: true,
        callback: () => {
	        npcList.forEach(npc => npc.move());
        }
    });
}

// ���l�������_���ȕ����Ɉړ�������֐�
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

    // �ǂȂǂɂԂ���Ȃ��悤�Ƀ`�F�b�N
    if (!canMove(scene, targetX, targetY)) return;

    // NPC �̈ړ�
    scene.tweens.add({
        targets: npc,
        x: targetX,
        y: targetY,
        duration: MOVE_DELAY
    });
}

function update(time) {
    if (isMoving) return; // �ړ����Ȃ�L�[���͂𖳎�

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

        // �ǂȂǂɂ͈ړ��ł��Ȃ�
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
