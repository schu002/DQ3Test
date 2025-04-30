import TownScene from "./town.js";
import MonsterData from "./MonsterData.js";
import OccupationData from "./OccupationData.js";
import EquipmentData from "./EquipmentData.js";

class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: "TitleScene" });
    }

    preload() {
        // 背景色を黒に
        this.cameras.main.setBackgroundColor("#000000");

        // 町
        this.load.image("townTiles", "image/town.png"); // タイルセット画像
        this.load.tilemapTiledJSON("townMap", "data/ariahan.json");
        this.load.json("gameData", "data/game.json");
        this.load.json("townData", "data/ariahan.json");
        this.load.audio("townBGM", "sound/town.mp3");
        this.load.audio("button", "sound/button.mp3");
        this.load.audio("talk", "sound/talk.mp3");
        // フィールド
        this.load.tilemapTiledJSON("fieldMap", "data/field.json");
	    this.load.image("fieldTiles", "image/field.png");
	    this.load.json("fieldData", "data/field.json");
	    this.load.audio("fieldBGM", "sound/field1.mp3");
	    // モンスター
        this.load.json("monstersData", "data/monsters.json");
        // 職業
        this.load.json("occData", "data/occupation.json");
        // 装備品
        // this.load.json("equipData", "data/equipment.json");

        WebFont.load({
	        custom: {
	            families: ['PixelMplus10-Regular'],
	            urls: ['fonts/PixelMplus10-Regular.css']
	        },
	        active: () => {
	            this.fontReady = true;
	        }
	    });
    }

    create() {
        const gameData = this.cache.json.get("gameData");
        const townData = this.cache.json.get("townData");
	    const fieldData = this.cache.json.get("fieldData");
	    if (!gameData || !townData || !townData.start || !townData.objects || !fieldData) {
	    	console.error("Error: data not found in JSON.");
		    return;
	    }

	    // 町人画像をロード
	    const npcData = townData.objects.NPC;
	    npcData.forEach(npc => {
	        this.load.spritesheet(npc.image, npc.image, { frameWidth: 32, frameHeight: 32 });
	    });

        OccupationData.loadData(this);
        EquipmentData.loadData(this, (ok) => {
            // if (ok) console.log("EquipmentData.load");
        });
        MonsterData.loadData(this);

        // preload() でロードした JSON を MonsterData に渡す
        this.load.once("complete", () => {
            this.cameras.main.fadeIn(1000, 0, 0, 0);
            // タイトルテキストを表示
            this.add.text(200, 300, "DQ3 TEST", {
                fontSize: "36px",
                color: "#ffffff",
                fontFamily: "Arial",
            }).setOrigin(0.5).setPosition(this.cameras.main.width/2, this.cameras.main.height/2);

            // 入力待ち
            this.input.keyboard.once("keydown", () => {
                this.scene.start("TownScene"); // 町のシーンへ移動
            });
        });
        this.load.start();
    }
}

export default TitleScene;
