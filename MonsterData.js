class MonsterData {
    static monsters = [];

    static loadData(scene) {
        const data = scene.cache.json.get("monstersData");
        if (data && data.monsters) {
            MonsterData.monsters = data.monsters;

            // 各モンスター画像をロード
            MonsterData.monsters.forEach(monster => {
                scene.load.image(monster.name, "image/" + monster.image);
            });
        }
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
        if (lvList.length === 0) return null;
        const idx = Math.floor(Math.random() * lvList.length);
        return lvList[idx];
    }
}

export default MonsterData;
