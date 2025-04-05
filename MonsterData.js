class MonsterData {
    constructor(scene) {
        this.scene = scene;
        this.monsters = [];

        // JSON 読み込み
        const data = this.scene.cache.json.get("monstersData");

        if (data && data.monsters) {
            this.monsters = data.monsters;
        } else {
            console.error("Monster data not found or invalid.");
        }
    }

    // モンスター一覧を取得
    getAllMonsters() {
        return this.monsters;
    }

    // 名前でモンスターを取得
    getMonsterByName(name) {
        return this.monsters.find(monster => monster.name === name);
    }

    // ランダムでモンスターを取得
    getRandomMonster() {
        if (this.monsters.length === 0) {
            console.warn("No monsters available.");
            return null;
        }
        const index = Math.floor(Math.random() * this.monsters.length);
        return this.monsters[index];
    }
}

export default MonsterData;
