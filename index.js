// 画面サイズ（2倍に拡大）
const SCREEN_WIDTH = 960;
const SCREEN_HEIGHT = 720;

import FieldScene from "./field.js";
import TownScene from "./town.js";

const config = {
    type: Phaser.AUTO,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    scene: [TownScene, FieldScene],
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    }
};

const game = new Phaser.Game(config);
