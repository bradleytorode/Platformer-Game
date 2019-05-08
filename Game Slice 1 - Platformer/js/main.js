//Create Phaser game config
var config = {
    type: Phaser.AUTO,
    width: 512,
    height: 512,
    scene: {
        preload: preload,
        create: create,
        update: update
    },

    pixelArt: true,

    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 500 }
        }
    },
        callbacks: {
            postBoot: function () {
                resize();
            }
        }
   
};

//Initialise game
var game = new Phaser.Game(config);

//Initialise variables
//Initialise variables
var player, jewel;
var cursors;
var music = {}, sfx = {};

//***************** PHASER.SCENE BUILT-IN FUNCTIONS ************//

function preload() {
    console.log(this);

    //Load images
    this.load.image("background", "/assets/background.png");
    this.load.image("landscape", "/assets/landscape-tileset.png")
    this.load.image("props", "/assets/props-tileset.png")
    this.load.image("jewel", "/assets/jewel.png");
    //load tilemap
    this.load.tilemapTiledJSON("tilemap","/assets/level1.json")

    //Load spritesheets
    this.load.spritesheet("player", "/assets/player.png", { frameWidth: 24, frameHeight: 24 });


    //load SoundFX
    this.load.audio("jump", "/assets/JumpSound.wav")

    //load Music
    this.load.audio("overgroundMusic", "/assets/MainTheme1.mp3")
    this.load.audio("undergroundMusic", "/assets/MainTheme2.mp3")


  
}

function create() {
    window.addEventListener('resize', resize, false)
    createBackground.call(this);

    //Start loading in the tilemap here
    var map = this.make.tilemap({ key: "tilemap" });
    var landscape = map.addTilesetImage("landscape", "landscape");

    map.createStaticLayer("backgroundLayer", landscape, 0, 0);

    var playerSpawn = map.findObject("objectLayer", function (object) {
        if (object.name === "playerPoint") {
            return object;
        }
    });



    createPlayer.call(this, playerSpawn);


    var collisionLayer = map.createStaticLayer("collisionLayer", landscape, 0, 0);
    collisionLayer.setCollisionBetween(0, 1000);
    this.physics.add.collider(player, collisionLayer);

    //creation of jewels
    var jewels = this.physics.add.staticGroup();
    map.findObject("objectLayer", function (object) {
        if (object.type === "jewels") {
            jewels.create(object.x, object.y - 10, 'jewel', 0);
        }
    }.bind(this));

    //jewels overlap with the player
    this.physics.add.overlap(player, jewels, pickUpJewel)


    //Change camera settings
    var camera = this.cameras.getCamera("");
    camera.zoom = 2;
    camera.startFollow(player);
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);


    createCollision.call(this);
    createObjectAnimations.call(this);
    createKeys.call(this);

    addMusic.call(this);
    addSound.call(this);

}

function pickUpJewel(player, jewel) {
    jewel.disableBody(true, true);
    
}

function addMusic() {
    music.overground = this.sound.add("overgroundMusic", { loop: true, volume: 0.5 });
    music.underground = this.sound.add("undergroundMusic", { loop: true, volume: 0.5 });
}

function addSound() {
    sfx.jump = this.sound.add("jump", { loop: false, volume: 0.5 });
}

function update() {
    checkPlayerMovement();

    if (!music.underground.isPlaying && player.body.y < 256) {
        music.underground.play();
        music.overground.stop();
    } else if (!music.overground.isPlaying && player.body.y > 256) {
        music.overground.play();
        music.underground.stop();
    }
}

//***************** NON PHASER.SCENE FUNCTIONS ************//
//*************** CREATE FUNCTIONS*************************//

//Create the background image
function createBackground() {
    var background = this.add.image(256, 256, "background");
    background.setScale(2.2, 2.5);
}

//Create the player object from the playerSpawn location
function createPlayer(playerSpawn) {
    player = this.physics.add.sprite(playerSpawn.x, playerSpawn.y, 'player', 4);
    player.setCollideWorldBounds(true);
    player.maxJump = 2;

    createPlayerAnimations.call(this);
}



//Create the collision and overlap events
function createCollision() {

}

//Create the cursor keys
function createKeys() {
    cursors = this.input.keyboard.createCursorKeys();
}

//*************** ANIMATION FUNCTIONS*************************//

//Create the animations that the player will use
function createPlayerAnimations() {
    this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNumbers('player', {start: 5, end: 10}),
        frameRate: 15,
        repeat: -1
    });

    this.anims.create({
        key: 'idle',
        frames: this.anims.generateFrameNumbers('player', {frames: [1, 4]}),
        frameRate: 3,
        repeat: -1
    });

    this.anims.create({
        key: 'jump',
        frames: [{key: 'player', frame: 3}],
        frameRate: 15
    });

    this.anims.create({
        key: 'fall',
        frames: [{key: 'player', frame: 2}],
        frameRate: 15
    });
}

//Create the animations for any objects that are not the player or enemies
function createObjectAnimations() {

}

//*************** GAMEPLAY FUNCTIONS *************//

//Check for cursor key presses and move the player accordingly
function checkPlayerMovement() {
    //Right
    if (cursors.right.isDown) {
        player.setVelocityX(100);
        player.anims.play('walk', true);
        player.flipX = false;

        //Changes the size and position of the hitbox (no longer floating on your tail!)
        player.setSize(14, 24);
        player.setOffset(7, 0);
    }
    //Left
    else if (cursors.left.isDown) {
        player.setVelocityX(-100);
        player.anims.play('walk', true);
        player.flipX = true;

        //Changes the size and position of the hitbox (no longer floating on your tail!)
        player.setSize(14, 24);
        player.setOffset(3, 0);
    }
    //Down
    else if (cursors.down.isDown) {
        player.setVelocityX(0);
        player.anims.play('down', true);
    }
    //Idle
    else {
        player.setVelocityX(0);
        player.anims.play('idle', true);
    }

    //Reset jumpCount. Important for double jumping.
    if (cursors.space.isDown && player.body.blocked.down) {
        player.jumpCount = 0;
        player.setVelocityY(-200);
    }

    //Check for the spacebar having JUST been pressed, and whether the player has any jumps left - Important for double jumping.
    //Then, jump.
    if (Phaser.Input.Keyboard.JustDown(cursors.space) && player.jumpCount < player.maxJump) {
        player.jumpCount++;
        player.setVelocityY(-200);
        sfx.jump.play();
    }

    //Display jumping or falling animations
    if (player.body.velocity.y < 0) {
        player.anims.play('jump', true);
    } else if (player.body.velocity.y > 0) {
        player.anims.play('fall', true);
    }

    function onHit(player, skull) {
        if (false) {

        }
    }
}

function findPoints(map, layer, type) {
    var locs = map.filterObjects(layer, function (object) {
        if (object.type === type) {
            return object
        }
    });
    return locs
}

function resize() {
    var canvas = document.querySelector("canvas");
    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;
    var windowRatio = windowWidth / windowHeight;
    var gameRatio = game.config.width / game.config.height;
    if (windowRatio < gameRatio) {
        canvas.style.width = windowWidth + "px";
        canvas.style.height = (windowWidth / gameRatio) + "px";
    } else {
        canvas.style.width = (windowHeight * gameRatio) + "px";
        canvas.style.height = windowHeight + "px";
    }
    }