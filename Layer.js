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
    getTileIndex(pos) {
        if (pos[0] < 0 || pos[0] >= this.rows || pos[1] < 0 || pos[1] >= this.columns) return -1;
        let idx = pos[0] * this.columns + pos[1];
        return this.data[pos[0] * this.columns + pos[1]];
    }

    // 指定位置のtoLayerがあるか確認
    getToLayerAt(pos) {
        if (!this.toLayers) return null;
        let row = pos[0], col = pos[1];
        for (const toLayer of this.toLayers) {
            if (toLayer.position) {
                if (toLayer.position[0] === row && toLayer.position[1] === col) return toLayer;
            }
            if (toLayer.outrange) {
                if (row < toLayer.outrange[0] || row > toLayer.outrange[2] ||
                    col < toLayer.outrange[1] || col > toLayer.outrange[3]) return toLayer;
            }
        }
        return null;
    }

    // NPCを全取得
    getNPCs() {
        return this.npcs;
    }

    // posの位置にいるNPCを検索する
    findNPC(pos, dir) {
	    if (!updatePosition(pos, dir)) return null;

	    let npc = this.npcs.find(n => n.pos[0] === pos[0] && n.pos[1] === pos[1]);
	    if (!npc) {
			if (this.getTileIndex(pos[0], pos[1]) != TILE_DESK) return null;
		    if (!updatePosition(pos, dir)) return null;
		    npc = this.npcs.find(n => n.pos[0] === pos[0] && n.pos[1] === pos[1]);
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
