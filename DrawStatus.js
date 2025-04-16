// import OccupationData from "./OccupationData.js";
import Player from "./player.js";

class DrawStatus {
    constructor(scene, members, x, y) {
        x *= SCALE;
        y *= SCALE;
        this.scene = scene;
        this.drawList = scene.add.container(x, y);
        this.drawList.setScrollFactor(0);
        let w = 160, totalW = members.length*w+56, totalH = 252;
        this.drawFill(0, 0, totalW, totalH);
        this.drawRect(10, 10, totalW-20, totalH-20);
        for (let idx = 0; idx < members.length; idx++) {
            this.drawFill(34+idx*w, -1, 130, 12);
            this.drawText(38+idx*w, -6, members[idx].name);
            this.drawText(38+idx*w, 52, "Ｈ");
            this.drawText(66+idx*w, 52, getNumberStr(members[idx].hp));
            this.drawText(38+idx*w, 115, "Ｍ");
            this.drawText(66+idx*w, 115, getNumberStr(members[idx].mp));
            this.drawText(38+idx*w, 178, headName(members[idx].occupation));
            this.drawText(66+idx*w, 178, getNumberStr(members[idx].level));
        }
    }

    destroy() {
        this.drawList.destroy();
    }

    drawRect(x, y, w, h) {
        let rect = this.scene.add.graphics();
        this.drawList.add(rect);
        rect.lineStyle(14, 0xffffff);
        rect.fillStyle(0x000000);
        rect.strokeRoundedRect(x, y, w, h, 5);
        rect.fillRoundedRect(x, y, w, h, 5);
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

function headName(occ) {
    if (occ == "soldier") return "せ：";
    if (occ == "hero") return "ゆ：";
    if (occ == "monk") return "そ：";
    if (occ == "wizard") return "ま：";
    return "";
}

function getNumberStr(num) {
    let str = "";
    let mod = num;
    let nums = ["０", "１", "２", "３", "４", "５", "６", "７", "８", "９"];
    if (num >= 100) {
        let idx = Math.floor(mod/100);
        str = nums[idx];
        mod -= idx * 100;
    } else {
        str = (num >= 10)? "　" : "　　";
    }
    if (num >= 10) {
        let idx = Math.floor(mod/10);
        str += nums[idx];
        mod -= idx * 10;
    }
    if (num >= 0) {
        str += nums[mod];
    }
    return str;
}

export default DrawStatus;
