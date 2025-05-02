import Player from "./player.js";
import TownScene from "./town.js";
import BattleScene from "./battle.js";
import OccupationData from "./OccupationData.js";
import Command from "./Command.js";
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

        const MAP_WIDTH = fieldData.width * TILE_SIZE * SCALE;
        const MAP_HEIGHT = fieldData.height * TILE_SIZE * SCALE;

        // マップを読み込む
        const map = this.make.tilemap({ key: "fieldMap" });
        const tileset = map.addTilesetImage("fieldTiles");

        this.fieldLayer = map.createLayer("Field", tileset, 0, 0);
        this.fieldLayer.setScale(SCALE);
        this.fieldLayer.setVisible(true);

        // プレイヤーをフィールドの開始位置に追加
        let order = 1;
        this.members = [];
        gameData.members.forEach(member => {
            this.members.push(new Player(this, member, order++, data.pos, 0, 0));
            this.add.existing(this.members[this.members.length-1]);
        });
        player = this.members[0];
        this.isMoving = false;

        // カメラ設定
        this.cameras.main.startFollow(player.sprite);
        this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);

        // キーボード入力
        this.keys = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
    	    up: Phaser.Input.Keyboard.KeyCodes.W,
    	    down: Phaser.Input.Keyboard.KeyCodes.S,
    	    left: Phaser.Input.Keyboard.KeyCodes.A,
    	    right: Phaser.Input.Keyboard.KeyCodes.D
    	});
    	this.input.keyboard.on("keydown-Z", this.onButtonA, this);
        this.input.keyboard.on("keydown-X", this.onButtonB, this);

        // BGM
        battleBGM = this.sound.add("battleBGM1", { loop: false, volume: 0.3 });
        bgm = this.sound.add("fieldBGM", { loop: true, volume: 0.3 });
        bgm.play();
        this.buttonSound = this.sound.add("button", { loop: false, volume: 0.2 });

        this.events.on("resume", this.onResume, this);

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
        if (this.command) return;

        let newDir = -1;
        if		(this.keys.left.isDown	|| this.wasd.left.isDown)  newDir = DIR.LEFT;
        else if (this.keys.right.isDown || this.wasd.right.isDown) newDir = DIR.RIGHT;
        else if (this.keys.up.isDown	|| this.wasd.up.isDown)	   newDir = DIR.UP;
        else if (this.keys.down.isDown	|| this.wasd.down.isDown)  newDir = DIR.DOWN;
        else return;

    	let dir = this.members[0].direction;
    	this.members[0].direction = newDir;

    	let pos = [this.members[0].row, this.members[0].col];
        if (!updatePosition(pos, newDir)) return;

        // 壁などにぶつからないようにチェック
        this.isMoving = canMove(this, pos, true);
        if (!this.isMoving) return;

        let row = pos[0], col = pos[1], lastIdx = 0;
        for (let idx = 0; idx < this.members.length; idx++) {
            let member = this.members[idx];
            let preRow = member.row, preCol = member.col;
            let preDir = (idx == 0)? dir : member.direction;
            if (idx > 0) {
                if (row == preRow && col == preCol) break;
                lastIdx = idx;
                member.direction = dir;
            }
            member.move(this, row, col, 0, () => {
    	        if (idx == lastIdx) this.postMove(pos);
            });
            row = preRow, col = preCol, dir = preDir;
        }
    }

    onButtonA() {
        if (this.command) {
            this.command.destroy();
            this.command = null;
        } else {
            this.command = new Command(this, this.members);
            this.buttonSound.play();
        }
    }

    onButtonB() {
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
    		    this.scene.launch("BattleScene", { members: this.members }); // 戦闘シーンを起動
    	    });
        } else {
            this.isMoving = false;
        }
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
