// 逕ｻ髱｢繧ｵ繧､繧ｺ・・蛟阪↓諡｡螟ｧ・・
const SCREEN_WIDTH = 960;
const SCREEN_HEIGHT = 720;

// 繧ｿ繧､繝ｫ繧ｵ繧､繧ｺ
const TILE_SIZE = 32;

// 繝槭ャ繝励し繧､繧ｺ・医ち繧､繝ｫ繝槭ャ繝励・螟ｧ縺阪＆・・
const MAP_WIDTH = 32 * TILE_SIZE;
const MAP_HEIGHT = 39 * TILE_SIZE;

// 遘ｻ蜍暮俣髫・
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
        this.isTalking = false;  // 莨夊ｩｱ荳ｭ縺九←縺・°縺ｮ繝輔Λ繧ｰ
    }

    preload() {
        preload.call(this);
    }

    create() {
        create.call(this);

        // A繧ｭ繝ｼ縺ｮ蜈･蜉幄ｨｭ螳・
        this.input.keyboard.on("keydown-A", this.toggleConversation, this);

        // 莨夊ｩｱ繧ｦ繧｣繝ｳ繝峨え・磯ｻ偵＞閭梧勹縺ｮ蝗幄ｧ抵ｼ峨ｒ菴懈・
        this.dialogBox = this.add.graphics();
        this.dialogBox.fillStyle(0x000000, 0.9);
        this.dialogBox.fillRect(280, 400, 400, 130);
        this.dialogBox.setScrollFactor(0);
        this.dialogBox.setDepth(10);
        this.dialogBox.setVisible(false);  // 蛻昴ａ縺ｯ髱櫁｡ｨ遉ｺ

        // 莨夊ｩｱ繝・く繧ｹ繝・
        this.dialogText = this.add.text(300, 410, "縺薙ｓ縺ｫ縺｡縺ｯ", {
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
            // 莨夊ｩｱ繧帝哩縺倥ｋ
            this.dialogBox.setVisible(false);
            this.dialogText.setVisible(false);
        } else {
            // 莨夊ｩｱ繧定｡ｨ遉ｺ
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
    constructor(scene, x, y, name, dir) {
        this.scene = scene;
    	this.sprite = scene.physics.add.sprite(x * TILE_SIZE, y * TILE_SIZE-CARA_OFFSET, name, 0);
        this.sprite.setOrigin(0, 0);
        this.direction = dir;
        this.isMoving = false;
        this.stepCount = 0;
    }

    move(dir) {
	    if (this.isMoving) return;
    	this.direction = dir;
    	if (dir < 0) return;

        let position = [this.sprite.x, this.sprite.y];
        if (!updatePosition(position, dir)) return;

        // 螢√↑縺ｩ縺ｫ縺ｯ遘ｻ蜍輔〒縺阪↑縺・
        this.isMoving = canMove(this.scene, position);
        if (!this.isMoving) return;

        this.scene.tweens.add({
            targets: this.sprite,
            x: position[0],
            y: position[1],
            duration: MOVE_DELAY,
            onComplete: () => {
                this.isMoving = false;
            }
        });
    }

    updateFrame() {
        this.stepCount ^= 1;
        this.sprite.setFrame(this.direction * 2 + this.stepCount);
    }
}

class NPC {
    constructor(scene, x, y, name, move, dir) {
        this.scene = scene;
        this.sprite = scene.physics.add.sprite(x * TILE_SIZE, y * TILE_SIZE-CARA_OFFSET, name, 0);
        this.sprite.setOrigin(0, 0);
        this.direction = (dir < 0)? Phaser.Math.Between(0, 3) : dir; // 繝ｩ繝ｳ繝繝縺ｪ譁ｹ蜷・
        this.canMove = move;
        this.stepCount = 0;
    }

    move() {
        if (!this.canMove) return;

        this.direction = Phaser.Math.Between(0, 3);
        let position = [this.sprite.x, this.sprite.y];
        if (!updatePosition(position, this.direction)) return;

        // 螢√↑縺ｩ縺ｫ縺ｶ縺､縺九ｉ縺ｪ縺・ｈ縺・↓繝√ぉ繝・け
        if (!canMove(this.scene, position)) return;

        // 遘ｻ蜍募・逅・
        this.scene.tweens.add({
            targets: this.sprite,
            x: position[0],
            y: position[1],
            duration: MOVE_DELAY
        });
    }

    updateFrame() {
        this.stepCount ^= 1;
        this.sprite.setFrame(this.direction * 2 + this.stepCount);
    }
}

let player, cursors, camera, bgm;
let npcList = [];	// 逕ｺ莠ｺ繝ｪ繧ｹ繝・

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
    this.load.tilemapTiledJSON("map", "ariahan.json"); // 繝槭ャ繝励ョ繝ｼ繧ｿ
    this.load.image("tiles", "town.png"); // 繧ｿ繧､繝ｫ繧ｻ繝・ヨ逕ｻ蜒・
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

    // 逕ｻ蜒上ｒ繝ｭ繝ｼ繝・
    npcList = [];
    const npcData = townData.objects;
    npcData.forEach(npc => {
        this.load.spritesheet(npc.name, npc.image, { frameWidth: 32, frameHeight: 32 });
    });

    // 霑ｽ蜉縺ｮ繝ｭ繝ｼ繝峨ｒ髢句ｧ・
    this.load.once("complete", () => {
	    // 繝槭ャ繝励ｒ隱ｭ縺ｿ霎ｼ繧
	    const map = this.make.tilemap({ key: "map" });
	    const tileset = map.addTilesetImage('tiles');

	    // 蝨ｰ髱｢繝ｬ繧､繝､繝ｼ繧剃ｽ懈・
	    this.groundLayer = map.createLayer("Town", tileset, 0, 0);
	    this.groundLayer.setScale(1);

	    // 繝励Ξ繧､繝､繝ｼ繧定ｿｽ蜉
	    player = new Player(this, playerData.x, playerData.y, playerData.name, playerData.dir);
        npcData.forEach(npc => {
            npcList.push(new NPC(this, npc.x, npc.y, npc.name, npc.move, npc.dir));
        });

	    // 繧ｫ繝｡繝ｩ險ｭ螳・
	    this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
	    camera = this.cameras.main;
	    camera.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
	    camera.startFollow(player.sprite, true, 0.1, 0.1);
	    camera.setZoom(2);
    }, this);
    this.load.start();

    // 繧ｭ繝ｼ繝懊・繝牙・蜉・
    cursors = this.input.keyboard.createCursorKeys();

    // BGM
    bgm = this.sound.add('bgm', { loop: true, volume: 0.3 });
    bgm.play();

    // 豁ｩ陦後い繝九Γ繝ｼ繧ｷ繝ｧ繝ｳ
    this.time.addEvent({
        delay: 250,
        loop: true,
        callback: () => {
            player.updateFrame();
            npcList.forEach(npc => npc.updateFrame());
        }
    });

    // 逕ｺ莠ｺ縺ｮ繝ｩ繝ｳ繝繝遘ｻ蜍輔ｒ蛟句挨縺ｫ蜃ｦ逅・
    this.time.addEvent({
        delay: 2000, // 2遘偵＃縺ｨ縺ｫ遘ｻ蜍・
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
    if		(dir == DIR.DOWN)  position[1] += TILE_SIZE;
    else if (dir == DIR.UP)	   position[1] -= TILE_SIZE;
    else if (dir == DIR.LEFT)  position[0] -= TILE_SIZE;
    else if (dir == DIR.RIGHT) position[0] += TILE_SIZE;
    else return false;
    return true;
}

function canMove(scene, position) {
    let x = position[0], y = position[1];
    var tile = scene.groundLayer.getTileAtWorldXY(x, y+CARA_OFFSET);
    if (!tile || tile.index > 16) return false;
    if (x == player.x && y == player.y) return false;
    if (npcList.some(npc => x == npc.sprite.x && y == npc.sprite.y)) return false;
	return true;
}
