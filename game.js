const terrainX = 8000, terrainY = 6000;
var isMouseDown = false;
var cameraX=terrainX/2, cameraY=terrainY/2;

function draw_from_camera(x, y, sx, sy){
    context.fillRect(x-cameraX+canvas.width/2-sx/2, y-cameraY+canvas.height/2-sy/2, sx, sy);
}
function drw_img(img, x, y, sx, sy, alpha){
    context.save();
    context.translate(x-cameraX+canvas.width/2, y-cameraY+canvas.height/2);
    context.rotate(alpha);
    context.drawImage(img, -sx/2, -sy/2, sx, sy);
    context.restore();
}
function coll(obj1, obj2){
    return areColliding(
        obj1.x-obj1.sx/2, obj1.y-obj1.sy/2, obj1.sx, obj1.sy,
        obj2.x-obj2.sx/2, obj2.y-obj2.sy/2, obj2.sx, obj2.sy
    );
}
function d(x1, y1, x2, y2){
    return Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
}

class Platform{
    constructor(x, y, sx){
        this.x = x;
        this.oldx = this.x;
        this.y = y;
        this.oldy = this.y;
        this.sx = sx;
        this.sy = 10;
        this.color = 'green';
    }
    move(){
        this.oldx = this.x;
        this.oldy = this.y;
    }
    draw(){
        context.fillStyle = this.color;
        draw_from_camera(this.x, this.y, this.sx, this.sy);
    }
};

class MovingPlatform extends Platform{
    constructor(x1, y1, sx, x2, y2, t){
        super(x1, y1, sx);
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.t = t;
        this.alpha = 0;
    }
    move(){
        super.move();
        this.alpha+=2/this.t*Math.PI;
        let sin = (Math.sin(this.alpha)+1)/2;
        this.x = sin*this.x1 + (1-sin)*this.x2;
        this.y = sin*this.y1 + (1-sin)*this.y2;
    }
}

var np = 1000
var plats = [];
for (let i=0; i<np; ++i){
    let x = Math.floor(Math.random()*terrainX/200)*200;
    let y = Math.floor(Math.random()*terrainY/100)*100;
    if (Math.random()<0.2)
        plats[i] = new MovingPlatform(x, y, 150, x+(Math.floor(Math.random()*3)-1)*200, y+(Math.floor(Math.random()*3)-1)*100, Math.random()*100+200);
    else
        plats[i] = new Platform(x, y, 150);
}

class Player{
    constructor(){
        this.x = cameraX;
        this.y = cameraY;
        this.sx = 20;
        this.sy = 50;
        this.color = 'blue';
        this.dy = 0;
        this.step = -1;
        this.health = 100;
        this.inv = 0;
    }
    jump(){
        if (this.health <= 0) return;
        if (this.step!=-1){
            this.dy = -12;
            this.step = -1;
        }
    }
    hit(dmg){
        if (this.health <= 0) return;
        if (this.inv == 0){
            this.health -= dmg;
            this.inv = 10;
        }
    }
    fall(){
        if (this.step!=-1){
            this.step=-1;
            this.dy = 0;
        }
    }
    pickup(){
        let closest=1, dist=terrainX+terrainY+1000;
        for (let i=1; i<weapons.length; ++i){
            let cdist = d(this.x, this.y, weapons[i].x, weapons[i].y);
            if (cdist < dist){
                dist = cdist;
                closest = i;
            }
        }
        if (dist < 100){
            weapons[0].held = false;
            let c = weapons[closest];
            weapons[closest] = weapons[0]
            weapons[0] = c;
            weapons[0].held = true;
        }
    }
    update(){
        if (this.health <= 0) return;
        if (this.inv > 0) --this.inv;
        let oldy = this.y;
        if (this.step==-1){
            this.dy += 0.17;
            this.y += this.dy;
        }else{
            this.x += plats[this.step].x - plats[this.step].oldx;
            this.y += plats[this.step].y - plats[this.step].oldy;
        }
        if (isKeyPressed[65]) this.x -= 5;
        if (isKeyPressed[68]) this.x += 5;
        if (this.step!=-1 && (this.x+this.sx/2 < plats[this.step].x-plats[this.step].sx/2 || this.x-this.sx/2 > plats[this.step].x+plats[this.step].sx/2)){
            this.step = -1;
            this.dy = 0;
        }
        for (let i=0; i<np; ++i){
            if (coll(this, plats[i]) && plats[i].oldy-oldy > this.sy/2+plats[i].sy/2){
                this.step = i;
                this.y = plats[i].y-this.sy/2-plats[i].sy/2;
            }
        }
        cameraX = this.x;
        cameraY = this.y;
    }
    draw(){
        if (this.health <= 0) return;
        context.fillStyle = 'rgba(0, 0, 255, 0.5)';
        draw_from_camera(this.x, this.y-this.sy/2-20, this.health, 10);
        if (this.inv%2==0) context.fillStyle = this.color;
        draw_from_camera(this.x, this.y, this.sx, this.sy);
    }
}

var player = new Player();

