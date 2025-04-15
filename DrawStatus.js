// import OccupationData from "./OccupationData.js";
import Player from "./player.js";

class DrawStatus {
    constructor(scene, members, x, y) {
        x *= SCALE;
        y *= SCALE;
        this.scene = scene;
        this.drawList = scene.add.container(x, y);
        this.drawList.setScrollFactor(0);
        let w = 160;
        this.drawRect(0, 0, members.length*w+36, 232);
        for (let idx = 0; idx < members.length; idx++) {
            this.drawFill(26+idx*w, -9, 130, 12);
            this.drawText(30+idx*w, -14, members[idx].name);
            this.drawText(30+idx*w, 44, "Ｈ");
            this.drawText(58+idx*w, 44, getNumberStr(members[idx].hp));
            this.drawText(30+idx*w, 107, "Ｍ");
            this.drawText(58+idx*w, 107, getNumberStr(members[idx].mp));
            this.drawText(30+idx*w, 170, headName(members[idx].occupation));
            this.drawText(58+idx*w, 170, getNumberStr(members[idx].level));
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
