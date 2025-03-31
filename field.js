import Player from "./player.js";

class FieldScene extends Phaser.Scene {
    constructor() {
        super({ key: "FieldScene" });
	    console.log("FieldScene constructor");
    }

    preload() {
	    console.log("FieldScene preload");

	    this.load.tilemapTiledJSON("map", "data/field.json"); // マップデータ
	    this.load.image("tiles", "data/field.png"); // タイルセット画像
	    this.load.json("fieldData", "data/field.json");
	    this.load.audio("bgm", "data/field.mp3");
    }

    create(data) {
	    console.log("FieldScene create");

	    const fieldData = this.cache.json.get("fieldData");
	    if (!fieldData) {
	    	console.error("Error: field data not found in JSON.");
		    return;
	    }

	    // マップを読み込む
	    const map = this.make.tilemap({ key: "map" });
	    const tileset = map.addTilesetImage("tiles");

	    this.fieldLayer = map.createLayer("Field", tileset, 0, 0);
	    this.fieldLayer.setScale(1);
	    this.fieldLayer.setVisible(false);

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
