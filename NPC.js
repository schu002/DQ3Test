export default class NPC {
    constructor(scene, npcData) {
        this.scene = scene;
        this.row = npcData.row;
        this.col = npcData.col;
        this.name = npcData.name;
        this.image = npcData.image;
        this.sprite = null;
        this.direction = (npcData.dir < 0)? Phaser.Math.Between(0, 3) : npcData.dir; // 移動可能な方向
        this.talks = npcData.talks;
        this.movable = npcData.move;
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

    setVisible(onoff) {
        if (onoff) {
            if (!this.sprite) {
                this.sprite = this.scene.physics.add.sprite(this.col*TILE_SIZE*SCALE, (this.row*TILE_SIZE-CARA_OFFSET)*SCALE, this.image, 0);
                this.sprite.setScale(SCALE);
                this.sprite.setOrigin(0, 0);
            }
        } else {
            if (this.sprite) {
                this.sprite.destroy();
                this.sprite = null;
            }
        }
    }

    updateFrame() {
        this.stepCount ^= 1;
        if (this.sprite) this.sprite.setFrame(this.direction * 2 + this.stepCount);
    }
}
