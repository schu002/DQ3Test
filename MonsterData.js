class MonsterData {
    constructor(scene) {
        this.scene = scene;
        this.monsters = [];

        // JSON �ǂݍ���
        const data = this.scene.cache.json.get("monstersData");

        if (data && data.monsters) {
            this.monsters = data.monsters;
        } else {
            console.error("Monster data not found or invalid.");
        }
    }

    // �����X�^�[�ꗗ���擾
    getAllMonsters() {
        return this.monsters;
    }

    // ���O�Ń����X�^�[���擾
    getMonsterByName(name) {
        return this.monsters.find(monster => monster.name === name);
    }

    // �����_���Ń����X�^�[���擾
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
