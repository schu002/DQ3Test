import Player from "./player.js";

let bgm;

class FieldScene extends Phaser.Scene {
    constructor() {
        super({ key: "FieldScene" });
    }

    preload() {
	    this.load.tilemapTiledJSON("fieldMap", "data/field.json"); // マップデータ
	    this.load.image("fieldTiles", "data/field.png"); // タイルセット画像
	    this.load.json("fieldData", "data/field.json");
	    this.load.audio("fieldBGM", "data/field.mp3");
    }

    create(data) {
	    const fieldData = this.cache.json.get("fieldData");
	    if (!fieldData) {
	    	console.error("Error: field data not found in JSON.");
		    return;
	    }

	    // マップを読み込む
	    const map = this.make.tilemap({ key: "fieldMap" });
	    console.log("Available layers:", map.layers.map(layer => layer.name));
	    const tileset = map.addTilesetImage("fieldTiles");

	    this.fieldLayer = map.createLayer("Field", tileset, 0, 0);
	    this.fieldLayer.setScale(1);
	    this.fieldLayer.setVisible(true);

        // BGM
	    bgm = this.sound.add("fieldBGM", { loop: true, volume: 0.3 });
	    bgm.play();
        // const fieldData = this.cache.json.get("fieldData");

        // ������̍��W�f�[�^���󂯎��
        // const playerX = data.playerX || fieldData.player.row;
        // const playerY = data.playerY || fieldData.player.col;
        // const playerName = fieldData.player.name;
        // const playerDir = fieldData.player.dir;

        // this.player = new Player(this, playerX, playerY, playerName, playerDir);
    }
}

export default FieldScene;
