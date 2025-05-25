import Player from "./player.js";
import { MenuType, MenuFlags } from "./Menu.js";
import { getNumberStr, trim } from "./util.js";

const Attr = {
    Busy:         0x01, // 処理中
    SelectShop:   0x02, // 商品選択中かどうか
    SelectMember: 0x04, // メンバー選択中かどうか
    SelectItem:   0x08  // 持ち物選択中かどうか
}

export default class Message {
    constructor(scene, x, y, w, h) {
        this.command = null;
        this.scene = scene;
        x *= SCALE;
        y *= SCALE;
        w *= SCALE;
        h *= SCALE;
        this.width = w;
        this.height = h;
        this.drawIdx = 0; // メッセージ出力の最終行の位置
        this.talkIdx = -1; // this.strListの現在位置
        this.forIdx = -1; // this.strListでのfor文の位置
        this.drawList = scene.add.container(x, y);
        this.drawList.setScrollFactor(0);
        this.drawList.setDepth(1000);
        this.textList = scene.add.container(x, y);
        this.textList.setScrollFactor(0);
        this.textList.setDepth(1010);
        this.cursor = null;
        if (w > 0 && h > 0) this.drawRect(0, 0, w, h);

        this.talkBGM = scene.sound.add("talk", { loop: false, volume: 0.2 });
        this.strList = [];
        this.attr = 0
        this.selectItem = "";
        this.selectMember = "";

        this.timer = scene.time.addEvent({
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

    setStrList(strList, cmd=null) {
        this.strList = [...strList];
        this.talkIdx = -1;
        this.command = cmd;
        this.onButtonA();
    }

    setVisible(onoff) {
        this.drawList.setVisible(onoff);
        this.textList.setVisible(onoff);
    }

    onButtonA() {
        if (this.attr & Attr.Busy) return;
        if (!this.strList) return;
        if (this.strList.length == 0) return;
        if (this.isFinish()) return;
        this.attr |= Attr.Busy;

        if (this.cursor) {
            this.drawList.remove(this.cursor, true);
            this.cursor = null;
        }

        if (this.attr & Attr.SelectShop) {
            this.attr &= ~Attr.SelectShop;
            this.selectItem = this.command.getSelectString();
        } else if (this.attr & Attr.SelectItem) {
            this.attr &= ~Attr.SelectItem;
            this.selectItem = this.command.getSelectString();
            if (this.selectItem.substring(0, 2) == "E:")
                this.selectItem = this.selectItem.substring(2);
        } else if (this.attr & Attr.SelectMember) {
            this.attr &= ~Attr.SelectMember;
            this.selectMember = this.command.getSelectString();
        }

        // 会話テキスト
        let chList = [], isCursor = false, isSkip = false, isBreak = false;
        let forIdx = -1;
        while (++this.talkIdx < this.strList.length) {
            let str = trim(this.strList[this.talkIdx]);
            if (isBreak) {
                if (str != "endfor") continue;
                forIdx = -1;
                isBreak = false;
                continue;
            }
            str = str.replace("<hero>", Player.getHero().name);
            if (this.command) {
                str = str.replace("<item>", this.selectItem);
                str = str.replace("<member>", this.selectMember);
                str = str.replace("<sell>", getNumberStr(this.getSellPrice(this.selectItem)));
            }
            // console.log(this.talkIdx, str, isSkip);
            if (str == "<btn>") {
                if (isSkip) continue;
                isCursor = true;
                break;
            } else if (str.substring(0, 8) == "<select>") {
                if (isSkip) continue;
                if (this.showSelectMenu(str)) break;
            } else if (str.substring(0, 12) == "<selectshop>") {
                if (isSkip) continue;
                if (this.showSelectShopMenu(str)) break;
            } else if (str.substring(0, 14) == "<selectmember>") {
                if (isSkip) continue;
                if (this.showSelectMemberMenu(str)) break;
            } else if (str.substring(0, 12) == "<selectitem>") {
                if (isSkip) continue;
                if (this.showSelectItemMenu(str)) break;
            } else if (str.substring(0, 10) == "<showgold>") {
                if (isSkip) continue;
                this.showGoldMenu(str);
                continue;
            } else if (str.substring(0, 14) == "<hidemember>") {
                if (isSkip) continue;
                this.hideMember();
                continue;
            } else if (str.substring(0, 10) == "<buyitem>") {
                if (isSkip) continue;
                this.buyItem();
                continue;
            } else if (str.substring(0, 7) == "<yesno>") {
                if (isSkip) continue;
                if (this.showSelectYesNoMenu(str)) break;
            } else if (str.substring(0, 2) == "if") {
                this.skipToMatch(str);
                continue;
            } else if (str.substring(0, 4) == "elif") {
                isSkip = true;
                continue;
            } else if (str.substring(0, 4) == "else") {
                isSkip = true;
                continue;
            } else if (str.substring(0, 5) == "endif") {
                isSkip = false;
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

        this.drawText(chList, () => {
            if (isCursor) {
                this.createDownArrow();
            }
            this.attr &= ~Attr.Busy;
        });
    }

    onButtonB() {
        if (this.attr & Attr.Busy) return;
        if (!this.command.curMenu) return;
        if (this.command.curMenu.type != MenuType.Command) {
            if (!(this.command.curMenu.flags & MenuFlags.Remain)) {
                this.command.deleteCurMenu();
            }
            if (this.command.curMenu)
                this.command.curMenu.idx = -1;
        }
        this.onButtonA();
    }

    skipToMatch(str) {
        str = str.slice(2).trim();
        if (this.isMatchCondition(str)) return true;

        let ifCnt = 0;
        while (++this.talkIdx < this.strList.length) {
            let str = trim(this.strList[this.talkIdx]);
            if (str.substring(0, 2) == "if") {
                ifCnt++;
            } else if (str.substring(0, 4) == "elif") {
                if (ifCnt > 0) continue;
                str = str.slice(4).trim();
                if (this.isMatchCondition(str)) return true;
            } else if (str.substring(0, 4) == "else") {
                if (ifCnt > 0) continue;
                return true;
            } else if (str.substring(0, 5) == "endif") {
                if (ifCnt <= 0) return false;
                ifCnt--;
            }
        }
        return false;
    }

    drawText(chList, onComplete) {
        let idx = 0, x = 25, isHead = true, isTalk = false;
        this.scene.time.addEvent({
            delay: 12,
            repeat: chList.length-1,
            callback: () => {
                let y = 65 + this.drawIdx*64;
                let ch = chList[idx++];
                if (ch == '\n') {
                    this.drawIdx++;
                    isHead = true;
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
                    if (isHead) {
                        isTalk = (ch == '＊' || ch == '　')? true : false;
                        isHead = false;
                    }
                    if (isTalk && (idx % 6) == 0) this.talkBGM.play();
                }

                if (idx === chList.length) {
                    if (onComplete) onComplete();  // 最後に通知
                }
            },
            callbackScope: this
        });
    }

    isFinish() {
        let ret = (this.strList.length > 0 && this.talkIdx >= this.strList.length);
        return ret;
    }

    isMatchCondition(condstr) {
        const gameData = this.scene.cache.json.get("gameData");
        condstr = condstr.replace("<gold>", String(gameData.gold));
        if (condstr.indexOf("<price>") >= 0) {
            const item = (this.command.npc.name == "item")?
                        this.scene.getItem(this.selectItem) : this.scene.getWeapon(this.selectItem);
            if (item) condstr = condstr.replace("<price>", String(item.price));
        }
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

    getDelay(str)
    {
        let idx = str.indexOf("/delay:");
        if (idx < 0) return -1;
        str = str.slice(idx+7);
        idx = str.indexOf(' ');
        if (idx > 0) str = str.slice(0, idx);
        return Number(str);
    }

    getSellPrice(name) {
        let price = 1;
        const item = this.scene.getItem(name);
        if (item) {
            price = Math.floor(item.price*0.75);
        } else {
            const weapon = this.scene.getWeapon(name);
            if (weapon) price = Math.floor(weapon.price*0.75);
        }
        return price;
    }

    // メニューを表示する
    showMenu(type, strList, geoms, flags=MenuFlags.Default)
    {
        let menu = this.command.createMenu(type, strList, geoms[0], geoms[1], geoms[2], geoms[3], flags);
        return menu;
    }

    // 選択メニューの表示
    showSelectMenu(str)
    {
        str = str.substring(8).trim();
        let type = MenuType.Other;
        let idx = str.indexOf("type<");
        if (idx >= 0) {
            let idx2 = str.indexOf('>', idx+5);
            if (idx2 > idx+5) {
                let typestr = str.substring(idx+5, idx2);
                if      (typestr == "Luida") type = MenuType.Luida;
                else if (typestr == "Vault") type = MenuType.Vault;
                else if (typestr == "Shop") type = MenuType.BuySell;
            }
            str = str.substring(idx2+1).trim();
        }

        idx = str.indexOf(']');
        if (str[0] != '[' || idx < 8) return false;
        let selectList = JSON.parse(str.substring(0, idx+1)); // 選択メニュー
        if (selectList < 2) return false;
        str = str.substring(idx+1).trim();
        idx = str.indexOf(']');
        if (str[0] != '[' || idx < 8) return false;
        let geoms = JSON.parse(str.substring(0, idx+1)); // 表示位置とサイズ
        if (geoms.length < 4) return false;
        str = str.substring(idx+1).trim();
        let delay = (str)? Number(str) : -1; // 表示の遅延時間
        if (delay < 0) delay = 500;
        this.scene.time.delayedCall(delay, () => {
            this.showMenu(type, selectList, geoms, MenuFlags.ShowCursor);
        });
        return true;
    }

    // どうぐ屋選択メニューの表示
    showSelectShopMenu(str)
    {
        str = str.substring(12).trim();
        let itemList = (this.command.npc.name == "item")? this.scene.getItemList() : this.scene.getWeaponList();
        if (itemList.length < 1) return false;

        let idx = (str)? str.indexOf(']') : -1;
        if (str[0] != '[' || idx < 3) return false;
        let geoms = JSON.parse(str.substring(0, idx+1)); // 表示位置とサイズ
        if (geoms.length < 2) return false;
        geoms[2] = 255;
        geoms[3] = 29 + itemList.length*32;

        str = trim(str.substring(idx+1));
        let delay = this.getDelay(str);
        if (delay < 0) delay = 700;
        this.scene.time.delayedCall(delay, () => {
            this.command.mainMenu.setVisible(false);
            let menu = this.showMenu(MenuType.Shop, null, geoms);
            menu.setShopList(itemList);
            this.attr |= Attr.SelectShop;
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
        if (geoms.length < 2) return false;
        geoms[2] = 125;
        geoms[3] = 29 + memList.length*32;

        str = str.substring(idx+1).trim();
        let delay = this.getDelay(str);
        if (delay < 0) delay = 800;

        this.scene.time.delayedCall(delay, () => {
            let menu = this.showMenu(MenuType.Member, strList, geoms, MenuFlags.Default);
            this.showMemberItem(str, memList[0].items);
            this.attr |= Attr.SelectMember;
        });
        return true;
    }

    // 持ち物選択メニューの表示
    showSelectItemMenu(str)
    {
        str = str.substring(12).trim();
        let menu = this.command.findMenu(MenuType.Item);
        if (!menu) return false;

        menu.setCursor(0);
        this.command.curMenu = menu;
        this.attr |= Attr.SelectItem;
        return true;
    }

    showMemberItem(str, items)
    {
        let idx = str.indexOf("/item");
        if (idx < 0) return;
        str = trim(str.slice(idx+5));
        idx = str.indexOf(']');
        if (!str || str[0] != '[' || idx < 3) return;
        let geoms = JSON.parse(str.substring(0, idx+1)); // 表示位置とサイズ
        if (geoms.length < 2) return;
        geoms[2] = 160;
        geoms[3] = 29 + 8*32;

        this.showMenu(MenuType.Item, items, geoms, 0);
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
    showGoldMenu(str=null) {
        const gameData = this.scene.cache.json.get("gameData");
        let menu = this.command.findMenu(MenuType.Gold);
        if (menu) {
            menu.clearText();
        } else {
            str = str.substring(10).trim();
            let idx = (str)? str.indexOf(']') : -1;
            if (!str || str[0] != '[' || idx < 3) return;
            let geoms = JSON.parse(str.substring(0, idx+1)); // 表示位置とサイズ
            geoms[2] = 125;
            geoms[3] = 60;
            menu = this.showMenu(MenuType.Gold, null, geoms, 0);
        }
        menu.drawText(20, 60, "Ｇ", '36px');
        menu.drawText(70, 60, getNumberStr(gameData.gold, 5));
    }

    hideMember() {
        let menu = this.command.findMenu(MenuType.Member);
        if (menu) this.command.removeMenu(menu);
    }

    buyItem() {
        if (!this.selectItem || !this.selectMember) return;
        const gameData = this.scene.cache.json.get("gameData");
        const member = this.scene.getMember(this.selectMember);
        if (!member) return;
        const item = (this.command.npc.name == "item")?
                    this.scene.getItem(this.selectItem) : this.scene.getWeapon(this.selectItem);
        if (!item) return;
        member.addItem(item.name);
        gameData.gold -= item.price;
        this.showGoldMenu();
    }

    createDownArrow() {
        const x = 330, y = 80+this.drawIdx*64, w = 30, h = 18;
        this.cursor = this.scene.add.graphics();
        this.drawList.add(this.cursor);
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