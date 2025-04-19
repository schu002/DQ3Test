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

window.ACTION = {
    NONE	: 0,
    ATTACK	: 1,
    SPELL	: 2,
    DEFENSE	: 3,
    TOOL	: 4,
    ESCAPE	: 5
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
