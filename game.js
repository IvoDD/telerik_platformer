const terrainX = 8000, terrainY = 6000;
var isMouseDown = false;
var cameraX=terrainX/2, cameraY=terrainY/2;

function draw_from_camera(x, y, sx, sy){
    context.fillRect(x-cameraX+canvas.width/2-sx/2, y-cameraY+canvas.height/2-sy/2, sx, sy);
}
function drw_img(img, x, y, sx, sy, alpha){
    if (alpha==0){
        context.drawImage(img, x-cameraX+canvas.width/2-sx/2, y-cameraY+canvas.height/2-sy/2, sx, sy);
        return;
    }
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
        this.sy = 40;
        this.img = new Image();
        this.img.src = 'platform.png';
    }
    move(){
        this.oldx = this.x;
        this.oldy = this.y;
    }
    draw(){
        context.fillStyle = this.color;
        drw_img(this.img, this.x, this.y, this.sx*1.2, this.sy*1.7, 0);
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

var np = 200
var plats = [];
for (let i=0; i<np; ++i){
    let x = Math.floor(Math.random()*terrainX/450)*450;
    let y = Math.floor(Math.random()*terrainY/200)*200;
    if (Math.random()<0.2)
        plats[i] = new MovingPlatform(x, y, 400, x+(Math.floor(Math.random()*3)-1)*450, y+(Math.floor(Math.random()*3)-1)*200, Math.random()*100+200);
    else
        plats[i] = new Platform(x, y, 400);
}

class Player{
    constructor(){
        this.x = cameraX;
        this.y = cameraY;
        this.sx = 40;
        this.sy = 70;
        this.color = 'blue';
        this.dy = 0;
        this.step = -1;
        this.health = 100;
        this.inv = 0;
        this.img = [new Image(), new Image(), new Image()];
        this.img_flip = [new Image(), new Image(), new Image()];
        this.img[0].src = 'hero0.png'; this.img[1].src = 'hero1.png'; this.img[2].src = 'hero2.png';
        this.img_flip[0].src = 'hero0_flipped.png'; this.img_flip[1].src = 'hero1_flipped.png'; this.img_flip[2].src = 'hero2_flipped.png';
        this.img_ind = 0;
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
            if (isKeyPressed[65] || isKeyPressed[68]){
                this.img_ind = (this.img_ind+1)%(this.img.length*10);
            }else{
                this.img_ind = 0;
            }
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
        if (mouseX >= canvas.width/2){
            if (this.step==-1){
                drw_img(this.img[1], this.x, this.y, this.sx, this.sy, 0);
            }else{
                drw_img(this.img[Math.floor(this.img_ind/10)], this.x, this.y, this.sx, this.sy, 0);
            }
        }else{
            if (this.step==-1){
                drw_img(this.img_flip[1], this.x, this.y, this.sx, this.sy, 0);
            }else{
                drw_img(this.img_flip[Math.floor(this.img_ind/10)], this.x, this.y, this.sx, this.sy, 0);
            }
        }
    }
}

var player = new Player();

class Enemy{
    constructor(x, y){
        this.x=x;
        this.y=y;
        this.sx = 30;
        this.sy = 30;
        this.img = new Image();
        this.img.src = 'enemy.png';
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
        drw_img(this.img, this.x, this.y, this.sx, this.sy, 0);
    }
}

class HardEnemy extends Enemy{
    constructor(x, y){
        super(x, y);
        this.health=10;
        this.sx = 60;
        this.sy = 60;
        this.reload_time = 10;
        this.curr_reload = 0;
    }
    update(){
        let dist = d(player.x, player.y, this.x, this.y);
        if (this.curr_reload > 0) --this.curr_reload;
        if (dist < 300){
            if (this.curr_reload <= 0){
                bullets.push(new EnemyBullet(this.x, this.y, 20, 10, player.x, player.y, 10, 2, 'bullet.png', bullets.length))
                this.curr_reload = this.reload_time;
            }
        }
        if (dist<200){
            this.y += (player.x-this.x)/dist*this.speed;
            this.x -= (player.y-this.y)/dist*this.speed;
        }
        else{
            this.x += (player.x-this.x)/dist*this.speed;
            this.y += (player.y-this.y)/dist*this.speed;
        }
    }
}

var ne = 50;
var enemies = [];
for (let i=0; i<ne; ++i){
    enemies[i] = new Enemy(Math.random()*terrainX, Math.random()*terrainY);
}

var bullets = [];
class Bullet{
    constructor(x, y, sx, sy, targetX, targetY, speed, dmg, img, ind){
        this.x = x;
        this.y = y;
        this.sx = sx;
        this.sy = sy;
        let dist = d(x, y, targetX, targetY);
        //console.log("dist", dist)
        this.dx = (targetX-x)/dist*speed;
        this.dy = (targetY-y)/dist*speed;
        this.alpha = Math.atan2(this.dy, this.dx);
        this.speed = speed;
        this.img = new Image();
        this.img.src = img;
        this.dmg = dmg;
        this.ind = ind;
    }
    del(){
        bullets[this.ind] = bullets[bullets.length-1];
        bullets[this.ind].ind = this.ind;
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
        drw_img(this.img, this.x, this.y, this.sx, this.sy, this.alpha);
    }
}

class EnemyBullet extends Bullet{
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
        if (coll(this, player)){
            player.hit(this.dmg);
            this.del();
            return;
        }
    }
}

