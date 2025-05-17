export default class EquipmentData {
    static weapons = [];
    static armors = [];
    static shields = [];
    static helmets = [];
    static accessorys = [];

    static nameMap = new Map(); // 名前 → 種別（weapons, armors, etc）

    static loadData(scene, callback) {
        scene.load.json("equipData", "data/equipment.json");
        scene.load.once("complete", () => {
            const data = scene.cache.json.get("equipData");
            if (!data) {
                console.error("equipment.json not found!");
                if (callback) callback(false);
                return;
            }

            EquipmentData.weapons = data.weapons || [];
            EquipmentData.armors = data.armors || [];
            EquipmentData.shields = data.shields || [];
            EquipmentData.helmets = data.helmets || [];
            EquipmentData.accessorys = data.accessorys || [];

            // 名前 → 種別 のマップを作成
            for (const item of EquipmentData.weapons) {
                EquipmentData.nameMap.set(item.name, EQUIP.WEAPON);
            }
            for (const item of EquipmentData.armors) {
                EquipmentData.nameMap.set(item.name, EQUIP.ARMOR);
            }
            for (const item of EquipmentData.shields) {
                EquipmentData.nameMap.set(item.name, EQUIP.SHIELD);
            }
            for (const item of EquipmentData.helmets) {
                EquipmentData.nameMap.set(item.name, EQUIP.HELMET);
            }
            for (const item of EquipmentData.accessorys) {
                EquipmentData.nameMap.set(item.name, EQUIP.ACCESS);
            }

            if (callback) callback(true);
        });

        scene.load.start(); // 忘れずにスタート！
    }

    // 名前から種別（weapons / armors / shields / helmets）を取得
    static getTypeByName(name) {
        if (name.substring(0, 2) == "E:") name = name.slice(2);
        return this.nameMap.get(name) || EQUIP.NONE;
    }

    // 名前からデータ自体を取得
    static getItemByName(name) {
        if (!name) return null;
        if (name.substring(0, 2) == "E:") name = name.slice(2);
        const type = this.nameMap.get(name);
        if (type == EQUIP.WEAPON) {
	        return EquipmentData.weapons.find(item => item.name === name) || null;
        } else if (type == EQUIP.ARMOR) {
	        return EquipmentData.armors.find(item => item.name === name) || null;
        } else if (type == EQUIP.SHIELD) {
	        return EquipmentData.shields.find(item => item.name === name) || null;
        } else if (type == EQUIP.HELMET) {
	        return EquipmentData.helmets.find(item => item.name === name) || null;
        } else {
	        return null;
	    }
    }
}
