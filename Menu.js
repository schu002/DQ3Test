
class Menu {
    constructor(scene, strList, x, y, w, h, idx=0, col=1) {
        this.scene = scene;
        this.strList = strList;
        x *= SCALE;
        y *= SCALE;
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.idx = idx;
        this.rowNum = (col <= 1)? strList.length : Math.floor((strList.length+1)/2);
        this.colNum = (col <= 1)? 1 : 2;
        this.drawList = scene.add.container(x, y);
        this.drawList.setScrollFactor(0);
        this.drawRect(0, 0, w, h);
        for (let i = 0; i < strList.length; i++) {
            this.drawText(66, 54+i*63, strList[i]);
        }
        this.createCursor();
        if (idx >= 0) this.setCursor(idx);

        scene.input.keyboard.on("keydown-Z", this.onButtonA, this);
        scene.input.keyboard.on("keydown-X", this.onButtonB, this);
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

    onButtonA() {
    }

    onButtonB() {
    }

    update() {
        if (!this.isListen) return;
        if (this.idx < 0) return;

        let idx = this.idx, rows = this.rowNum, len = this.strList.length;
        if (this.keys.up.isDown || this.wasd.up.isDown) {
            idx = (idx == 0 || idx == rows)? idx+rows-1 : idx-1;
        } else if (this.keys.down.isDown || this.wasd.down.isDown) {
            idx = (idx == rows-1 || idx == len-1)? Math.floor(idx/rows)*rows : idx+1;
        } else if (this.keys.left.isDown || this.wasd.left.isDown ||
                   this.keys.right.isDown || this.wasd.right.isDown) {
            if (this.colNum > 1) idx += (idx < rows)? rows : -rows;
        } else {
            return;
        }

        this.isListen = false;
        this.setCursor(idx);

        this.scene.time.delayedCall(200, () => {
	        this.isListen = true;
        });
    }

    setTitle(title) {
        let tw = 2 + 33*title.length;
        let ofsx = Math.floor((this.width-tw)/2);
        this.drawFill(ofsx, -13, tw, 40);
        this.drawText(ofsx+4, -14, title);
    }

    setCursor(idx) {
        if (idx < 0) return;
        this.cursor.x = 42+Math.floor(idx/this.rowNum)*167;
        this.cursor.y = 62+idx%this.rowNum*63;
        this.idx = idx;
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

    drawRect(x, y, w, h, title=null) {
        this.drawFill(x, y, w, h);
        let rect = this.scene.add.graphics();
        this.drawList.add(rect);
        rect.lineStyle(14, 0xffffff);
        rect.fillStyle(0x000000);
        rect.strokeRoundedRect(x+10, y+10, w-20, h-20, 5);
        rect.fillRoundedRect(x+10, y+10, w-20, h-20, 5);
        return rect;
    }

    drawFill(x, y, w, h, col=0x000000) {
        let rect = this.scene.add.graphics();
        this.drawList.add(rect);
        rect.fillStyle(col);
        rect.fillRect(x, y, w, h);
    }

    drawText(x, y, msg, col='#ffffff') {
        for (const ch of msg) {
	        let text = this.scene.add.text(x, y, ch, {
	            fontFamily: "PixelMplus10-Regular",
	            fontSize: '38px',
	            color: col
            });
	        this.drawList.add(text);
	        text.setScale(0.9, 1.0);
	        x += 30;
	    }
    }
}

export default Menu;