class MultiBullet extends Bullet{
    constructor(x, y, sx, sy, targetX, targetY, speed, dmg, img, to_split, time_split){
        super(x, y, sx, sy, targetX, targetY, speed, dmg, img);
        this.to_split = to_split;
        this.time_split = time_split;
        this.curr_time = time_split;
        //console.log("xy", this.x, this.y);
        //console.log("txy", targetX, targetY);
        //console.log("dxy", this.dx, this.dy);
    }
    update(){
        super.update();
        this.curr_time--;
        if (this.curr_time <= 0 && this.to_split>0){
            this.curr_time = this.time_split;
            --this.to_split;
            bullets.push( new MultiBullet(this.x, this.y, this.sx, this.sy, this.x+Math.cos(this.alpha+Math.PI/6), this.y+Math.sin(this.alpha+Math.PI/6), this.speed, this.dmg*0.75, this.img.src, this.to_split, this.time_split, bullets.length) );
            bullets.push( new MultiBullet(this.x, this.y, this.sx, this.sy, this.x+Math.cos(this.alpha-Math.PI/6), this.y+Math.sin(this.alpha-Math.PI/6), this.speed, this.dmg*0.75, this.img.src, this.to_split, this.time_split, bullets.length) );
        }
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
            bullets.push(new Bullet(this.x, this.y, 20, 10, mouseX-canvas.width/2+cameraX, mouseY-canvas.height/2+cameraY, 10, 2, 'bullet.png', bullets.length));
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

class Shotgun extends Weapon{
    constructor(x, y, held=false){
        super(x, y, held);
        this.img.src = 'ak47.png';
        this.img_flip.src = 'ak47_flip.png';
        this.sx = 150;
        this.reaload_time = 50;
    }
    shoot(){
        if (this.held && this.curr_reload==0){
            let alpha = Math.atan2(mouseY-canvas.height/2+cameraY-this.y, mouseX-canvas.width/2+cameraX-this.x);
            for (let i=0; i<10; ++i){
                let cangle = alpha + Math.random()*Math.PI/3-Math.PI/6;
                bullets.push(new Bullet(this.x, this.y, 20, 10, this.x+Math.cos(cangle), this.y+Math.sin(cangle), 10, 2, 'bullet.png', bullets.length));
            }
            this.curr_reload = this.reaload_time;
        }
    }
}

class MultiGun extends Weapon{
    constructor(x, y, held=false){
        super(x, y, held);
        this.img.src = 'ak47.png';
        this.img_flip.src = 'ak47_flip.png';
        this.sy = 100;
        this.reaload_time = 50;
    }
    shoot(){
        if (this.held && this.curr_reload==0){
            bullets.push(new MultiBullet(this.x, this.y, 20, 10, mouseX-canvas.width/2+cameraX, mouseY-canvas.height/2+cameraY, 10, 2, 'bullet.png', 5, 10, bullets.length));
            this.curr_reload = this.reaload_time;
        }
    }
}
var nw = 100;
var weapons = [];
weapons[0] = new Weapon(player.x, player.y, true);
for (let i=1; i<nw; ++i){
    if (i%3==0) weapons[i] = new AK47(Math.random()*terrainX, Math.random()*terrainY);
    if (i%3==1) weapons[i] = new Shotgun(Math.random()*terrainX, Math.random()*terrainY);
    if (i%3==2) weapons[i] = new MultiGun(Math.random()*terrainX, Math.random()*terrainY);
}

function update() {
    if (enemies.length == 0){
        for (let i=0; i<ne; ++i){
            enemies[i] = new HardEnemy(Math.random()*terrainX, Math.random()*terrainY);
        }
        ne+=50;
    }
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

var background = new Image();
background.src = 'background.jpg'

function draw() {
    context.drawImage(background, -cameraX/terrainX*canvas.width, -cameraY/terrainY*canvas.height, canvas.width*2, canvas.height*2);
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
