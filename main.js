// 逕サ髱「繧オ繧、繧コ・・蛟阪↓諡。螟ァ・・
const SCREEN_WIDTH = 960;
const SCREEN_HEIGHT = 720;

// 遘サ蜍暮俣髫・
const MOVE_DELAY = 280;
const CARA_OFFSET = 8;

let TILE_SIZE = 32

var DIR = {
	DOWN	: 0,
	UP		: 1,
	LEFT	: 2,
	RIGHT	: 3
};

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: "MainScene" });
        this.isTalking = false;  // 莨夊ゥア荳ュ縺九←縺・°縺ョ繝輔Λ繧ー
    }

    preload() {
        preload.call(this);
    }

    create() {
        create.call(this);

        // A繧ュ繝シ縺ョ蜈・蜉幄ィュ螳・
        this.input.keyboard.on("keydown-A", this.toggleConversation, this);

        // 莨夊ゥア繧ヲ繧」繝ウ繝峨え・磯サ偵＞閭梧勹縺ョ蝗幄ァ抵シ峨ｒ菴懈・
        this.dialogBox = this.add.graphics();
        this.dialogBox.fillStyle(0x000000, 0.9);
        this.dialogBox.fillRect(280, 400, 400, 130);
        this.dialogBox.setScrollFactor(0);
        this.dialogBox.setDepth(10);
        this.dialogBox.setVisible(false);  // 蛻昴ａ縺ッ髱櫁。ィ遉コ

        // 莨夊ゥア繝・く繧ケ繝・
        this.dialogText = this.add.text(300, 410, "縺薙ｓ縺ォ縺。縺ッ", {
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
            // 莨夊ゥア繧帝哩縺倥ｋ
            this.dialogBox.setVisible(false);
            this.dialogText.setVisible(false);
        } else {
            // 莨夊ゥア繧定。ィ遉コ
            this.dialogBox.setVisible(true);
            this.dialogText.setVisible(true);
        }
        this.isTalking = !this.isTalking;
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

        let position = [this.row, this.col];
        if (!updatePosition(position, dir)) return;

        // 螢√↑縺ゥ縺ォ縺ッ遘サ蜍輔〒縺阪↑縺・
        this.isMoving = canMove(this.scene, position);
        if (!this.isMoving) return;

        this.scene.tweens.add({
            targets: this.sprite,
            x: position[1] * TILE_SIZE,
            y: position[0] * TILE_SIZE - CARA_OFFSET,
            duration: MOVE_DELAY,
            onComplete: () => {
                this.isMoving = false;
                this.row = position[0];
                this.col = position[1];
            }
        });
    }

    updateFrame() {
        this.stepCount ^= 1;
        this.sprite.setFrame(this.direction * 2 + this.stepCount);
    }
}

class NPC {
    constructor(scene, row, col, name, move, dir) {
        this.scene = scene;
        this.row = row;
        this.col = col;
        this.sprite = scene.physics.add.sprite(col * TILE_SIZE, row * TILE_SIZE-CARA_OFFSET, name, 0);
        this.sprite.setOrigin(0, 0);
        this.direction = (dir < 0)? Phaser.Math.Between(0, 3) : dir; // 繝ゥ繝ウ繝繝縺ェ譁ケ蜷・
        this.canMove = move;
        this.stepCount = 0;
    }

    move() {
        if (!this.canMove) return;

        this.direction = Phaser.Math.Between(0, 3);
        let position = [this.row, this.col];
        if (!updatePosition(position, this.direction)) return;

        // 螢√↑縺ゥ縺ォ縺カ縺、縺九ｉ縺ェ縺・ｈ縺・↓繝√ぉ繝・け
        if (!canMove(this.scene, position)) return;

        // 遘サ蜍募・逅・
        this.scene.tweens.add({
            targets: this.sprite,
            x: position[1] * TILE_SIZE,
            y: position[0] * TILE_SIZE - CARA_OFFSET,
            duration: MOVE_DELAY,
            onComplete: () => {
                this.row = position[0];
                this.col = position[1];
            }
        });
    }

    updateFrame() {
        this.stepCount ^= 1;
        this.sprite.setFrame(this.direction * 2 + this.stepCount);
    }
}

let player, cursors, camera, bgm;
let npcList = [];	// 逕コ莠コ繝ェ繧ケ繝・

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
    this.load.tilemapTiledJSON("map", "ariahan.json"); // 繝槭ャ繝励ョ繝シ繧ソ
    this.load.image("tiles", "town.png"); // 繧ソ繧、繝ォ繧サ繝・ヨ逕サ蜒・
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
    const MAP_WIDTH = townData.width * TILE_SIZE;
    const MAP_HEIGHT = townData.height * TILE_SIZE;

    const playerData = townData.player;
    this.load.spritesheet(playerData.name, playerData.image, { frameWidth: 32, frameHeight: 32 });

    // 逕サ蜒上ｒ繝ュ繝シ繝・
    npcList = [];
    const npcData = townData.objects;
    npcData.forEach(npc => {
        this.load.spritesheet(npc.name, npc.image, { frameWidth: 32, frameHeight: 32 });
    });

    // 霑ス蜉縺ョ繝ュ繝シ繝峨ｒ髢句ァ・
    this.load.once("complete", () => {
	    // 繝槭ャ繝励ｒ隱ュ縺ソ霎シ繧
	    const map = this.make.tilemap({ key: "map" });
	    const tileset = map.addTilesetImage('tiles');

	    // 蝨ー髱「繝ャ繧、繝、繝シ繧剃ス懈・
	    this.groundLayer = map.createLayer("Town", tileset, 0, 0);
	    this.groundLayer.setScale(1);

	    // 繝励Ξ繧、繝、繝シ繧定ソス蜉
	    player = new Player(this, playerData.row, playerData.col, playerData.name, playerData.dir);
        npcData.forEach(npc => {
            npcList.push(new NPC(this, npc.row, npc.col, npc.name, npc.move, npc.dir));
        });

	    // 繧ォ繝。繝ゥ險ュ螳・
	    this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
	    camera = this.cameras.main;
	    camera.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
	    camera.startFollow(player.sprite, true, 0.1, 0.1);
	    camera.setZoom(2);
    }, this);
    this.load.start();

    // 繧ュ繝シ繝懊・繝牙・蜉・
    cursors = this.input.keyboard.createCursorKeys();

    // BGM
    bgm = this.sound.add('bgm', { loop: true, volume: 0.3 });
    bgm.play();

    // 豁ゥ陦後い繝九Γ繝シ繧キ繝ァ繝ウ
    this.time.addEvent({
        delay: 250,
        loop: true,
        callback: () => {
            player.updateFrame();
            npcList.forEach(npc => npc.updateFrame());
        }
    });

    // 逕コ莠コ縺ョ繝ゥ繝ウ繝繝遘サ蜍輔ｒ蛟句挨縺ォ蜃ヲ逅・
    this.time.addEvent({
        delay: 2000, // 2遘偵＃縺ィ縺ォ遘サ蜍・
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
    var tile = scene.groundLayer.getTileAtWorldXY(col * TILE_SIZE, row * TILE_SIZE);
    if (!tile || tile.index > 16) return false;
    if (row == player.row && col == player.col) return false;
    if (npcList.some(npc => row == npc.row && col == npc.col)) return false;
	return true;
}
