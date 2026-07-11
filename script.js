//เริ่มสร้างเกม

//ตั้งค่าหน้าจอเกม
let board;
let boardWidth = 900;
let boardHeight = 300;
let context;


//ตั้งค่าตัวละครเกม
let playerWidth = 85;
let playerHeight = 85;
let playerX = 50;
let playerY = 215;
let playerIme;
let player = {
    x: playerX,
    y: playerY,
    width: playerWidth,
    height: playerHeight
}
let score = 0;

//สร้างอุปสรรค
let boxWidth = 40;
let boxHeight = 80;
let boxX = 680;
let boxY = 225;

//สุ่มเอุปสรรค
const enemySrcs = ["aa2.jpg"];
let enemyImages = [];

// setting อุปสรรค
let boxesArray = [];
let boxSpeed = -3;
let boxIntervalId = null;

//Gravity & Velocity
let velocityY = 0;
let gravity = 0.25;

//menu state
const STATE = { MENU: "MENU", PLAYING: "PLAYING", GAME_OVER: "GAME_OVER", WIN: "WIN" };
let state = STATE.MENU;

//lives
const MAX_LIVES = 3;
let lives = MAX_LIVES;

//invincibility (brief flicker + immunity right after taking a hit)
let invincibleFrames = 0;
const INVINCIBLE_DURATION = 90; // ~1.5s at 60fps

//countdown timer
const GAME_DURATION = 60; // seconds, player wins if they survive this long
let timeLeft = GAME_DURATION;
let timerIntervalId = null;

const jumpSound = new Audio("soundd.mp3");
const gameOverSound = new Audio("ahri2.mp3");

console.log(player);

window.onload = function() {
    //Display
    board = document.getElementById('board');
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext('2d');

    //player
    playerIme = new Image();
    playerIme.src = "aaa1.webp";

    //อุปสรรค์
    for (let i = 0; i < enemySrcs.length; i++) {
        let file = enemySrcs[i];
        let img = new Image();
        img.src = file;
        enemyImages.push(img);
    }

    document.addEventListener("keydown", handleKeydown);
    board.addEventListener("click", handleClick);

    requestAnimationFrame(update);
}

//function Update
function update() {
    requestAnimationFrame(update); //Update Animation ตลอดเวลา

    context.clearRect(0, 0, board.width, board.height); //เคลียร์ภาพซ้อน

    switch (state) {
        case STATE.MENU:
            drawMenu();
            break;
        case STATE.PLAYING:
            updateGame();
            break;
        case STATE.GAME_OVER:
            drawGameOver();
            break;
        case STATE.WIN:
            drawWin();
            break;
    }
}

//หน้า menu
function drawMenu() {
    context.fillStyle = "rgba(10,5,30,0.78)";
    context.fillRect(0, 0, boardWidth, boardHeight);

    context.fillStyle = "white";
    context.textAlign = "center";
    context.font = "bold 44px Arial";
    context.fillText("โดเรม่อนช่วยด้วย", boardWidth / 2, boardHeight / 2 - 40);

    context.font = "normal 20px Arial";
    context.fillText("Press SPACE or click to start", boardWidth / 2, boardHeight / 2 + 10);

    context.font = "normal 16px Arial";
    context.fillText("You have " + MAX_LIVES + " lives. Survive " + GAME_DURATION + " seconds to win!", boardWidth / 2, boardHeight / 2 + 40);
}

function startGame() {
    //reset all run state
    player.y = playerY;
    velocityY = 0;
    boxesArray = [];
    score = 0;
    lives = MAX_LIVES;
    timeLeft = GAME_DURATION;
    invincibleFrames = 0;

    state = STATE.PLAYING;

    if (boxIntervalId) clearInterval(boxIntervalId);
    boxIntervalId = setInterval(createBox, 2000);

    if (timerIntervalId) clearInterval(timerIntervalId);
    timerIntervalId = setInterval(tickTimer, 1000);
}

function tickTimer() {
    if (state !== STATE.PLAYING) return;

    timeLeft--;
    if (timeLeft <= 0) {
        timeLeft = 0;
        triggerWin();
    }
}

