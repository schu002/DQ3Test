import OccupationData from "./OccupationData.js";
import EquipmentData from "./EquipmentData.js";

export default class Player {
    static hero = null;

    constructor(scene, data, order, pos, dir, offset = 0) {
        this.name = data.name;
        this.occupation = data.occupation;
        this.level = data.level;
        this.items = data.items;
        this.pos = [...pos];
        this.offset = offset;
    	this.sprite = scene.physics.add.sprite(pos[1] * TILE_SIZE * SCALE, (pos[0] * TILE_SIZE-offset) * SCALE, data.occupation, 0);
        this.sprite.setDepth(5-order);
        this.sprite.setScale(SCALE);
        this.sprite.setOrigin(0, 0);
        this.direction = dir;
        this.action = ACTION.NONE;
        this.stepCount = 0;

        let prms = OccupationData.getParams(data.occupation, data.level);
        if (prms) {
            this.hp = this.MaxHP = prms.HP;
            this.mp = this.MaxMP = prms.MP;
            this.exp = prms.exp;
            this.power = prms.power;
            this.speed = prms.speed;
            this.stamina = prms.stamina;
            this.wise = prms.wise;
            this.luck = prms.luck;
        }

        if (this.occupation == "hero") Player.hero = this;
    }

    updateFrame() {
        this.stepCount ^= 1;
        this.sprite.setFrame(this.direction * 2 + this.stepCount);
    }

    move(scene, pos, offset = 0, callback = null) {
	    if (this.pos[0] == pos[0] && this.pos[1] == pos[1]) {
            if (callback) callback();
	    } else {
		    scene.tweens.add({
		        targets: this.sprite,
		        x: pos[1] * TILE_SIZE * SCALE,
		        y: (pos[0] * TILE_SIZE - offset) * SCALE,
		        duration: MOVE_DELAY,
		        onComplete: () => {
		            this.pos = [...pos];
		            if (callback) callback();
		        }
		    });
	    }
    }

    setPosition(pos) {
        this.pos = [...pos];
        this.sprite.setPosition(pos[1] * TILE_SIZE * SCALE, (pos[0] * TILE_SIZE - this.offset) * SCALE);
    }

    // itemNameを装備する
    setEquipItem(type, itemName) {
        if (itemName.substring(0, 2) == "E:") itemName = itemName.slice(2);
        for (let i = 0; i < this.items.length; i++) {
            let item = this.items[i];
            if (item.substring(0, 2) == "E:") item = item.slice(2);
            if (EquipmentData.getTypeByName(item) != type) continue;
            if (item == itemName) {
                this.items[i] = "E:" + itemName;
            } else {
                this.items[i] = item;
            }
        }
    }
    
    // 装備一覧メニュー用の装備リストを取得する
    getEquipItems() {
        let itemList = ["", "", "", ""];
        for (let i = 0; i < this.items.length; i++) {
            let item = this.items[i];
            if (item.substring(0, 2) != "E:") continue;
            let type = EquipmentData.getTypeByName(item);
            if (type > 0 && type < 5) itemList[type-1] = item;
        }
        return itemList;
    }

    // 攻撃力を取得する
    getOffenceValue() {
        let value = this.power;
        for (let i = 0; i < this.items.length; i++) {
            let item = this.items[i];
            if (item.substring(0, 2) != "E:") continue;
            item = item.slice(2);
            if (EquipmentData.getTypeByName(item) != EQUIP.WEAPON) continue;
            let data = EquipmentData.getItemByName(item);
            value += data.ability;
            break;
        }
        return value;
    }

    // 守備力を取得する
    getDefenceValue(ignoreType=EQUIP.NONE, itemName="") {
        let value = Math.floor(this.speed/2);
        for (let i = 0; i < this.items.length; i++) {
            let item = this.items[i];
            if (item.substring(0, 2) != "E:") continue;
            item = item.slice(2);
            let type = EquipmentData.getTypeByName(item);
            if (type != EQUIP.ARMOR && type != EQUIP.SHIELD && type != EQUIP.HELMET)
                continue;
            if (type == ignoreType) {
                if (!itemName) continue;
                item = itemName;
            }
            let data = EquipmentData.getItemByName(item);
            if (data) value += data.ability;
        }
        return value;
    }

    static getHero() {
        return Player.hero;
    }
}
