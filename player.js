import OccupationData from "./OccupationData.js";

class Player {
    constructor(scene, data, row, col, dir, offset = 0) {
        this.name = data.name;
        this.occupation = data.occupation;
        this.level = data.level;
        this.items = data.items;
        this.row = row;
        this.col = col;
    	this.sprite = scene.physics.add.sprite(col * TILE_SIZE * SCALE, (row * TILE_SIZE-offset) * SCALE, data.occupation, 0);
        this.sprite.setScale(2);
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
}

export default Player;
