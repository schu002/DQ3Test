// 画面サイズ（2倍に拡大）
const SCREEN_WIDTH = 992;
const SCREEN_HEIGHT = 890;

import TitleScene from "./TitleScene.js";
import FieldScene from "./field.js";
import TownScene from "./town.js";
import BattleScene from "./battle.js";

const config = {
    type: Phaser.AUTO,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    scene: [TitleScene, TownScene, FieldScene, BattleScene],
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    }
};

const game = new Phaser.Game(config);
