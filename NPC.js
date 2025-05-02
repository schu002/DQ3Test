import { getInverseDir } from "./util.js";

export default class NPC {
    constructor(scene, npcData) {
        this.scene = scene;
        this.pos = [...npcData.position];
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
                this.pos = [...pos];
            }
        });
    }

    setTalking(onoff, dir=-1) {
        if (this.isTalking == onoff) return;
        if (onoff) {
            if (dir >= 0) this.direction = getInverseDir(dir); // プレイヤーと反対向き
            this.sprite.setFrame(this.direction * 2); // 町人の向きを即座に反映
            this.isTalking = true;
        } else {
            this.isTalking = false;
        }
    }

    setVisible(onoff) {
        if (onoff) {
            if (!this.sprite) {
                this.sprite = this.scene.physics.add.sprite(this.pos[1]*TILE_SIZE*SCALE, (this.pos[0]*TILE_SIZE-CARA_OFFSET)*SCALE, this.image, 0);
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
