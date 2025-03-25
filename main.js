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

let player, npc, cursors, camera, bgm;
let isMoving = false; // �ړ������ǂ����̃t���O
let stepCount = 0;	// ���s�t���[���̊Ǘ�
let playerDir = 0;	// �v���C���[�̈ړ������i0:����, 1:���, 2:��, 3:�E�j
let moveTimer = 0;	// ���̈ړ��܂ł̃J�E���g
let npcMoveTimer = 0; // ���l�̈ړ��^�C�}�[
let npcDir = 0;		// ���l�̈ړ������i0:����, 1:���, 2:��, 3:�E�j

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
    this.load.spritesheet("npc", "npc.png", { frameWidth: 32, frameHeight: 32 }); // ���l
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

    // ���l��ǉ�
    let npcX = 15 * TILE_SIZE; // X���W�i�^�C���P�ʂŎw��j
    let npcY = 20 * TILE_SIZE; // Y���W
    npc = this.add.sprite(npcX, npcY, "npc", 0);
    npc.setOrigin(0, 0);

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
            npc.setFrame(getNpcFrame());
        }
    });

    // ���l�̃����_���ړ��p�̃^�C�}�[�C�x���g��ǉ�
    this.time.addEvent({
        delay: 2000, // 2�b���ƂɈړ�
        loop: true,
        callback: () => moveNPC(this)
    });
}

// ?? ���l�������_���ȕ����Ɉړ�������֐�
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

    // �ǂȂǂɂԂ���Ȃ��悤�Ƀ`�F�b�N
    if (!canMove(scene, targetX, targetY)) return;

    // NPC �̈ړ�
    npcMoveTimer = scene.time.now + MOVE_DELAY;
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
    if (x == npc.x && y == npc.y) return false;
	return true;
}
