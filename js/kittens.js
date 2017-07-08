// This sectin contains some game constants. It is not super interesting
var GAME_WIDTH = 375;
var GAME_HEIGHT = 500;

var ENEMY_WIDTH = 75;
var ENEMY_HEIGHT = 156;
var MAX_ENEMIES = 3;

var PLAYER_WIDTH = 75;
var PLAYER_HEIGHT = 54;

// These two constants keep us from using "magic numbers" in our code
var LEFT_ARROW_CODE = 37;
var RIGHT_ARROW_CODE = 39;
var TOP_ARROW_CODE = 38;
var SPACE_BUTTON = 32;

//LEFT HANDED OPTIONS
var SHOOT_W = 87;
var LEFT_A = 65;
var RIGHT_D = 68;


// These two constants allow us to DRY
var MOVE_LEFT = 'left';
var MOVE_RIGHT = 'right';


// Preload game images
var images = {};
['enemy.png', 'stars.png', 'player.png', 'laser.png'].forEach(imgName => {
    var img = document.createElement('img');
    img.src = 'images/' + imgName;
    images[imgName] = img;
});





// This section is where you will be doing most of your coding

class Entity {
  render(ctx) {
      ctx.drawImage(this.sprite, this.x, this.y);
  }
}

class Laser extends Entity{
  constructor(xPos){
    super();
    this.x = 0;
    this.y = -100;
    this.sprite = images['laser.png'];
    this.speed = 0.25;
    this.boom = false;
  }

  shoot(playerPos){
    this.x = playerPos
    this.y = GAME_HEIGHT - (PLAYER_HEIGHT*3);
    this.boom = true;
  }

  update(timeDiff) {
    this.y<(-PLAYER_HEIGHT) ?  function(){
      this.y = 600}.bind(this)() :
    function () {
      if (this.y != 600) { this.y = this.y - timeDiff * this.speed;}
    }.bind(this)();
  }
}


class Enemy extends Entity {
    constructor(xPos) {
        super();   //no need for a parameter because the construct
        this.x = xPos;
        this.y = -ENEMY_HEIGHT;
        this.sprite = images['enemy.png'];

        // Each enemy should have a different speed
        this.speed = Math.random() / 2 + 0.25;
    }

    update(timeDiff) {
        this.y = this.y + timeDiff * this.speed;
    }

}

class Player extends Entity {
    constructor() {
        super();
        this.x = 2 * PLAYER_WIDTH;
        this.y = GAME_HEIGHT - PLAYER_HEIGHT - 10;
        this.sprite = images['player.png'];
    }

    // This method is called by the game engine when left/right arrows are pressed
    move(direction) {
      console.log(direction, "direction object")
        if (direction === MOVE_LEFT && this.x > 0) {
            this.x = this.x - PLAYER_WIDTH;
        }
        else if (direction === MOVE_RIGHT && this.x < GAME_WIDTH - PLAYER_WIDTH) {
            this.x = this.x + PLAYER_WIDTH;
        }
    }
}





/*
This section is a tiny game engine.
This engine will use your Enemy and Player classes to create the behavior of the game.
The engine will try to draw your game at 60 frames per second using the requestAnimationFrame function
*/
class Engine {
    constructor(element) {
        // Setup the player
        this.player = new Player();
        //Setup laser
        this.laser = new Laser();
        // Setup enemies, making sure there are always three
        this.setupEnemies();
        // this.setupBullets();
        // Setup the <canvas> element where we will be drawing
        var canvas = document.createElement('canvas');
        canvas.width = GAME_WIDTH;
        canvas.height = GAME_HEIGHT;
        element.appendChild(canvas);
        this.ctx = canvas.getContext('2d');
        // Since gameLoop will be called out of context, bind it once here.
        this.gameLoop = this.gameLoop.bind(this);
    }

    /*
     The game allows for 5 horizontal slots where an enemy can be present.
     At any point in time there can be at most MAX_ENEMIES enemies otherwise the game would be impossible
     */
    setupEnemies() {
        if (!this.enemies) {
            this.enemies = [];
        }

        while (this.enemies.filter(e => !!e).length < MAX_ENEMIES) {
            this.addEnemy();
        }
    }


