import Player from "./player.js";
import TownScene from "./town.js";
import BattleScene from "./battle.js";
import { updatePosition, getInverseDir } from "./util.js";

const TILE_OBS = 22;

let bgm;

class FieldScene extends Phaser.Scene {
    constructor() {
        super({ key: "FieldScene" });
    }

    preload() {
	    this.load.tilemapTiledJSON("fieldMap", "data/field.json"); // マップデータ
	    this.load.image("fieldTiles", "image/field.png"); // タイルセット画像
	    this.load.json("fieldData", "data/field.json");
	    this.load.audio("fieldBGM", "sound/field1.mp3");
    }

    create(data) {
	    const fieldData = this.cache.json.get("fieldData");
	    if (!fieldData) {
	    	console.error("Error: field data not found in JSON.");
		    return;
	    }

	    const MAP_WIDTH = fieldData.width * TILE_SIZE;
	    const MAP_HEIGHT = fieldData.height * TILE_SIZE;

	    const playerData = fieldData.player;
	    this.load.spritesheet(playerData.name, playerData.image, { frameWidth: 32, frameHeight: 32 });

        // キーボード入力
	    this.cursors = this.input.keyboard.createCursorKeys();

        // BGM
	    bgm = this.sound.add("fieldBGM", { loop: true, volume: 0.3 });
	    bgm.play();

        this.events.on("resume", this.onResume, this);

        // 追加のロードを開始
	    this.load.once("complete", () => {
		    // マップを読み込む
		    const map = this.make.tilemap({ key: "fieldMap" });
		    const tileset = map.addTilesetImage("fieldTiles");

		    this.fieldLayer = map.createLayer("Field", tileset, 0, 0);
		    this.fieldLayer.setScale(1);
		    this.fieldLayer.setVisible(true);

		    // プレイヤーをフィールドの開始位置に追加
	        this.player = new Player(this, data.row, data.col, "player1", 0);
	        this.add.existing(this.player);

	        // カメラ設定
	        this.cameras.main.startFollow(this.player.sprite);
	        this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
	        this.cameras.main.setZoom(2);
        }, this);
		this.load.start();

        this.time.addEvent({
	        delay: 250,
	        loop: true,
	        callback: () => {
	            this.player.updateFrame();
	        }
	    });
    }

    update() {
	    let dir = 0;
		if		(this.cursors.left.isDown)	dir = DIR.LEFT;
	    else if (this.cursors.right.isDown) dir = DIR.RIGHT;
	    else if (this.cursors.up.isDown)	dir = DIR.UP;
	    else if (this.cursors.down.isDown)	dir = DIR.DOWN;
	    else return;

	    if (this.player.isMoving) return;
		this.player.direction = dir;

		let pos = [this.player.row, this.player.col];
	    if (!updatePosition(pos, dir)) return;

	    // 壁などにぶつからないようにチェック
	    this.player.isMoving = canMove(this.player.scene, pos, true);
	    if (!this.player.isMoving) return;

	    this.player.scene.tweens.add({
	        targets: this.player.sprite,
	        x: pos[1] * TILE_SIZE,
	        y: pos[0] * TILE_SIZE,
	        duration: MOVE_DELAY,
	        onComplete: () => {
	            this.player.isMoving = false;
	            this.player.row = pos[0];
	            this.player.col = pos[1];
	            this.postMove(pos);
	        }
	    });
    }

	postMove(pos) {
	    if (pos[0] == 213 && (pos[1] == 172 || pos[1] == 173)) {
		    this.player.isMoving = true;
		    this.cameras.main.fadeOut(500, 0, 0, 0);
		    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
			    bgm.stop();
			    this.scene.start("TownScene");
		    });
	    } else if (Math.random() < 0.1) { // 低確率で戦闘開始
		    this.player.isMoving = true;
		    bgm.stop();
		    this.scene.pause(); // フィールドを一時停止
		    this.scene.launch("BattleScene", { player: this.player }); // 戦闘シーンを起動
	    }
	}

	onResume() {
	    this.player.isMoving = false;
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
