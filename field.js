import Player from "./player.js";

class FieldScene extends Phaser.Scene {
    constructor() {
        super({ key: "FieldScene" });
	    console.log("FieldScene constructor");
    }

    preload() {
        preload.call(this);
	    console.log("FieldScene preload");
    }

    create(data) {
	    console.log("FieldScene create");
        create.call(this);

        // const fieldData = this.cache.json.get("fieldData");

        // ¬©ηΜΐWf[^πσ―ζι
        // const playerX = data.playerX || fieldData.player.row;
        // const playerY = data.playerY || fieldData.player.col;
        // const playerName = fieldData.player.name;
        // const playerDir = fieldData.player.dir;

        // this.player = new Player(this, playerX, playerY, playerName, playerDir);
    }
}

function preload() {
    this.load.tilemapTiledJSON("map", "data/field.json"); // γγγγγΌγΏ
    this.load.image("tiles", "data/field.png"); // γΏγ€γ«γ»γγη»ε
    this.load.json("fieldData", "data/field.json");
    this.load.audio("fieldBGM", "data/field.mp3");
}

function create() {
    const fieldData = this.cache.json.get("fieldData");
    if (!fieldData) {
    	console.error("Error: field data not found in JSON.");
	    return;
    }

    this.load.once("complete", () => {
	    // γγγγθͺ­γΏθΎΌγ
	    const map = this.make.tilemap({ key: "map" });
	    const tileset = map.addTilesetImage("tiles");

	    this.fieldLayer = map.createLayer("Field", tileset, 0, 0);
	    this.fieldLayer.setScale(1);
	    this.fieldLayer.setVisible(false);

    }, this);
    this.load.start();
}
