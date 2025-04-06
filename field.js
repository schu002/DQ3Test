import Player from "./player.js";
import TownScene from "./town.js";
import BattleScene from "./battle.js";
import OccupationData from "./OccupationData.js";
import { updatePosition, getInverseDir } from "./util.js";

const TILE_OBS = 22;

let player, bgm, battleBGM;

class FieldScene extends Phaser.Scene {
    constructor() {
        super({ key: "FieldScene" });
    }

    preload() {
        this.load.audio("battleBGM1", "sound/battle1.mp3");
    }

    create(data) {
	    const gameData = this.cache.json.get("gameData");
	    const fieldData = this.cache.json.get("fieldData");
	    if (!gameData || !fieldData) {
	    	console.error("Error: field data not found in JSON.");
		    return;
	    }

	    const MAP_WIDTH = fieldData.width * TILE_SIZE;
	    const MAP_HEIGHT = fieldData.height * TILE_SIZE;

        // キーボード入力
	    this.keys = this.input.keyboard.createCursorKeys();
	    this.wasd = this.input.keyboard.addKeys({
		    up: Phaser.Input.Keyboard.KeyCodes.W,
		    down: Phaser.Input.Keyboard.KeyCodes.S,
		    left: Phaser.Input.Keyboard.KeyCodes.A,
		    right: Phaser.Input.Keyboard.KeyCodes.D
		});

        // BGM
	    battleBGM = this.sound.add("battleBGM1", { loop: false, volume: 0.3 });
	    bgm = this.sound.add("fieldBGM", { loop: true, volume: 0.3 });
	    bgm.play();

        this.events.on("resume", this.onResume, this);

	    // マップを読み込む
	    const map = this.make.tilemap({ key: "fieldMap" });
	    const tileset = map.addTilesetImage("fieldTiles");

	    this.fieldLayer = map.createLayer("Field", tileset, 0, 0);
	    this.fieldLayer.setScale(1);
	    this.fieldLayer.setVisible(true);

	    // プレイヤーをフィールドの開始位置に追加
        this.members = [];
	    gameData.members.forEach(member => {
	        this.members.push(new Player(this, member.name, member.occupation, data.row, data.col, 0, CARA_OFFSET));
	        this.add.existing(this.members[this.members.length-1]);
	    });
        player = this.members[0];

        // カメラ設定
        this.cameras.main.startFollow(player.sprite);
        this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
        this.cameras.main.setZoom(2);

        this.time.addEvent({
	        delay: 250,
	        loop: true,
	        callback: () => {
	            this.members.forEach(member => member.updateFrame());
	        }
	    });
    }

    update() {
	    if (this.isMoving) return;
	    let dir = -1;
	    if		(this.keys.left.isDown	|| this.wasd.left.isDown)  dir = DIR.LEFT;
	    else if (this.keys.right.isDown || this.wasd.right.isDown) dir = DIR.RIGHT;
	    else if (this.keys.up.isDown	|| this.wasd.up.isDown)	   dir = DIR.UP;
	    else if (this.keys.down.isDown	|| this.wasd.down.isDown)  dir = DIR.DOWN;
	    else return;

		const pre = Object.assign({}, this.members[0]);
		this.members[0].direction = dir;

		let pos = [this.members[0].row, this.members[0].col];
	    if (!updatePosition(pos, dir)) return;

	    // 壁などにぶつからないようにチェック
	    this.isMoving = canMove(this, pos, true);
	    if (!this.isMoving) return;

	    let moveIdx = (pre.row != this.members[1].row || pre.col != this.members[1].col)? 1 : 0;
	    this.members[0].move(this, pos[0], pos[1], CARA_OFFSET, () => {
		    if (moveIdx == 0) this.postMove(pos);
	    });

	    if (moveIdx == 1) {
			this.members[1].direction = pre.direction;
		    this.members[1].move(this, pre.row, pre.col, CARA_OFFSET, () => {
	            this.postMove(pos);
	        });
	    }
    }

	postMove(pos) {
	    if (pos[0] == 213 && (pos[1] == 172 || pos[1] == 173)) {
		    this.cameras.main.fadeOut(500, 0, 0, 0);
		    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
			    bgm.stop();
			    this.scene.start("TownScene");
		    });
	    } else if (Math.random() < 0.1) { // 低確率で戦闘開始
		    bgm.stop();
		    battleBGM.play();
		    this.time.delayedCall(500, () => {
			    this.scene.pause(); // フィールドを一時停止
			    console.log("aaa", this.members[0]);
			    this.scene.launch("BattleScene", { members: this.members }); // 戦闘シーンを起動
		    });
	    }
        this.isMoving = false;
	}

	onResume() {
	    this.isMoving = false;
	    bgm.play();
    }
}

function canMove(scene, position, isPlayer) {
	let row = position[0], col = position[1];
    let tile = scene.fieldLayer.getTileAt(col, row);
    let idx = tile ? tile.index : -1;
	if (idx < 0) return false;
	if (idx >= TILE_OBS) {
    	// if (isPlayer) changeLayer(scene, position);
		return false;
	}
    // if (row == player.row && col == player.col) return false;
    // if (npcList.some(npc => row == npc.row && col == npc.col)) return false;
	return true;
}

export default FieldScene;
