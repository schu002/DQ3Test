export default class TalkManager {
    static talkMap = {};

    // 非同期でファイルを読み込む
    static async load(filepath) {
        try {
            const response = await fetch(filepath);
            const text = await response.text();
            let lines = text.split(/\r?\n/);
            let layname = "", npcname = "";
            let strList = [];
            for (let idx = 0; idx < lines.length; idx++) {
                let line = lines[idx].trim();
                if (line.substring(0, 6) == "layer:") {
                    layname = line.substring(6, line.length-1).trim();
                } else if (line.substring(0, 5) == "name:") {
                    if (strList.length > 0) {
                        TalkManager.talkMap[layname + "/" + npcname] = strList;
                        strList = [];
                    }
                    npcname = line.substring(5).trim();
                } else if (line == "}") {
                    if (strList.length > 0) {
                        TalkManager.talkMap[layname + "/" + npcname] = strList;
                        strList = [];
                    }
                } else if (line) {
                    strList.push(line);
                }
            }
            // console.log(`Loaded ${this.lines.length} lines from ${filepath}`);
        } catch (error) {
            console.error(`Failed to load talk file: ${filepath}`, error);
        }
    }

    static findTalks(layer, npc) {
        return TalkManager.talkMap[layer.name + "/" + npc.name];
    }

    static clear() {
        TalkManager.talkMap = {};
    }

    // 指定した行数のテキストを取得（存在しない場合はnull）
    /* getLine(index) {
        return this.lines[index] ?? null;
    }

    // 全行を取得
    getAllLines() {
        return this.lines;
    }

    // 各行を処理するコールバック関数を指定
    forEachLine(callback) {
        this.lines.forEach((line, idx) => callback(line, idx));
    } */
}
