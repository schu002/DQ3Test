import { getNumberStr } from "./util.js";

export default class Message {
    constructor(parent, scene, strList, x, y, w, h) {
        let slen = (strList)? strList.length : 0;
        this.parent = parent;
        this.nest = (parent)? parent.nest+1 : 0;
        this.scene = scene;
        x *= SCALE;
        y *= SCALE;
        this.width = w;
        this.height = h;
        this.idx = 0;
        this.drawList = scene.add.container(x, y);
        this.drawList.setScrollFactor(0);
        this.textList = scene.add.container(x, y);
        this.textList.setScrollFactor(0);
        this.cursor = null;
        if (w > 0 && h > 0) this.drawRect(0, 0, w, h);

        this.talkBGM = scene.sound.add("talk", { loop: false, volume: 0.2 });
        if (strList) this.talkList = [...strList];
        let canTalk = (strList)? true : false;
        this.updateTalk(canTalk);

        this.timer = scene.time.addEvent({
            delay: 270,
            loop: true,
            callback: () => {
                if (!this.fix && this.idx >= 0 && this.cursor)
                    this.cursor.setVisible(!this.cursor.visible);
            }
        });
    }

    destroy() {
        this.drawList.destroy();
        this.textList.destroy();
        this.timer.remove();
    }

    setVisible(onoff) {
        this.drawList.setVisible(onoff);
        this.textList.setVisible(onoff);
    }

    updateTalk(canTalk=true) {
        if (canTalk) {
	        if (this.talkList.length == 0) return false;
        } else {
            this.talkList = ["そのほうこうには　だれも　いない。"];
	    }

        // 会話テキスト
        let chList = [], isCursor = false;
        while (this.talkList.length > 0) {
            let str = this.talkList.shift();
            if (canTalk) {
	            if (str == "▼") {
                    isCursor = true;
	                break;
	            }
                if (this.parent.idx == COMMAND.TALK) {
                    str = ((chList.length == 0)? "＊「" : "　　") + str;
                }
		    }
            for (const ch of str) {
                chList.push(ch);
            }
            chList.push('\n');
        }

        if (this.cursor) {
	        this.cursor.destroy();
	        this.cursor = null;
	    }
        let idx = 0, x = 25;
        this.scene.time.addEvent({
            delay: 10,
            repeat: chList.length-1,
            callback: () => {
		        if (canTalk && (idx % 6) == 0) this.talkBGM.play();
                let y = 65 + this.idx*64;
                let ch = chList[idx++];
                if (ch == '\n') {
                    this.idx++;
                    x = 25;
                    // 最後に行に来たら、１行ずつ上にずらす
                    if (this.idx == 4) {
                        const removeList = [];
                        this.textList.iterate((child) => {
                            if (child instanceof Phaser.GameObjects.Text) {
                                if (child.y < 80) removeList.push(child);
                            }
                        });
                        removeList.forEach(child => child.destroy());
                        this.textList.iterate((child) => {
                            if (child instanceof Phaser.GameObjects.Text) {
                                child.y -= 64;
                            }
                        });
                        this.idx--;
                        y -= 64;
                    }
                } else {
	                let text = this.scene.add.text(x, y, ch, {
	                    fontFamily: "PixelMplus10-Regular",
	                    fontSize: '38px',
	                    color: '#ffffff'
	                });
		            text.setScrollFactor(0);
		            text.setScale(0.95, 1.0);
		            text.setDepth(8);
                    this.textList.add(text);
		            x += 34;
	            }
                if (isCursor && idx == chList.length) {
                    this.createDownArrow(450, y+620);
                }
            }
        });
        return isCursor;
    }

    createDownArrow(x, y) {
        const w = 30, h = 18;
        if (this.cursor) this.cursor.destroy();
        this.cursor = this.scene.add.graphics();
        this.cursor.fillStyle(0xffffff, 1);
        this.cursor.beginPath();
        this.cursor.moveTo(x, y);
        this.cursor.lineTo(x+w, y);
        this.cursor.lineTo(x+w, y+4);
        this.cursor.lineTo(x+w/2, y+h);
        this.cursor.lineTo(x, y+4);
        this.cursor.closePath();
        this.cursor.fillPath();
        this.cursor.setDepth(10);
        this.cursor.setScrollFactor(0);
        this.cursor.setVisible(true);
	}

    drawRect(x, y, w, h, title=null) {
        this.drawFill(x, y, w, h);
        let rect = this.scene.add.graphics();
        this.drawList.add(rect);
        rect.lineStyle(14, 0xffffff);
        rect.fillStyle(0x000000);
        rect.strokeRoundedRect(x+10, y+10, w-20, h-20, 5);
        rect.fillRoundedRect(x+10, y+10, w-20, h-20, 5);
        rect.setDepth(5);
        return rect;
    }

    drawFill(x, y, w, h, col=0x000000) {
        let rect = this.scene.add.graphics();
        this.drawList.add(rect);
        rect.fillStyle(col);
        rect.fillRect(x, y, w, h);
        rect.setDepth(7);
    }
}