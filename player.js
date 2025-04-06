class Player {
    constructor(scene, name, occupation, row, col, dir, offset = 0) {
        this.scene = scene;
        this.name = name;
        this.occupation = occupation;
        this.row = row;
        this.col = col;
    	this.sprite = scene.physics.add.sprite(col * TILE_SIZE, row * TILE_SIZE-offset, occupation, 0);
        this.sprite.setOrigin(0, 0);
        this.direction = dir;
        this.stepCount = 0;
    }

    updateFrame() {
        this.stepCount ^= 1;
        this.sprite.setFrame(this.direction * 2 + this.stepCount);
    }

    move(row, col, offset = 0, callback = null) {
	    if (this.row == row && this.col == col) {
            if (callback) callback();
	    } else {
		    this.scene.tweens.add({
		        targets: this.sprite,
		        x: col * TILE_SIZE,
		        y: row * TILE_SIZE - offset,
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
