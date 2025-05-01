import OccupationData from "./OccupationData.js";
import EquipmentData from "./EquipmentData.js";

export default class Player {
    constructor(scene, data, pos, dir, offset = 0) {
        this.name = data.name;
        this.occupation = data.occupation;
        this.level = data.level;
        this.items = data.items;
        this.row = pos[0];
        this.col = pos[1];
        this.offset = offset;
    	this.sprite = scene.physics.add.sprite(this.col * TILE_SIZE * SCALE, (this.row * TILE_SIZE-offset) * SCALE, data.occupation, 0);
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
    }

    updateFrame() {
        this.stepCount ^= 1;
        this.sprite.setFrame(this.direction * 2 + this.stepCount);
    }

    move(scene, row, col, offset = 0, callback = null) {
	    if (this.row == row && this.col == col) {
            if (callback) callback();
	    } else {
		    scene.tweens.add({
		        targets: this.sprite,
		        x: col * TILE_SIZE * SCALE,
		        y: (row * TILE_SIZE - offset) * SCALE,
		        duration: MOVE_DELAY,
		        onComplete: () => {
		            this.row = row;
		            this.col = col;
		            if (callback) callback();
		        }
		    });
	    }
    }

    setPosition(pos) {
        this.row = pos[0];
        this.col = pos[1];
        this.sprite.setPosition(this.col * TILE_SIZE * SCALE, (this.row * TILE_SIZE - this.offset) * SCALE);
    }

    getDefenceValue() {
        let value = Math.floor(this.speed/2);
        for (let i = 0; i < this.items.length; i++) {
            let item = this.items[i];
            if (item[0] != 'E' || item[1] != ':') continue;
            item = item.substr(2, item.length-2);
            let type = EquipmentData.getTypeByName(item);
            if (type != EQUIP.ARMOR && type != EQUIP.SHIELD && type != EQUIP.HELMET)
                continue;
            let data = EquipmentData.getItemByName(item);
            if (data) value += data.ability;
        }
        return value;
    }
}
