class MonsterData {
    static monsters = [];

    static loadData(scene, callback) {
        console.log("load data/monsters.json");
        scene.load.json("monstersData", "data/monsters.json");
        scene.load.once("complete", () => {
            const data = scene.cache.json.get("monstersData");
            if (data && data.monsters) {
                MonsterData.monsters = data.monsters;

                // 各モンスター画像をロード
                MonsterData.monsters.forEach(monster => {
                    scene.load.image(monster.name, "image/" + monster.image);
                });

                // 画像ロードの complete イベントを待つ
                scene.load.once("complete", () => {
                    if (callback) callback();
                });

                // 画像のロードを開始
                scene.load.start();
            } else {
                console.warn("No monster data found in JSON.");
                if (callback) callback();
            }
        });
        scene.load.start();
    }

    // モンスター一覧を取得
    static getAllMonsters() {
        return monsters;
    }

    // 名前でモンスターを取得
    static getMonsterByName(name) {
        return monsters.find(monster => monster.name === name);
    }

    // ランダムでモンスターを取得
    static getRandomMonster(lv) {
        const lvList = MonsterData.monsters.filter(monster => monster.level === lv);
        console.log("lvList", lvList);
        if (lvList.length === 0) return null;
        const idx = Math.floor(Math.random() * lvList.length);
        return lvList[idx];
    }
}

export default MonsterData;
