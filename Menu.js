import EquipmentData from "./EquipmentData.js";
import { getNumberStr } from "./util.js";

export const MenuType = {
    Command:    1,  // コマンドメニュー
    Member:     2,  // メンバー
    Item:       3,  // 持ち物一覧
    Shop:       4,  // お店の売り物一覧
    Gold:       5,  // ゴールド
    YesNo:      6,  // はい、いいえ
    BuySell:    7,  // 買う、売る
    Power:      8,  // 攻撃力、守備力
    SelectEquip: 9, // そうび選択
    Equipment:  10, // そうび一覧
    Ability:    11, // つよさ
    Spell:      12, // じゅもん
    Luida:      13, // ルイーダの酒場
    Vault:      14, // あずかり所
    Other:      15, // その他
};

export const MenuFlags = {
    Remain:     0x01,   // 選択後も残す
    ShowCursor: 0x02,   // カーソル表示する
    MultiCols:  0x04,   // 複数カラム
    ShopItem:   0x08,   // どうぐ、武器防具のメニュー表示
    BaseDepth:  0x10,   // 最も最背面に表示するメニュー
    FixCursor:  0x20,   // カーソル位置を固定

    Default:    0x03    // デフォルト
};

export default class Menu {
    static menuCnt = 0;

    constructor(type, scene, strList, x, y, w, h, flags=MenuFlags.Default) {
        this.type = type;
        this.scene = scene;
        x *= SCALE;
        y *= SCALE;
        w *= SCALE;
        h *= SCALE;
        this.width = w;
        this.height = h;
        this.flags = flags;
        this.strList = [];
        Menu.menuCnt++;
        let depth = 1100; // (flags & MenuFlags.BaseDepth)? 1100 : 1100+Menu.menuCnt;
        this.drawList = scene.add.container(x, y);
        this.drawList.setScrollFactor(0);
        this.drawList.setDepth(depth);
        this.textList = scene.add.container(x, y);
        this.textList.setScrollFactor(0);
        this.textList.setDepth(depth);
        this.cursor = null;
        if (w > 0 && h > 0) this.drawRect(0, 0, w, h);
        this.setStrList(strList);
        this.idx = -1;
        if (flags & MenuFlags.ShowCursor) {
            this.createCursor();
            this.setCursor(0);
        }

        this.timer = scene.time.addEvent({
            delay: 270,
            loop: true,
            callback: () => {
                if ((this.flags & MenuFlags.FixCursor) == 0 && this.idx >= 0 && this.cursor)
                    this.cursor.setVisible(!this.cursor.visible);
            }
        });
    }

    destroy() {
        this.drawList.destroy();
        this.textList.destroy();
        this.timer.remove();
    }

    onButtonB() {
        this.idx = -1;
        if (this.strList.length == 2 && this.strList[0] == "はい") {
            this.idx = 1;
            if (this.flags & MenuFlags.Remain) {
                this.fixCursor(true);
            } else {
                this.setVisible(false);
            }
            return true;
        }
        return false;
    }

    getCurString() {
        if (this.idx < 0 || this.idx >= this.strList.length) return "";
        if (this.flags & MenuFlags.ShopItem) {
            return this.strList[this.idx].name;
        } else {
            return this.strList[this.idx];
        }
    }

    setVisible(onoff) {
        this.drawList.setVisible(onoff);
        this.textList.setVisible(onoff);
    }

    setStrList(strList, equip=false, left=66) {
        this.textList.removeAll(true);
        this.strList = [];
        if (!strList) return;
        this.strList = strList;
        let rowNum = (this.flags & MenuFlags.MultiCols)? Math.floor((strList.length+1)/2) : strList.length;
        for (let i = 0; i < strList.length; i++) {
            let row = (i < rowNum)? i : i-rowNum;
            let col = (i < rowNum)? 0 : 1;
            let x = left + col*164;
            let y = 54 + row*64;
            let str = strList[i];
            if (equip && (str[0] != 'E' || str[1] != ':')) continue;
            this.drawText(x, y, str);
        }
    }

    setShopList(itemList) {
        this.flags |= MenuFlags.ShopItem;
        this.strList = itemList;
        for (let i = 0; i < itemList.length; i++) {
            let item = itemList[i];
            let x = 70, y = 54+i*64;
            this.drawText(x, y, item.name);
            this.drawText(x+260, y, getNumberStr(item.price, 5));
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
        if (this.flags & MenuFlags.FixCursor) return false;
        if (this.idx < 0) return false;

        let idx = this.idx, len = this.strList.length;
        let rows = (this.flags & MenuFlags.MultiCols)? Math.floor((len+1)/2) : len;
        if (dir == DIR.UP) {
            idx = (idx == 0 || idx == rows)? idx+rows-1 : idx-1;
        } else if (dir == DIR.DOWN) {
            idx = (idx == rows-1 || idx == len-1)? Math.floor(idx/rows)*rows : idx+1;
        } else if (dir == DIR.LEFT || dir == DIR.RIGHT) {
            if ((this.flags & MenuFlags.MultiCols) == 0) return false;
            idx += (idx < rows)? rows : -rows;
        } else {
            return false;
        }

        this.setCursor(idx);
        return true;
    }

    setCursor(idx) {
        if (idx < 0 || !this.strList) {
            this.idx = -1;
            this.cursor.setVisible(false);
            return;
        }
        let len = this.strList.length;
        let rows = (this.flags & MenuFlags.MultiCols)? Math.floor((len+1)/2) : len;
        let row = (idx < rows)? idx : idx-rows;
        let col = (idx < rows || rows < 1)? 0 : 1;
        this.cursor.x = 42+col*167;
        this.cursor.y = 62+row*64;
        this.idx = idx;
    }

    fixCursor(onoff) {
        if (onoff) {
            this.flags |= MenuFlags.FixCursor;
            if (this.flags & MenuFlags.Remain) {
                if (this.idx >= 0) this.cursor.setVisible(true);
            } else {
                this.setVisible(false);
            }
        } else {
            this.flags &= ~MenuFlags.FixCursor;
        }
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

    drawText(x, y, msg, size='38px', col='#ffffff') {
        if (msg.length > 2 && msg[0] == 'E' && msg[1] == ':') {
            msg = msg.substr(2, msg.length-2);
	        let text = this.scene.add.text(x-48, y+6, 'E', {
	            fontFamily: "PixelMplus10-Regular",
	            fontSize: '32px',
	            color: col
            });
	        text.setDepth(8);
            this.textList.add(text);
        }

        for (const ch of msg) {
	        let text = this.scene.add.text(x, y, ch, {
	            fontFamily: "PixelMplus10-Regular",
	            fontSize: size,
	            color: col
            });
	        text.setDepth(8);
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
        menu.setEquipParam(member, equip, item);
    }

    setEquipParam(member, type, eqItem) {
        let strList = [];
        let str = "こうげき：";
        let curAtk = member.getOffenceValue();
        str += getNumberStr(curAtk, 3);
        if (type == EQUIP.WEAPON) {
	        let data = EquipmentData.getItemByName(eqItem.name);
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