function updateGame() {
    velocityY += gravity;

    //create play Object
    player.y = Math.min(player.y + velocityY, playerY);

    if (invincibleFrames > 0) {
        invincibleFrames--;
        //flicker effect while invincible
        context.globalAlpha = (Math.floor(invincibleFrames / 6) % 2 === 0) ? 0.3 : 1;
    }
    context.drawImage(playerIme, player.x, player.y, player.width, player.height);
    context.globalAlpha = 1;

    //Create Array Box
    for (let i = 0; i < boxesArray.length; i++) {
        let box = boxesArray[i];
        box.x += boxSpeed;
        context.drawImage(box.img, box.x, box.y, box.width, box.height);

        //ตรวจสอบเงื่อนไขการชนของอุปสรรค
        if (!box.hit && invincibleFrames <= 0 && onCollision(player, box)) {
            box.hit = true;
            lives--;
            invincibleFrames = INVINCIBLE_DURATION;

            if (lives <= 0) {
                triggerGameOver();
            }
        }
    }

    //นับคะแนน
    score++;

    //HUD
    context.fillStyle = "black";
    context.font = "normal 20px Arial";
    context.textAlign = "left";
    context.fillText("Score : " + score, 10, 30);
    context.fillText("Lives : " + lives, 10, 55);

    context.textAlign = "right";
    context.fillText("Time : " + timeLeft, boardWidth - 10, 30);
}

function triggerGameOver() {
    state = STATE.GAME_OVER;
    stopTimers();

    gameOverSound.currentTime = 0;
    gameOverSound.play();
}

function triggerWin() {
    state = STATE.WIN;
    stopTimers();
}

function stopTimers() {
    if (boxIntervalId) {
        clearInterval(boxIntervalId);
        boxIntervalId = null;
    }
    if (timerIntervalId) {
        clearInterval(timerIntervalId);
        timerIntervalId = null;
    }
}

function drawGameOver() {
    //keep last frame of the field visible
    for (let i = 0; i < boxesArray.length; i++) {
        let box = boxesArray[i];
        context.drawImage(box.img, box.x, box.y, box.width, box.height);
    }
    context.drawImage(playerIme, player.x, player.y, player.width, player.height);

    context.fillStyle = "rgba(10,5,30,0.78)";
    context.fillRect(0, 0, boardWidth, boardHeight);

    context.fillStyle = "white";
    context.textAlign = "center";
    context.font = "bold 40px Arial";
    context.fillText("Game Over!", boardWidth / 2, boardHeight / 2 - 20);

    context.font = "bold 26px Arial";
    context.fillText("Score : " + score, boardWidth / 2, boardHeight / 2 + 20);

    context.font = "normal 18px Arial";
    context.fillText("Press SPACE or click Restart to play again", boardWidth / 2, boardHeight / 2 + 55);
}

function drawWin() {
    context.drawImage(playerIme, player.x, player.y, player.width, player.height);

    context.fillStyle = "rgba(10,40,10,0.78)";
    context.fillRect(0, 0, boardWidth, boardHeight);

    context.fillStyle = "white";
    context.textAlign = "center";
    context.font = "bold 40px Arial";
    context.fillText("You Win!", boardWidth / 2, boardHeight / 2 - 20);

    context.font = "bold 26px Arial";
    context.fillText("Survived " + GAME_DURATION + " seconds with " + lives + " " + (lives === 1 ? "life" : "lives") + " left!", boardWidth / 2, boardHeight / 2 + 15);
    context.fillText("Score : " + score, boardWidth / 2, boardHeight / 2 + 45);

    context.font = "normal 18px Arial";
    context.fillText("Press SPACE or click Restart to play again", boardWidth / 2, boardHeight / 2 + 80);
}

// Function เคลื่อนตัวละคร / จัดการปุ่มกด
function handleKeydown(e) {
    if (e.code !== "Space") return;

    if (state === STATE.MENU) {
        startGame();
    } else if (state === STATE.PLAYING) {
        if (player.y == playerY) {
            velocityY = -10;
            jumpSound.currentTime = 0;
            jumpSound.play();
        }
    } else if (state === STATE.GAME_OVER || state === STATE.WIN) {
        startGame();
    }
}

function handleClick() {
    if (state === STATE.MENU || state === STATE.GAME_OVER || state === STATE.WIN) {
        startGame();
    } else if (state === STATE.PLAYING) {
        if (player.y == playerY) {
            velocityY = -10;
            jumpSound.currentTime = 0;
            jumpSound.play();
        }
    }
}

function createBox() {
    if (state !== STATE.PLAYING) {
        return;
    }

    let randomImg = enemyImages[Math.floor(Math.random() * enemyImages.length)];

    let box = {
        img: randomImg,
        x: boxX,
        y: boxY,
        width: boxWidth,
        height: boxHeight,
        hit: false
    }

    boxesArray.push(box);

    if (boxesArray.length > 5) {
        boxesArray.shift();
    }
}

function onCollision(obj1, obj2) {
    return obj1.x < (obj2.x + obj2.width) &&
        (obj1.x + obj1.width) > obj2.x //ชนกันในแนวนอน
        &&
        obj1.y < (obj2.y + obj2.height) &&
        (obj1.y + obj1.height) > obj2.y //ชนกันในแนวตั้ง
}

//restart game
function restartGame() {
    stopTimers();
    boxesArray = [];
    player.y = playerY;
    velocityY = 0;
    state = STATE.MENU;
}