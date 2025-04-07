class OccupationData {
    static datas = [];

    // データロード関数
    static loadData(scene) {
        const data = scene.cache.json.get("occData");
        if (data && data.classes) {
            OccupationData.datas = data.classes;
            OccupationData.datas.forEach(occ => {
                scene.load.spritesheet(occ.name, "image/" + occ.image, { frameWidth: 32, frameHeight: 32 });
            });
        }
    }

    // 職業名でデータを取得
    static getData(name) {
        return OccupationData.datas.find(occ => occ.name === name);
    }

    // 職業とレベルでパラメータを取得
    static getParams(name, level) {
        const occ = OccupationData.getData(name);
        if (!occ) return null;

        const levelData = occ.levels.find(lv => lv.level === level);
        if (!levelData) return null;
        return levelData;
    }
}

export default OccupationData;
