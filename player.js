class Player {
    constructor(scene, row, col, name, dir, offset = 0) {
        this.scene = scene;
        this.row = row;
        this.col = col;
    	this.sprite = scene.physics.add.sprite(col * TILE_SIZE, row * TILE_SIZE-offset, "soldier", 0);
        this.sprite.setOrigin(0, 0);
        this.direction = dir;
        this.isMoving = false;
        this.stepCount = 0;
    }

    updateFrame() {
        this.stepCount ^= 1;
        this.sprite.setFrame(this.direction * 2 + this.stepCount);
    }
}

export default Player;
