export default class NPC {
    constructor(scene, row, col, name, image, move, dir, talks) {
        this.scene = scene;
        this.row = row;
        this.col = col;
        this.name = name;
        this.image = image;
        this.sprite = scene.physics.add.sprite(col*TILE_SIZE*SCALE, (row*TILE_SIZE-CARA_OFFSET)*SCALE, image, 0);
        this.sprite.setScale(SCALE);
        this.sprite.setOrigin(0, 0);
        this.direction = (dir < 0)? Phaser.Math.Between(0, 3) : dir; // 移動可能な方向
        this.talks = talks;
        this.movable = move;
        this.isTalking = false;
        this.stepCount = 0;
    }

    // 移動処理
    move(pos) {
        this.scene.tweens.add({
            targets: this.sprite,
            x: pos[1] * TILE_SIZE * SCALE,
            y: (pos[0] * TILE_SIZE - CARA_OFFSET) * SCALE,
            duration: MOVE_DELAY,
            onComplete: () => {
                this.row = pos[0];
                this.col = pos[1];
            }
        });
    }

    updateFrame() {
        this.stepCount ^= 1;
        this.sprite.setFrame(this.direction * 2 + this.stepCount);
    }
}
