import Player from "./player.js";
import { MenuType, MenuFlags } from "./Menu.js";
import { getNumberStr, trim } from "./util.js";

export default class Message {
    constructor(command, strList, canTalk, x, y, w, h) {
        this.command = command;
        this.scene = command.scene;
        x *= SCALE;
        y *= SCALE;
        this.width = w;
        this.height = h;
        this.drawIdx = 0; // メッセージ出力の最終行の位置
        this.talkIdx = 0; // this.talkListの現在位置
        this.forIdx = -1; // this.talkListでのfor文の位置
        this.nest = 0;
        this.drawList = this.scene.add.container(x, y);
        this.drawList.setScrollFactor(0);
        this.drawList.setDepth(1000);
        this.textList = this.scene.add.container(x, y);
        this.textList.setScrollFactor(0);
        this.textList.setDepth(1010);
        this.cursor = null;
        if (w > 0 && h > 0) this.drawRect(0, 0, w, h);

        this.canTalk = canTalk;
        this.talkBGM = this.scene.sound.add("talk", { loop: false, volume: 0.2 });
        if (strList) this.talkList = [...strList];
        this.updateTalk();

        this.timer = this.scene.time.addEvent({
            delay: 270,
            loop: true,
            callback: () => {
                if (!this.fix && this.drawIdx >= 0 && this.cursor)
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

    updateTalk() {
        if (this.talkList.length == 0) return false;

        // 会話テキスト
        let chList = [], isCursor = false, isMatch = false, isSkip = false, isBreak = false;
        let ifCnt = 0, forIdx = -1;
        while (this.talkIdx < this.talkList.length) {
            let str = trim(this.talkList[this.talkIdx++]);
            if (isBreak) {
                if (str != "endfor") continue;
                forIdx = -1;
                isBreak = false;
                continue;
            }
            str = str.replace("<hero>", Player.getHero().name);
            str = str.replace("<item>", this.command.getSelectString());
            str = str.replace("<member>", this.command.getSelectString());
            // console.log(this.talkIdx, str, isMatch, isSkip);
            if (str == "<btn>") {
                if (isSkip) continue;
                isCursor = true;
                break;
            } else if (str.substring(0, 12) == "<selectshop>") {
                if (isSkip) continue;
                if (this.showSelectShopMenu(str)) break;
            } else if (str.substring(0, 12) == "<selectitem>") {
                if (isSkip) continue;
                if (this.showSelectBuyMenu(str)) break;
            } else if (str.substring(0, 14) == "<selectweapon>") {
                if (isSkip) continue;
                if (this.showSelectBuyMenu(str)) break;
            } else if (str.substring(0, 14) == "<selectmember>") {
                if (isSkip) continue;
                if (this.showSelectMemberMenu(str)) break;
            } else if (str.substring(0, 10) == "<showgold>") {
                if (isSkip) continue;
                this.showGoldMenu(str);
                continue;
            } else if (str.substring(0, 7) == "<yesno>") {
                if (isSkip) continue;
                if (this.showSelectYesNoMenu(str)) break;
            } else if (str.substring(0, 2) == "if") {
                if (isSkip) {
                    ifCnt++;
                    continue;
                }
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
            } else if (str.substring(0, 5) == "endif") {
                if (isSkip) {
                    ifCnt--;
                    if (ifCnt < 0) {
                        isMatch = true;
                        isSkip = false;
                    }
                }
                continue;
            } else if (str == "for") {
                if (!isSkip) this.forIdx = this.talkIdx;
                continue;
            } else if (str == "endfor") {
                if (isBreak) break;
                if (!isSkip && this.forIdx >= 0) {
                    this.talkIdx = this.forIdx;
                }
                continue;
            } else if (str == "break") {
                if (!isSkip) isBreak = true;
                continue;
            } else {
                if (isSkip) continue;
            }

            for (const ch of str) {
                chList.push(ch);
            }
            chList.push('\n');
        }

        if (this.talkIdx >= this.talkList.length) {
            this.talkList = [];
            this.talkIdx = 0;
        }

        if (this.cursor) {
	        this.cursor.destroy();
	        this.cursor = null;
	    }
        let idx = 0, x = 25;
        this.scene.time.addEvent({
            delay: 12,
            repeat: chList.length-1,
            callback: () => {
		        if (this.canTalk && (idx % 6) == 0) this.talkBGM.play();
                let y = 65 + this.drawIdx*64;
                let ch = chList[idx++];
                if (ch == '\n') {
                    this.drawIdx++;
                    x = 25;
                    // 最後の行に来たら、１行ずつ上にずらす
                    if (this.drawIdx == 4) {
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
                        this.drawIdx--;
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
        return (this.talkList.length > 0)? true : false;
    }

    isMatchCondition(condstr) {
        condstr = condstr.replace("<index>", String(this.command.getSelectIndex()));
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

    // メニューを表示する
    showMenu(type, strList, geoms, flags=MenuFlags.Default)
    {
        let menu = this.command.createMenu(type, strList, geoms[0], geoms[1], geoms[2], geoms[3], flags);
        return menu;
    }

    // 買う、売るメニューの表示
    showSelectShopMenu(str)
    {
        str = str.substring(12).trim();
        let idx = str.indexOf(']');
        if (str[0] != '[' || idx < 3) return false;
        let geoms = JSON.parse(str.substring(0, idx+1)); // 表示位置とサイズ
        if (geoms.length < 2) return false;
        geoms[2] = geoms[3] = 125;
        str = str.substring(idx+1).trim();
        let delay = (str)? Number(str) : -1; // 表示の遅延時間
        if (delay < 0) delay = 700;
        this.scene.time.delayedCall(delay, () => {
            let selectList = ["かいにきた", "うりにきた", "やめる"];
            this.showMenu(MenuType.BuySell, selectList, geoms, MenuFlags.ShowCursor);
        });
        return true;
    }

    // どうぐ屋選択メニューの表示
    showSelectBuyMenu(str)
    {
        let len = (str.substring(12) == "<selectitem>")? 12 : 14;
        str = str.substring(len).trim();
        let itemList = (len == 12)? this.scene.getItemList() : this.scene.getWeaponList();
        if (itemList.length < 1) return false;

        let idx = (str)? str.indexOf(']') : -1;
        if (str[0] != '[' || idx < 3) return false;
        let geoms = JSON.parse(str.substring(0, idx+1)); // 表示位置とサイズ
        if (geoms.length < 2) return false;
        geoms[2] = 255;
        geoms[3] = 29 + itemList.length*32;

        str = str.substring(idx+1).trim();
        let delay = (str)? Number(str) : -1; // 表示の遅延時間
        if (delay < 0) delay = 700;
        this.scene.time.delayedCall(delay, () => {
            this.command.mainMenu.setVisible(false);
            let menu = this.showMenu(MenuType.Shop, null, geoms);
            menu.setShopList(itemList);
        });
        return true;
    }

    // メンバー選択メニューの表示
    showSelectMemberMenu(str)
    {
        let memList = this.scene.getMemberList();
        if (memList.length < 1) return false;
        let strList = [];
        memList.forEach(member => strList.push(member.name));

        str = str.substring(14).trim();
        let idx = (str)? str.indexOf(']') : -1;
        if (!str || str[0] != '[' || idx < 8) return false;
        let geoms = JSON.parse(str.substring(0, idx+1)); // 表示位置とサイズ
        if (geoms.length < 4) return false;

        str = str.substring(idx+1).trim();
        let delay = (str)? Number(str) : -1; // 表示の遅延時間
        if (delay < 0) delay = 800;
        this.scene.time.delayedCall(delay, () => {
            let menu = this.showMenu(MenuType.Member, strList, geoms, MenuFlags.ShowCursor);
        });
        return true;
    }

    // 「はい、いいえ」選択メニューの表示
    showSelectYesNoMenu(str)
    {
        str = str.substring(7).trim();
        let idx = (str)? str.indexOf(']') : -1;
        if (!str || str[0] != '[' || idx < 3) return false;
        let geoms = JSON.parse(str.substring(0, idx+1)); // 表示位置とサイズ
        if (geoms.length < 2) return false;

        str = str.substring(idx+1).trim();
        let delay = (str)? Number(str) : -1; // 表示の遅延時間
        if (delay < 0) delay = 700;
        this.scene.time.delayedCall(delay, () => {
            geoms[2] = geoms[3] = 95;
            let strList = ["はい", "いいえ"];
            this.showMenu(MenuType.YesNo, strList, geoms, MenuFlags.ShowCursor);
        });
        return true;
    }

    // Goldメニュー表示
    showGoldMenu(str) {
        str = str.substring(10).trim();
        let idx = (str)? str.indexOf(']') : -1;
        if (!str || str[0] != '[' || idx < 3) return;
        let geoms = JSON.parse(str.substring(0, idx+1)); // 表示位置とサイズ
        geoms[2] = 125;
        geoms[3] = 60;
        const gameData = this.scene.cache.json.get("gameData");
        let menu = this.showMenu(MenuType.Gold, null, geoms, 0);
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