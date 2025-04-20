
class Menu {
    constructor(parent, scene, strList, x, y, w, h, row=0, idx=0) {
        this.parent = parent;
        this.nest = (parent)? parent.nest+1 : 0;
        this.scene = scene;
        x *= SCALE;
        y *= SCALE;
        this.width = w;
        this.height = h;
        this.idx = idx;
        this.rowNum = row;
        this.colNum = (row > 0 && row < strList.length)? 2 : 1;
        this.drawList = scene.add.container(x, y);
        this.drawList.setScrollFactor(0);
        this.textList = scene.add.container(x, y);
        this.textList.setScrollFactor(0);
        this.drawRect(0, 0, w, h);
        this.setStrList(strList);
        this.createCursor();
        if (idx >= 0) this.setCursor(idx);

        this.timer = scene.time.addEvent({
            delay: 270,
            loop: true,
            callback: () => {
                if (!this.fix && this.idx >= 0)
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

    setStrList(strList, equip=false) {
        this.textList.removeAll(true);
        this.strList = strList;
        if (!strList) return;
        for (let i = 0; i < strList.length; i++) {
            let row = (this.rowNum > 0)? i%this.rowNum : i;
            let col = (this.rowNum > 0)? Math.floor(i/this.rowNum) : 0;
            let x = 66 + col*164;
            let y = 54 + row*64;
            let str = strList[i];
            if (equip && (str[0] != 'E' || str[1] != ':')) continue;
            this.drawText(x, y, str);
        }
    }

    setTitle(title, top=false) {
        let tw = 2 + 33*title.length;
        let ofsx = Math.floor((this.width-tw)/2);
        let ofsy = (top)? 0 : -13;
        this.drawFill(ofsx, ofsy, tw, 40);
        ofsy += (top)? -2 : 4;
        this.drawText(ofsx+4, ofsy, title);
    }

    moveCursor(dir) {
        if (this.fix) return false;
        if (this.idx < 0) return false;

        let idx = this.idx, len = this.strList.length;
        let rows = (this.rowNum > 0)? this.rowNum : len;
        if (dir == DIR.UP) {
            idx = (idx == 0 || idx == rows)? idx+rows-1 : idx-1;
        } else if (dir == DIR.DOWN) {
            idx = (idx == rows-1 || idx == len-1)? Math.floor(idx/rows)*rows : idx+1;
        } else if (dir == DIR.LEFT || dir == DIR.RIGHT) {
            if (this.colNum > 1) idx += (idx < rows)? rows : -rows;
        } else {
            return false;
        }

        this.setCursor(idx);
        return true;
    }

    setCursor(idx) {
        if (idx < 0) {
            this.idx = -1;
            this.fix = false;
            this.cursor.setVisible(false);
            return;
        }
        let row = (this.rowNum > 0)? idx%this.rowNum : idx;
        let col = (this.rowNum > 0)? Math.floor(idx/this.rowNum) : 0;
        this.cursor.x = 42+col*167;
        this.cursor.y = 62+row*63;
        this.idx = idx;
    }

    fixCursor(onoff) {
        this.fix = onoff;
        if (onoff && this.idx >= 0) this.cursor.setVisible(true);
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
        this.cursor.setVisible(false);
        this.fix = false;
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
        if (msg.length > 2 && msg[0] == 'E' && msg[1] == ':') {
            msg = msg.substr(2, msg.length-2);
	        let text = this.scene.add.text(x-48, y+6, 'E', {
	            fontFamily: "PixelMplus10-Regular",
	            fontSize: '32px',
	            color: col
            });
            this.textList.add(text);
        }

        for (const ch of msg) {
	        let text = this.scene.add.text(x, y, ch, {
	            fontFamily: "PixelMplus10-Regular",
	            fontSize: '38px',
	            color: col
            });
            this.textList.add(text);
	        text.setScale(0.9, 1.0);
	        x += 30;
	    }
    }
}

export default Menu;