    // This method finds a random spot where there is no enemy, and puts one in there
    addEnemy() {
        var enemySpots = GAME_WIDTH / ENEMY_WIDTH;

        var enemySpot;
        // Keep looping until we find a free enemy spot at random
        while (enemySpot === 'undefined'|| this.enemies[enemySpot]) {
            enemySpot = Math.floor(Math.random() * enemySpots);
        }

        this.enemies[enemySpot] = new Enemy(enemySpot * ENEMY_WIDTH);
    }

    // This method kicks off the game
    start() {
        this.score = 0;
        this.lastFrame = Date.now();



        // Listen for keyboard left/right/shoot and update the player
        document.addEventListener('keydown', e => {
            if (e.keyCode === LEFT_ARROW_CODE || e.keyCode === LEFT_A) {
                this.player.move(MOVE_LEFT);
            }
            else if (e.keyCode === RIGHT_ARROW_CODE || e.keyCode === RIGHT_D) {
                this.player.move(MOVE_RIGHT);
            }
            else if (e.keyCode === TOP_ARROW_CODE || e.keyCode === SHOOT_W){
              if(!this.laser.boom || this.laser.y > 450){
               this.laser.shoot(this.player.x);
             }
            }
            else if (e.keyCode === SPACE_BUTTON && this.isPlayerDead()){
                this.score = 0;
                this.gameLoop();
              }
        });

        this.gameLoop();

    }

    /*
    This is the core of the game engine. The `gameLoop` function gets called ~60 times per second
    During each execution of the function, we will update the positions of all game entities
    It's also at this point that we will check for any collisions between the game entities
    Collisions will often indicate either a player death or an enemy kill

    In order to allow the game objects to self-determine their behaviors, gameLoop will call the `update` method of each entity
    To account for the fact that we don't always have 60 frames per second, gameLoop will send a time delta argument to `update`
    You should use this parameter to scale your update appropriately
     */
    gameLoop() {
        // Check how long it's been since last frame
        var currentFrame = Date.now();
        var timeDiff = currentFrame - this.lastFrame;

        // Increase the score!

        this.score += timeDiff;

        // Call update on all enemies
        this.enemies.forEach(enemy => enemy.update(timeDiff));

        // Call update on laser
        this.laser.update(timeDiff);


        // Draw everything!
        this.ctx.drawImage(images['stars.png'], 0, 0); // draw the star bg
        this.enemies.forEach(enemy => enemy.render(this.ctx)); // draw the enemies
        this.player.render(this.ctx); // draw the player
        this.laser.render(this.ctx);
        this.killCat();

        // Check if any enemies should die  //HERE IS WHERE YOU PUT ENEMY DYING UPON SHOOT
        this.enemies.forEach((enemy, enemyIdx) => {
            if (enemy.y > GAME_HEIGHT) {
                delete this.enemies[enemyIdx];
            }
        });


        this.setupEnemies();
        // this.setupBullets();
        // Check if player is dead

        if (this.isPlayerDead()) {
          // If they are dead, then it's game over!
            this.ctx.font = 'bold 30px Impact';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText('SCORE : '+ this.score, 110, 120);
            this.ctx.fillText('GAME  OVER', 115, 162.5);
            this.ctx.fillText('PRESS  SPACE', 101, 267.5);
            this.ctx.fillText('TO  RESTART', 109, 307.5);


        }
        else {
            // If player is not dead, then draw the score
            this.ctx.font = 'bold 30px Impact';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(this.score, 5, 30);

            // Set the time marker and redraw
            this.lastFrame = Date.now();
            requestAnimationFrame(this.gameLoop);
        }
    }

    killCat(){
    for(var i = 0; i<5; i++){
        if(this.enemies[i] != undefined &&
          this.enemies[i].x == this.laser.x &&
            this.enemies[i].y > this.laser.y-100){
              delete this.enemies[i];
              break;
        }
      }
    }

    isPlayerDead() {
        var dead = false;
        for(var i=0; i<5;i++){
          if(this.enemies[i] != undefined) {
            if(this.enemies[i].x == this.player.x && this.enemies[i].y >= GAME_HEIGHT - PLAYER_HEIGHT - ENEMY_HEIGHT){
              dead = true;
              console.log(dead);
            }
          }
        }
        return dead;
    }

}

// This section will start the game
var gameEngine = new Engine(document.getElementById('app'));
gameEngine.start();

//make a controls section

//fix shoot
