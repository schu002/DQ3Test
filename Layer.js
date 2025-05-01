import NPC from "./NPC.js";
import { updatePosition } from "./util.js";

const TILE_DESK = 20;
const IMG_MERCHANT = "image/merchant.png";

export default class Layer {
    constructor(scene, layerData, drawLayer) {
        this.name = layerData.name;
        this.data = layerData.data;
        this.rows = layerData.height;
        this.columns = layerData.width;
        this.start = layerData.start;
        this.dir = layerData.dir;
        this.npcs = (layerData.npcs || []).map(npc => new NPC(scene, npc));  // NPCクラスは既に存在と仮定
        this.toLayers = layerData.toLayers || [];
        this.drawLayer = drawLayer;

        // 歩行アニメーション
        scene.time.addEvent({
            delay: 250,
            loop: true,
            callback: () => {
                this.npcs.forEach(npc => npc.updateFrame());
            }
        });
    }

    // 指定位置のタイル番号を取得
    getTileIndex(row, col) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.columns) return -1;
        let idx = row * this.columns + col;
        return this.data[row * this.columns + col];
    }

    // 指定位置のtoLayerがあるか確認
    getToLayerAt(row, col) {
        return this.toLayers.find(t => t.from[0] === row && t.from[1] === col) || null;
    }

    // NPCを全取得
    getNPCs() {
        return this.npcs;
    }

    findNPC(row, col, dir) {
	    let pos = [row, col];
	    if (!updatePosition(pos, dir)) return null;

	    let npc = this.npcs.find(n => n.row === pos[0] && n.col === pos[1]);
	    if (!npc) {
			if (this.getTileIndex(pos[0], pos[1]) != TILE_DESK) return null;
		    if (!updatePosition(pos, dir)) return null;
		    npc = this.npcs.find(n => n.row === pos[0] && n.col === pos[1]);
		    if (!npc) return null;
		    if (npc.image != IMG_MERCHANT) return null;
	    }
	    return npc;
    }

    setVisible(onoff) {
        this.drawLayer.setVisible(onoff);
        this.npcs.forEach(npc => npc.setVisible(onoff));
    }
}
