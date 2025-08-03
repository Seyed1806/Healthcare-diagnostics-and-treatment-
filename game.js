class FlappyBird {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Game state
        this.gameState = 'menu'; // menu, playing, gameOver
        this.score = 0;
        this.highScore = localStorage.getItem('flappyBirdHighScore') || 0;
        this.gravity = 0.5;
        this.jumpPower = -12;
        
        // Bird properties
        this.bird = {
            x: 150,
            y: this.height / 2,
            velocity: 0,
            size: 30,
            rotation: 0,
            flapWings: 0
        };
        
        // Pipes
        this.pipes = [];
        this.pipeWidth = 80;
        this.pipeGap = 200;
        this.pipeSpeed = 3;
        this.pipeSpawnTimer = 0;
        this.pipeSpawnInterval = 120;
        
        // Visual effects
        this.particles = [];
        this.clouds = [];
        this.backgroundOffset = 0;
        this.groundOffset = 0;
        
        // Colors and gradients
        this.colors = {
            sky: ['#87CEEB', '#98FB98'],
            bird: ['#FFD700', '#FFA500', '#FF6347'],
            pipe: ['#228B22', '#32CD32', '#90EE90'],
            ground: ['#8B4513', '#A0522D', '#CD853F']
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateHighScoreDisplay();
        this.createInitialClouds();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleInput();
            }
        });
        
        // Mouse/touch controls
        this.canvas.addEventListener('click', () => this.handleInput());
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleInput();
        });
        
        // Button controls
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('restartButton').addEventListener('click', () => this.startGame());
        document.getElementById('playAgainButton').addEventListener('click', () => this.startGame());
    }
    
    handleInput() {
        if (this.gameState === 'menu') {
            this.startGame();
        } else if (this.gameState === 'playing') {
            this.bird.velocity = this.jumpPower;
            this.bird.flapWings = 10;
            this.createFlapParticles();
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.bird.y = this.height / 2;
        this.bird.velocity = 0;
        this.bird.rotation = 0;
        this.pipes = [];
        this.particles = [];
        this.pipeSpawnTimer = 0;
        this.updateScoreDisplay();
        
        document.getElementById('startButton').style.display = 'none';
        document.getElementById('restartButton').style.display = 'none';
        document.getElementById('gameOverScreen').style.display = 'none';
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('flappyBirdHighScore', this.highScore);
            this.updateHighScoreDisplay();
        }
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalHighScore').textContent = this.highScore;
        document.getElementById('gameOverScreen').style.display = 'flex';
        document.getElementById('restartButton').style.display = 'inline-block';
        
        this.createExplosionParticles();
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // Update bird
        this.bird.velocity += this.gravity;
        this.bird.y += this.bird.velocity;
        this.bird.rotation = Math.min(Math.PI / 2, Math.max(-Math.PI / 4, this.bird.velocity * 0.1));
        this.bird.flapWings = Math.max(0, this.bird.flapWings - 1);
        
        // Update pipes
        this.pipeSpawnTimer++;
        if (this.pipeSpawnTimer >= this.pipeSpawnInterval) {
            this.spawnPipe();
            this.pipeSpawnTimer = 0;
        }
        
        this.pipes.forEach(pipe => {
            pipe.x -= this.pipeSpeed;
        });
        
        // Remove off-screen pipes
        this.pipes = this.pipes.filter(pipe => pipe.x > -this.pipeWidth);
        
        // Update particles
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // gravity
            particle.life--;
        });
        this.particles = this.particles.filter(particle => particle.life > 0);
        
        // Update clouds
        this.clouds.forEach(cloud => {
            cloud.x -= 0.5;
        });
        this.clouds = this.clouds.filter(cloud => cloud.x > -100);
        
        // Spawn new clouds
        if (Math.random() < 0.005) {
            this.createCloud();
        }
        
        // Update background parallax
        this.backgroundOffset = (this.backgroundOffset + 0.5) % this.width;
        this.groundOffset = (this.groundOffset + this.pipeSpeed) % 50;
        
        // Check collisions
        this.checkCollisions();
        
        // Check if bird hits boundaries
        if (this.bird.y < 0 || this.bird.y > this.height) {
            this.gameOver();
        }
    }
    
    spawnPipe() {
        const gapY = Math.random() * (this.height - this.pipeGap - 100) + 50;
        this.pipes.push({
            x: this.width,
            gapY: gapY,
            passed: false
        });
    }
    
    checkCollisions() {
        this.pipes.forEach(pipe => {
            // Check if bird passed pipe
            if (!pipe.passed && pipe.x + this.pipeWidth < this.bird.x) {
                pipe.passed = true;
                this.score++;
                this.updateScoreDisplay();
                this.createScoreParticles();
            }
            
            // Check collision with pipes
            if (this.bird.x + this.bird.size > pipe.x && 
                this.bird.x - this.bird.size < pipe.x + this.pipeWidth) {
                
                if (this.bird.y - this.bird.size < pipe.gapY || 
                    this.bird.y + this.bird.size > pipe.gapY + this.pipeGap) {
                    this.gameOver();
                }
            }
        });
    }
    
    createFlapParticles() {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: this.bird.x - 15,
                y: this.bird.y + Math.random() * 20 - 10,
                vx: -Math.random() * 3 - 1,
                vy: Math.random() * 4 - 2,
                life: 20,
                color: `hsl(${Math.random() * 60 + 30}, 70%, 60%)`
            });
        }
    }
    
    createScoreParticles() {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: this.bird.x + Math.random() * 40 - 20,
                y: this.bird.y + Math.random() * 40 - 20,
                vx: Math.random() * 6 - 3,
                vy: -Math.random() * 4 - 2,
                life: 30,
                color: `hsl(${Math.random() * 60 + 120}, 70%, 60%)`
            });
        }
    }
    
    createExplosionParticles() {
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: this.bird.x,
                y: this.bird.y,
                vx: Math.random() * 10 - 5,
                vy: Math.random() * 10 - 5,
                life: 60,
                color: `hsl(${Math.random() * 60 + 15}, 70%, 60%)`
            });
        }
    }
    
    createCloud() {
        this.clouds.push({
            x: this.width + Math.random() * 100,
            y: Math.random() * (this.height / 2),
            size: Math.random() * 30 + 20,
            opacity: Math.random() * 0.3 + 0.2
        });
    }
    
    createInitialClouds() {
        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                x: Math.random() * this.width,
                y: Math.random() * (this.height / 2),
                size: Math.random() * 30 + 20,
                opacity: Math.random() * 0.3 + 0.2
            });
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw sky gradient
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        skyGradient.addColorStop(0, this.colors.sky[0]);
        skyGradient.addColorStop(1, this.colors.sky[1]);
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw clouds
        this.drawClouds();
        
        // Draw background mountains
        this.drawMountains();
        
        // Draw pipes
        this.drawPipes();
        
        // Draw ground
        this.drawGround();
        
        // Draw particles
        this.drawParticles();
        
        // Draw bird
        this.drawBird();
        
        // Draw UI elements
        if (this.gameState === 'playing') {
            this.drawScore();
        }
    }
    
    drawClouds() {
        this.clouds.forEach(cloud => {
            this.ctx.save();
            this.ctx.globalAlpha = cloud.opacity;
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            
            // Draw cloud shape
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.size * 0.5, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
            this.ctx.arc(cloud.x - cloud.size * 0.5, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
            this.ctx.arc(cloud.x, cloud.y - cloud.size * 0.3, cloud.size * 0.6, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }
    
    drawMountains() {
        this.ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.height - 100);
        
        for (let x = 0; x <= this.width; x += 50) {
            const y = this.height - 100 + Math.sin(x * 0.01 + this.backgroundOffset * 0.01) * 20;
            this.ctx.lineTo(x, y);
        }
        
        this.ctx.lineTo(this.width, this.height);
        this.ctx.lineTo(0, this.height);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawPipes() {
        this.pipes.forEach(pipe => {
            // Pipe gradient
            const pipeGradient = this.ctx.createLinearGradient(pipe.x, 0, pipe.x + this.pipeWidth, 0);
            pipeGradient.addColorStop(0, this.colors.pipe[0]);
            pipeGradient.addColorStop(0.5, this.colors.pipe[1]);
            pipeGradient.addColorStop(1, this.colors.pipe[2]);
            
            // Top pipe
            this.ctx.fillStyle = pipeGradient;
            this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.gapY);
            
            // Bottom pipe
            this.ctx.fillRect(pipe.x, pipe.gapY + this.pipeGap, this.pipeWidth, this.height - pipe.gapY - this.pipeGap);
            
            // Pipe caps
            this.ctx.fillStyle = this.colors.pipe[1];
            this.ctx.fillRect(pipe.x - 5, pipe.gapY - 20, this.pipeWidth + 10, 20);
            this.ctx.fillRect(pipe.x - 5, pipe.gapY + this.pipeGap, this.pipeWidth + 10, 20);
            
            // Pipe highlights
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(pipe.x + 5, 0, 10, pipe.gapY);
            this.ctx.fillRect(pipe.x + 5, pipe.gapY + this.pipeGap, 10, this.height - pipe.gapY - this.pipeGap);
        });
    }
    
    drawGround() {
        const groundGradient = this.ctx.createLinearGradient(0, this.height - 50, 0, this.height);
        groundGradient.addColorStop(0, this.colors.ground[0]);
        groundGradient.addColorStop(0.5, this.colors.ground[1]);
        groundGradient.addColorStop(1, this.colors.ground[2]);
        
        this.ctx.fillStyle = groundGradient;
        this.ctx.fillRect(0, this.height - 50, this.width, 50);
        
        // Ground texture
        this.ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
        for (let x = 0; x < this.width; x += 20) {
            const y = this.height - 50 + Math.sin(x * 0.1 + this.groundOffset * 0.1) * 5;
            this.ctx.fillRect(x, y, 15, 3);
        }
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.life / 60;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }
    
    drawBird() {
        this.ctx.save();
        this.ctx.translate(this.bird.x, this.bird.y);
        this.ctx.rotate(this.bird.rotation);
        
        // Bird body gradient
        const birdGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, this.bird.size);
        birdGradient.addColorStop(0, this.colors.bird[0]);
        birdGradient.addColorStop(0.7, this.colors.bird[1]);
        birdGradient.addColorStop(1, this.colors.bird[2]);
        
        // Bird body
        this.ctx.fillStyle = birdGradient;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, this.bird.size, this.bird.size * 0.8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Bird wings
        const wingFlap = Math.sin(this.bird.flapWings * 0.5) * 0.3;
        this.ctx.fillStyle = this.colors.bird[1];
        this.ctx.beginPath();
        this.ctx.ellipse(-10, -5 + wingFlap * 10, 8, 15, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Bird eye
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(8, -5, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Bird beak
        this.ctx.fillStyle = '#FF4500';
        this.ctx.beginPath();
        this.ctx.moveTo(15, 0);
        this.ctx.lineTo(25, -3);
        this.ctx.lineTo(25, 3);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawScore() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = 'bold 48px Orbitron';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 4;
        this.ctx.fillText(this.score.toString(), this.width / 2, 100);
        this.ctx.restore();
    }
    
    updateScoreDisplay() {
        document.getElementById('score').textContent = this.score;
    }
    
    updateHighScoreDisplay() {
        document.getElementById('highScore').textContent = this.highScore;
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new FlappyBird();
});