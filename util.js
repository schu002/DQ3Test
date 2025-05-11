window.TILE_SIZE = 32;
window.SCALE = 2;
window.CARA_OFFSET = 8;
window.MOVE_DELAY = 280;

window.DIR = {
	DOWN	: 0,
	UP		: 1,
	LEFT	: 2,
	RIGHT	: 3
};

window.COMMAND = {
    NONE	: -1,
    TALK	: 0,
    ABILITY	: 1,
    EQUIP	: 2,
    SPELL	: 3,
    ITEM	: 4,
    CHECK	: 5
};

window.ACTION = {
    NONE	: 0,
    ATTACK	: 1,
    SPELL	: 2,
    DEFENSE	: 3,
    TOOL	: 4,
    ESCAPE	: 5
};

window.EQUIP = {
    NONE	: 0,
    WEAPON	: 1,
    ARMOR	: 2,
    SHIELD	: 3,
    HELMET	: 4,
    ACCESS	: 5,
};

export function updatePosition(position, dir)
{
    if		(dir == DIR.DOWN)  position[0] += 1;
    else if (dir == DIR.UP)	   position[0] -= 1;
    else if (dir == DIR.LEFT)  position[1] -= 1;
    else if (dir == DIR.RIGHT) position[1] += 1;
    else return false;
    return true;
}

export function getInverseDir(dir)
{
	if		(dir == DIR.DOWN)  return DIR.UP;
	else if (dir == DIR.UP)	   return DIR.DOWN;
	else if (dir == DIR.LEFT)  return DIR.RIGHT;
	else if (dir == DIR.RIGHT) return DIR.LEFT;
	else return dir;
}

export function getNumberStr(num, digitNum=0)
{
    let str = "";
    if (digitNum > 0) {
        let d = 0, n = num;
        while (n > 0) {
            n = Math.floor(n/10);
            d++
        }
        for (let i = 0; i < digitNum-d; i++) {
            str += "　";
        }
    }

    let n = num;
    let numstr = "";
    let nums = ["０", "１", "２", "３", "４", "５", "６", "７", "８", "９"];
    while (n > 0) {
        let mod = n % 10;
        numstr = nums[mod] + numstr;
        n = Math.floor(n/10);
    }
    return str + numstr;
}

export function trim(str)
{
    return str.replace(/^[ \t]+|[ \t]+$/g, "");
}
