import EquipmentData from "./EquipmentData.js";
import { getNumberStr } from "./util.js";

export default class Menu {
    constructor(parent, scene, strList, x, y, w, h, row=0, idx=0) {
        let slen = (strList)? strList.length : 0;
        this.parent = parent;
        this.nest = (parent)? parent.nest+1 : 0;
        this.scene = scene;
        x *= SCALE;
        y *= SCALE;
        this.width = w;
        this.height = h;
        this.idx = idx;
        this.rowNum = row;
        this.colNum = (row > 0 && row < slen)? 2 : 1;
        this.drawList = scene.add.container(x, y);
        this.drawList.setScrollFactor(0);
        this.textList = scene.add.container(x, y);
        this.textList.setScrollFactor(0);
        this.cursor = null;
        if (w > 0 && h > 0) this.drawRect(0, 0, w, h);
        this.setStrList(strList);
        this.createCursor();
        if (idx >= 0) this.setCursor(idx);

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

    setStrList(strList, equip=false, left=66) {
        this.textList.removeAll(true);
        this.strList = strList;
        if (!strList) return;
        for (let i = 0; i < strList.length; i++) {
            let row = (this.rowNum > 0)? i%this.rowNum : i;
            let col = (this.rowNum > 0)? Math.floor(i/this.rowNum) : 0;
            let x = left + col*164;
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
        this.cursor.y = 62+row*64;
        this.idx = idx;
    }

    fixCursor(onoff) {
        this.fix = onoff;
        if (onoff && this.idx >= 0) this.cursor.setVisible(true);
    }

    createRightArrow(x=0, y=0) {
        const w = 14, h = 26;
        let tri = this.scene.add.graphics();
        this.drawList.add(tri);
        tri.fillStyle(0xffffff, 1);
        tri.beginPath();
        tri.moveTo(x, y);
        tri.lineTo(x+4, y);
        tri.lineTo(x+w+4, y+h/2);
        tri.lineTo(x+4, y+h);
        tri.lineTo(x, y+h);
        tri.closePath();
        tri.fillPath();
        tri.setDepth(10);
        return tri;
    }

    createCursor() {
        this.cursor = this.createRightArrow();
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
        rect.setDepth(3);
        return rect;
    }

    drawFill(x, y, w, h, col=0x000000) {
        let rect = this.scene.add.graphics();
        this.drawList.add(rect);
        rect.fillStyle(col);
        rect.fillRect(x, y, w, h);
        rect.setDepth(5);
    }

    drawText(x, y, msg, size='38px', col='#ffffff') {
        if (msg.length > 2 && msg[0] == 'E' && msg[1] == ':') {
            msg = msg.substr(2, msg.length-2);
	        let text = this.scene.add.text(x-48, y+6, 'E', {
	            fontFamily: "PixelMplus10-Regular",
	            fontSize: '32px',
	            color: col
            });
	        text.setDepth(6);
            this.textList.add(text);
        }

        for (const ch of msg) {
	        let text = this.scene.add.text(x, y, ch, {
	            fontFamily: "PixelMplus10-Regular",
	            fontSize: size,
	            color: col
            });
	        text.setDepth(6);
            this.textList.add(text);
	        text.setScale(0.9, 1.0);
	        x += 30;
	    }
    }

    setEquipment(member, menu, equip) {
        const titleList = ["ぶき", "よろい", "たて", "かぶと"];
        let strList = [];
        let equipVal = 0;
        let item = null;
        for (let i = 0; i < member.items.length; i++) {
            let str = member.items[i];
            let isEquip = (str.length > 2 && str[0] == 'E' && str[1] == ':')? true : false;
            let itemName = (isEquip)? str.substr(2, str.length-2) : str;
            let type = EquipmentData.getTypeByName(itemName);
            if (type != equip) continue;
            strList.push(str);
            if (isEquip) item = EquipmentData.getItemByName(itemName);
        }
        strList.push("そうびしない");
        this.height = 61 + strList.length*64;
        this.drawRect(0, 0, this.width, this.height);
        this.setStrList(strList);
        this.setTitle(titleList[equip-1], true);
        this.cursor.setVisible(true);
        this.drawList.bringToTop(this.cursor);
        menu.setEquipParam(member, equip, strList[0], item);
    }

    setEquipParam(member, type, itemName, eqItem) {
        if (itemName.length > 2 && itemName[0] == 'E' && itemName[1] == ':')
            itemName = itemName.substr(2, itemName.length-2);
        let strList = [];
        let str = "こうげき：";
        let curAtk = member.power + eqItem.ability;
        str += getNumberStr(curAtk, 3);
        if (type == EQUIP.WEAPON) {
	        let data = EquipmentData.getItemByName(itemName);
	        let newAtk = member.power + data.ability;
	        str += " " + getNumberStr(newAtk, 3);
	    }
        strList.push(str);
        str = "　しゅび：";
        let curDef = member.getDefenceValue();
        str += getNumberStr(curDef, 3);
        strList.push(str);
        this.setStrList(strList, false, 35);
        this.createRightArrow(285, 60);
        this.setTitle(member.name, true);
    }
}
