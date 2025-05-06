import Player from "./player.js";
import Menu from "./Menu.js";
import { getNumberStr } from "./util.js";

export default class Message {
    constructor(command, strList, x, y, w, h) {
        let slen = (strList)? strList.length : 0;
        this.command = command;
        this.parent = command.menu;
        this.scene = command.scene;
        x *= SCALE;
        y *= SCALE;
        this.width = w;
        this.height = h;
        this.idx = 0;
        this.drawList = this.scene.add.container(x, y);
        this.drawList.setScrollFactor(0);
        this.drawList.setDepth(1000);
        this.textList = this.scene.add.container(x, y);
        this.textList.setScrollFactor(0);
        this.textList.setDepth(1010);
        this.cursor = null;
        this.selectList = [];
        this.selectIdx = -1;
        if (w > 0 && h > 0) this.drawRect(0, 0, w, h);

        this.talkBGM = this.scene.sound.add("talk", { loop: false, volume: 0.2 });
        if (strList) this.talkList = [...strList];
        let canTalk = (strList)? true : false;
        this.updateTalk(canTalk);

        this.timer = this.scene.time.addEvent({
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

    setSelectIdx(idx) {
        this.selectIdx = idx;
        this.selectList = [];
    }

    isSelectNow() {
        return (this.selectList.length > 0)? true : false;
    }

    isFinish() {
        return (this.cursor || this.selectList.length > 0)? false : true;
    }

    updateTalk(canTalk=true) {
        if (canTalk) {
	        if (this.talkList.length == 0) return false;
        } else {
            this.talkList = ["そのほうこうには　だれも　いない。"];
	    }

        // 会話テキスト
        let chList = [], isCursor = false, isMatch = false, isSkip = false;
        while (this.talkList.length > 0) {
            let str = this.talkList.shift();
            if (canTalk) {
                str = str.replace("<hero>", Player.getHero().name);
	            if (str == "<btn>") {
                    isCursor = true;
	                break;
                } else if (str.substring(0, 8) == "<select>") {
                    if (this.showSelectMenu(str)) break;
                } else if (str.substring(0, 2) == "if") {
                    str = str.slice(2).trim();
                    isMatch = this.isMatchCondition(str);
                    if (!isMatch) isSkip = true;
                    continue;
                } else if (str.substring(0, 4) == "elif") {
                    str = str.slice(4).trim();
                    if (isMatch) isSkip = true;
                    else {
                        isMatch = this.isMatchCondition(str);
                        if (!isMatch) isSkip = true;
                    }
                    continue;
                } else if (str.substring(0, 4) == "else") {
                    if (isMatch) {
                        isSkip = true;
                    } else {
                        isMatch = true;
                        isSkip = false;
                    }
                    continue;
                } else {
                    if (isSkip) continue;
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
                    this.textList.add(text);
		            x += 34;
	            }
                if (isCursor && idx == chList.length) {
                    this.createDownArrow(450, y+620);
                }
            }
        });
        return (isCursor || this.selectList.length > 0)? true : false;
    }

    isMatchCondition(condstr) {
        let signList = ["==", "!=", "<=", ">=", "<", ">"];
        let tokenList = [];
        for (let i = 0; i < signList.length; i++) {
            let signstr = signList[i];
            let idx = condstr.indexOf(signstr);
            if (idx < 0) continue;
            tokenList.push(condstr.substring(0, idx).trim());
            tokenList.push(condstr.substring(idx, idx+signstr.length));
            tokenList.push(condstr.substring(idx+signstr.length).trim());
            break;
        }
        if (tokenList.length == 0) tokenList.push(condstr);

        for (let i = 0; i < tokenList.length; i++) {
            if (tokenList[i] == "<select>") tokenList[i] = String(this.selectIdx);
        }

        if (tokenList.length == 3) {
            let num1 = Number(tokenList[0]), num2 = Number(tokenList[2]);
            if (tokenList[1] == "==") {
                return (num1 == num2)? true : false;
            } else if (tokenList[1] == "!=") {
                return (num1 != num2)? true : false;
            } else if (tokenList[1] == "<=") {
                return (num1 <= num2)? true : false;
            } else if (tokenList[1] == ">=") {
                return (num1 >= num2)? true : false;
            } else if (tokenList[1] == "<") {
                return (num1 < num2)? true : false;
            } else if (tokenList[1] == ">") {
                return (num1 > num2)? true : false;
            } else {
                return false;
            }
        } else {
            return (Number(tokenList[0]) == 0)? false : true;
        }
    }

    // 選択メニューの表示
    showSelectMenu(str)
    {
        this.selectList = [];
        str = str.substring(8).trim();
        let idx = str.indexOf(']');
        if (str[0] != '[' || idx < 1) return false;
        this.selectList = JSON.parse(str.substring(0, idx+1)); // メニュー項目
        if (this.selectList.length < 2) return false;
        str = str.substring(idx+1).trim();
        idx = (str)? str.indexOf(']') : -1;
        if (!str || str[0] != '[' || idx < 1) return false;
        let geoms = JSON.parse(str.substring(0, idx+1)); // 表示位置とサイズ
        if (geoms.length < 4) return false;
        str = str.substring(idx+1).trim();
        if (str.indexOf("<gold>") >= 0) { // Goldの表示
            str = str.replace("<gold>", "").trim();
            this.showGoldMenu(geoms[0], geoms[1]-60, geoms[2], 120);
        }
        let delay = (str)? Number(str) : -1; // 表示の遅延時間
        if (delay < 0) delay = 700;
        this.scene.time.delayedCall(delay, () => {
            let menu = new Menu(this.parent, this.scene, this.selectList, geoms[0], geoms[1], geoms[2], geoms[3]);
            this.command.menuList.push(menu);
            this.command.menu = menu;
        });
        return true;
    }

    // Goldメニュー表示
    showGoldMenu(x, y, w, h) {
        const gameData = this.scene.cache.json.get("gameData");
        let menu = new Menu(this.parent, this.scene, null, x, y, w, h, 1, -1);
        this.command.menuList.push(menu);
        menu.drawText(20, 60, "Ｇ", '36px');
        menu.drawText(70, 60, getNumberStr(gameData.gold, 5));
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
        this.cursor.setDepth(1010);
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
        rect.setDepth(1005);
        return rect;
    }

    drawFill(x, y, w, h, col=0x000000) {
        let rect = this.scene.add.graphics();
        this.drawList.add(rect);
        rect.fillStyle(col);
        rect.fillRect(x, y, w, h);
        rect.setDepth(1007);
    }
}