class Enemy{
    constructor(x, y){
        this.x=x;
        this.y=y;
        this.sx = 30;
        this.sy = 30;
        this.color = 'red';
        this.speed = 4;
        this.health = 2;
    }
    hit(dmg){
        this.health -= dmg;
        if (this.health <= 0){
            Object.assign(this, enemies[enemies.length-1]);
            enemies.pop();
        }
    }
    update(){
        let dist = d(player.x, player.y, this.x, this.y);
        this.x += (player.x-this.x)/dist*this.speed;
        this.y += (player.y-this.y)/dist*this.speed;
        if (coll(this, player)) player.hit(1);
    }
    draw(){
        context.fillStyle = this.color;
        draw_from_camera(this.x, this.y, this.sx, this.sy);
    }
}

var ne = 50;
var enemies = [];
for (let i=0; i<ne; ++i){
    enemies[i] = new Enemy(Math.random()*terrainX, Math.random()*terrainY);
}

var bullets = [];
class Bullet{
    constructor(x, y, sx, sy, targetX, targetY, speed, dmg, img){
        this.x = x;
        this.y = y;
        this.sx = sx;
        this.sy = sy;
        let dist = d(x, y, targetX, targetY);
        this.dx = (targetX-x)/dist*speed;
        this.dy = (targetY-y)/dist*speed;
        this.alpha = Math.atan2(this.dy, this.dx);
        this.img = new Image();
        this.img.src = img;
        this.dmg = dmg;
    }
    del(){
        Object.assign(this, bullets[bullets.length-1]);
        bullets.pop();
    }
    update(){
        this.x+=this.dx;
        this.y+=this.dy;
        if (this.x > terrainX+canvas.width ||
           this.x < -canvas.width ||
           this.y > terrainY+canvas.height ||
           this.y < -canvas.height){
            this.del();
            return;
        }
        for (let i=0; i<enemies.length; ++i){
            if (coll(this, enemies[i])){
                enemies[i].hit(this.dmg);
                this.del();
                return;
            }
        }
    }
    draw(){
        drw_img(this.img, this.x, this.y, this.sx, this.sy, this.alpha)
    }
}

class Weapon{
    constructor(x, y, held=false){
        this.x = x;
        this.y = y;
        this.sx = 50;
        this.sy = 50;
        this.img = new Image();
        this.img.src = 'pistol.png';
        this.img_flip = new Image();
        this.img_flip.src = 'pistol_flip.png';
        this.held = held;
        this.reaload_time = 30;
        this.curr_reload = 0;
    }
    update(){
        if (this.held){
            if (this.curr_reload > 0) --this.curr_reload;
            this.y = player.y;
            if (mouseX-canvas.width/2+cameraX > player.x)
                this.x = player.x+10;
            else                
                this.x = player.x-10;
        }
    }
    shoot(){
        if (this.held && this.curr_reload==0){
            bullets.push(new Bullet(this.x, this.y, 20, 10, mouseX-canvas.width/2+cameraX, mouseY-canvas.height/2+cameraY, 10, 2, 'bullet.png'));
            this.curr_reload = this.reaload_time;
        }
    }
    draw(){
        let dirX, dirY, alpha;
        if (this.held){
            dirX = mouseX-canvas.width/2+cameraX-this.x;
            dirY = mouseY-canvas.height/2+cameraY-this.y;
            alpha = Math.atan2(dirY, dirX);
        }else{
            dirX = 100;
            dirY = 0;
            alpha = 0;
        }
        if (dirX >= 0) drw_img(this.img, this.x, this.y, this.sx, this.sy, alpha);
        else drw_img(this.img_flip, this.x, this.y, this.sx, this.sy, alpha);
    }
}

class AK47 extends Weapon{
    constructor(x, y, held=false){
        super(x, y, held);
        this.img.src = 'ak47.png';
        this.img_flip.src = 'ak47_flip.png';
        this.reaload_time = 5;
    }
}
var nw = 20;
var weapons = [];
weapons[0] = new Weapon(player.x, player.y, true);
for (let i=1; i<nw; ++i){
    weapons[i] = new AK47(Math.random()*terrainX, Math.random()*terrainY);
}

function update() {
    for (let i=0; i<np; ++i){
        plats[i].move();
    }
    player.update();
    for (let i=0; i<enemies.length; ++i){
        enemies[i].update();
    }
    weapons[0].update();
    if (isMouseDown) weapons[0].shoot();
    for (let i=0; i<bullets.length; ++i){
        bullets[i].update();
    }
}

function draw() {
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);
    for (let i=0; i<np; ++i){
        plats[i].draw();
    }
    for (let i=0; i<enemies.length; ++i){
        enemies[i].draw();
    }
    player.draw();
    for (let i=0; i<nw; ++i){
        weapons[i].draw();
    }
    for (let i=0; i<bullets.length; ++i){
        bullets[i].draw();
    }
};

function keydown(key) {
    if (key==32) player.jump();
    if (key==83) player.fall();
    if (key==69) player.pickup();
};
function mousedown(){
    isMouseDown=true;
}
function mouseup() {
    isMouseDown=false;
};
