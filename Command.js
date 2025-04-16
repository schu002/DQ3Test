
class Command {
    constructor(scene, members, x, y) {
        x *= SCALE;
        y *= SCALE;
        this.scene = scene;
        this.members = members;
        this.command = COMMAND.NONE;
        this.drawList = scene.add.container(x, y);
        this.drawList.setScrollFactor(0);
        let w = 384, h = 252;
        this.drawFill(0, 0, w, h);
        this.drawRect(10, 10, w-20, h-20, "コマンド");
        this.drawText(66, 54, "はなす");
        this.drawText(230, 54, "じゅもん");
        this.drawText(66, 117, "つよさ");
        this.drawText(230, 117, "どうぐ");
        this.drawText(66, 180, "そうび");
        this.drawText(230, 180, "しらべる");
        this.createCursor();

        this.keys = scene.input.keyboard.createCursorKeys();
        this.wasd = scene.input.keyboard.addKeys({
	        up: Phaser.Input.Keyboard.KeyCodes.W,
	        down: Phaser.Input.Keyboard.KeyCodes.S,
	        left: Phaser.Input.Keyboard.KeyCodes.A,
	        right: Phaser.Input.Keyboard.KeyCodes.D
	    });
        this.isListen = true;

        this.timer = scene.time.addEvent({
            delay: 10,
            loop: true,
            callback: () => {
                this.update();
            }
        });

        this.timer = scene.time.addEvent({
            delay: 270,
            loop: true,
            callback: () => {
                this.cursor.setVisible(!this.cursor.visible);
            }
        });
    }

    destroy() {
        this.drawList.destroy();
        this.timer.remove();
    }

    update() {
        if (!this.isListen) return;

        let idx = this.command;
        if (idx > 0) {
            if (this.keys.up.isDown || this.wasd.up.isDown) {
                idx = (idx == 1 || idx == 4)? idx+2 : idx-1;
            } else if (this.keys.down.isDown || this.wasd.down.isDown) {
                idx = (idx == 3 || idx == 6)? idx-2 : idx+1;
            } else if (this.keys.left.isDown || this.wasd.left.isDown ||
                       this.keys.right.isDown || this.wasd.right.isDown) {
                idx += (idx <= 3)? 3 : -3;
            } else {
                return;
            }
        } else {
            idx = COMMAND.TALK;
        }

        this.isListen = false;
        this.setCursor(idx);

        this.scene.time.delayedCall(200, () => {
	        this.isListen = true;
        });
    }

    createCursor() {
        const w = 14, h = 26;
        this.cursor = this.scene.add.graphics();
        this.drawList.add(this.cursor);
        this.cursor.fillStyle(0xffffff, 1); // 白色、不透明
        this.cursor.beginPath();
        this.cursor.moveTo(0, 0);
        this.cursor.lineTo(4, 0);
        this.cursor.lineTo(w+4, h/2);
        this.cursor.lineTo(4, h);
        this.cursor.lineTo(0, h);
        this.cursor.closePath();
        this.cursor.fillPath();
        this.setCursor(1);
    }

    setCursor(idx) {
        this.cursor.x = 42+Math.floor((idx-1)/3)*167;
        this.cursor.y = 62+(idx-1)%3*63;
        this.command = idx;
    }

    drawRect(x, y, w, h, title=null) {
        let rect = this.scene.add.graphics();
        this.drawList.add(rect);
        rect.lineStyle(14, 0xffffff);
        rect.fillStyle(0x000000);
        rect.strokeRoundedRect(x, y, w, h, 5);
        rect.fillRoundedRect(x, y, w, h, 5);
        if (title) {
            this.drawFill(x+112, y-9, 134, 12);
            this.drawText(x+118, y-14, title);
        }
        return rect;
    }

    drawFill(x, y, w, h, col=0x000000) {
        let rect = this.scene.add.graphics();
        this.drawList.add(rect);
        rect.fillStyle(col);
        rect.fillRect(x, y, w, h);
    }

    drawText(x, y, msg) {
        for (const ch of msg) {
	        let text = this.scene.add.text(x, y, ch, {
	            fontFamily: "PixelMplus10-Regular",
	            fontSize: '38px',
	            color: '#ffffff'
            });
	        this.drawList.add(text);
	        text.setScale(0.9, 1.0);
	        x += 30;
	    }
    }
}

export default Command;
