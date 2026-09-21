document.addEventListener('DOMContentLoaded', () => {
    // Intersection Observer for scroll animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatedSections = document.querySelectorAll('.fade-in-scroll');
    animatedSections.forEach(section => {
        observer.observe(section);
    });

    // Custom Cursor Logic
    const cursorDot = document.getElementById('cursor-dot');
    const cursorRing = document.getElementById('cursor-ring');
    
    if (cursorDot && cursorRing) {
        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let ringX = window.innerWidth / 2;
        let ringY = window.innerHeight / 2;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            
            cursorDot.style.left = `${mouseX}px`;
            cursorDot.style.top = `${mouseY}px`;
        });

        // Add hover effect for interactive elements
        const updateInteractables = () => {
            const interactables = document.querySelectorAll('a, button, input, .stat-box, canvas');
            interactables.forEach(el => {
                // Remove first to avoid duplicates
                el.removeEventListener('mouseenter', addHoverState);
                el.removeEventListener('mouseleave', removeHoverState);
                
                el.addEventListener('mouseenter', addHoverState);
                el.addEventListener('mouseleave', removeHoverState);
            });
        };

        const addHoverState = () => document.body.classList.add('cursor-hover');
        const removeHoverState = () => document.body.classList.remove('cursor-hover');

        updateInteractables();
        // Also observe DOM changes if needed later, but simple call is fine here

        function animateCursor() {
            ringX += (mouseX - ringX) * 0.15;
            ringY += (mouseY - ringY) * 0.15;
            
            cursorRing.style.left = `${ringX}px`;
            cursorRing.style.top = `${ringY}px`;
            
            requestAnimationFrame(animateCursor);
        }
        requestAnimationFrame(animateCursor);
    }

    // Buy Button Interaction (deadpan luxury touch)
    const buyButton = document.getElementById('purchase-btn');
    if (buyButton) {
        buyButton.addEventListener('click', () => {
            const originalText = buyButton.innerText;
            buyButton.innerText = 'Authenticating Wealth...';
            buyButton.style.backgroundColor = 'var(--text-secondary)';
            buyButton.style.color = 'var(--bg-color)';
            buyButton.style.pointerEvents = 'none';

            setTimeout(() => {
                buyButton.innerText = 'Added to Vault';
                buyButton.style.backgroundColor = '#2c5e3b'; // Subtle green for success
                buyButton.style.color = 'var(--text-primary)';
                
                setTimeout(() => {
                    buyButton.innerText = originalText;
                    buyButton.style.backgroundColor = 'var(--accent-color)';
                    buyButton.style.pointerEvents = 'auto';
                }, 3000);
            }, 1500);
        });
    }

    // Hero 3D Brick Mouse Tilt Removed for Background Video

    // Craft Section Sticky Brick Scroll Animation
    const craftSection = document.querySelector('.craft-section');
    const scrollBrickScene = document.querySelector('.scroll-brick-scene');
    
    if (craftSection && scrollBrickScene) {
        window.addEventListener('scroll', () => {
            const rect = craftSection.getBoundingClientRect();
            
            // Check if section is in viewport
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                // Calculate scroll progress (0 to 1) based on section visibility
                const scrolledPast = window.innerHeight - rect.top;
                const totalScroll = rect.height + window.innerHeight;
                const progress = Math.max(0, Math.min(1, scrolledPast / totalScroll));
                
                // Animate rotation based on progress
                // Starts at 45deg Y, spins completely twice (+720deg)
                const rotateY = 45 + (progress * 720); 
                // Pitch up and down subtly
                const rotateX = -20 + (Math.sin(progress * Math.PI * 4) * 30);
                
                scrollBrickScene.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            }
        });
    }

    // Stack Game Logic
    const canvas = document.getElementById('stack-game');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const overlay = document.getElementById('game-overlay');
        const actionBtn = document.getElementById('game-action-btn');
        const overlayTitle = document.getElementById('overlay-title');
        const scoreEl = document.getElementById('current-score');
        const bestScoreEl = document.getElementById('best-score');
        const toast = document.getElementById('toast-notification');
        
        const CANVAS_WIDTH = canvas.width;
        const CANVAS_HEIGHT = canvas.height;
        const BRICK_HEIGHT = 40;
        const INITIAL_BRICK_WIDTH = 120;
        const BRICK_COLOR = '#9c3b26';
        const BACKGROUND_COLOR = '#1a1816';
        
        let boxes = [];
        let currentBox = null;
        let cameraY = 0;
        let score = 0;
        let bestScore = parseInt(localStorage.getItem('brickBestScore')) || 0;
        bestScoreEl.innerText = bestScore;
        
        let gameState = 'ready';
        let speed = 4;
        let xDirection = 1;
        let discountUnlocked = localStorage.getItem('brickDiscountUnlocked') === 'true';

        function initGame() {
            boxes = [];
            score = 0;
            speed = 4;
            cameraY = 0;
            scoreEl.innerText = score;
            
            // Base platform
            boxes.push({
                x: CANVAS_WIDTH / 2 - INITIAL_BRICK_WIDTH / 2,
                y: CANVAS_HEIGHT - BRICK_HEIGHT,
                width: INITIAL_BRICK_WIDTH,
                color: '#6c291a'
            });
            
            spawnBox();
            gameState = 'playing';
            overlay.classList.add('hidden');
            gameLoop();
        }
        
        function spawnBox() {
            const lastBox = boxes[boxes.length - 1];
            currentBox = {
                x: 0,
                y: CANVAS_HEIGHT - BRICK_HEIGHT - (boxes.length * BRICK_HEIGHT),
                width: lastBox.width,
                color: BRICK_COLOR
            };
            xDirection = Math.random() > 0.5 ? 1 : -1;
            currentBox.x = xDirection === 1 ? -currentBox.width : CANVAS_WIDTH;
        }
        
        function dropBox() {
            if (gameState !== 'playing') return;
            
            const lastBox = boxes[boxes.length - 1];
            let overlap = currentBox.width;
            
            if (currentBox.x > lastBox.x + lastBox.width || currentBox.x + currentBox.width < lastBox.x) {
                overlap = 0; // Missed
            } else {
                const leftCut = Math.max(0, lastBox.x - currentBox.x);
                const rightCut = Math.max(0, (currentBox.x + currentBox.width) - (lastBox.x + lastBox.width));
                
                overlap = currentBox.width - leftCut - rightCut;
                currentBox.width = overlap;
                currentBox.x += leftCut;
            }
            
            if (overlap <= 0) {
                gameOver();
                return;
            }
            
            boxes.push({...currentBox});
            score++;
            scoreEl.innerText = score;
            speed += 0.3; // increase speed per level
            
            if (score > bestScore) {
                bestScore = score;
                bestScoreEl.innerText = bestScore;
                localStorage.setItem('brickBestScore', bestScore);
            }
            
            if (score >= 10 && !discountUnlocked) {
                discountUnlocked = true;
                localStorage.setItem('brickDiscountUnlocked', 'true');
                showToast();
                updateBuySection();
            }
            
            if (boxes.length * BRICK_HEIGHT > CANVAS_HEIGHT / 2) {
                cameraY = (boxes.length * BRICK_HEIGHT) - (CANVAS_HEIGHT / 2) + BRICK_HEIGHT;
            }
            
            spawnBox();
        }
        
        function gameOver() {
            gameState = 'over';
            overlay.classList.remove('hidden');
            overlayTitle.innerText = 'Stack Collapsed';
            actionBtn.innerText = 'Rebuild';
            draw();
        }
        
        function showToast() {
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 5000);
        }
        
        function updateBuySection() {
            window.dispatchEvent(new Event('brickDiscountUnlocked'));
        }
        
        if (discountUnlocked) {
            updateBuySection();
        }
        
        function update() {
            if (gameState !== 'playing') return;
            
            currentBox.x += speed * xDirection;
            
            if (currentBox.x <= 0) {
                currentBox.x = 0;
                xDirection = 1;
            } else if (currentBox.x + currentBox.width >= CANVAS_WIDTH) {
                currentBox.x = CANVAS_WIDTH - currentBox.width;
                xDirection = -1;
            }
        }
        
        function draw() {
            ctx.fillStyle = BACKGROUND_COLOR;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            
            boxes.forEach(box => {
                ctx.fillStyle = box.color;
                const drawY = box.y + cameraY;
                if (drawY > CANVAS_HEIGHT) return;
                
                ctx.fillRect(box.x, drawY, box.width, BRICK_HEIGHT);
                ctx.fillStyle = 'rgba(255,255,255,0.1)';
                ctx.fillRect(box.x, drawY, box.width, 2);
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(box.x, drawY + BRICK_HEIGHT - 4, box.width, 4);
                
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                for (let i = box.x + 10; i < box.x + box.width; i += 20) {
                    ctx.fillRect(i, drawY, 2, BRICK_HEIGHT);
                }
            });
            
            if (gameState === 'playing' && currentBox) {
                ctx.fillStyle = currentBox.color;
                const drawY = currentBox.y + cameraY;
                ctx.fillRect(currentBox.x, drawY, currentBox.width, BRICK_HEIGHT);
                
                ctx.fillStyle = 'rgba(255,255,255,0.1)';
                ctx.fillRect(currentBox.x, drawY, currentBox.width, 2);
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(currentBox.x, drawY + BRICK_HEIGHT - 4, currentBox.width, 4);
            }
        }
        
        function gameLoop() {
            if (gameState === 'playing') {
                update();
                draw();
                requestAnimationFrame(gameLoop);
            }
        }
        
        draw();
        
        actionBtn.addEventListener('click', initGame);
        canvas.addEventListener('mousedown', dropBox);
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                if (gameState === 'playing') {
                    e.preventDefault();
                    dropBox();
                } else if (gameState === 'over' || gameState === 'ready') {
                    e.preventDefault();
                    initGame();
                }
            }
        });
    }


    // Pricing & Purchase Logic
    const originalPrice = 499;
    const discountRate = 0.9;
    let quantity = 1;
    let hasDiscount = localStorage.getItem('brickDiscountUnlocked') === 'true';

    const stepperMinus = document.getElementById('stepper-minus');
    const stepperPlus = document.getElementById('stepper-plus');
    const quantityDisplay = document.getElementById('quantity-display');
    const livePriceEl = document.getElementById('live-price');
    const originalPriceEl = document.getElementById('original-price');
    const purchaseBtn = document.getElementById('purchase-btn');

    function updatePricing() {
        if (!livePriceEl) return;
        
        const baseTotal = originalPrice * quantity;
        if (hasDiscount) {
            const discountedTotal = Math.floor(baseTotal * discountRate);
            originalPriceEl.innerText = `$${baseTotal}`;
            livePriceEl.innerText = discountedTotal;
        } else {
            originalPriceEl.innerText = '';
            livePriceEl.innerText = baseTotal;
        }
    }

    if (stepperMinus && stepperPlus && quantityDisplay) {
        stepperMinus.addEventListener('click', () => {
            if (quantity > 1) {
                quantity--;
                quantityDisplay.innerText = quantity;
                updatePricing();
            }
        });

        stepperPlus.addEventListener('click', () => {
            if (quantity < 99) {
                quantity++;
                quantityDisplay.innerText = quantity;
                updatePricing();
            }
        });
    }

    window.addEventListener('brickDiscountUnlocked', () => {
        hasDiscount = true;
        updatePricing();
    });

    updatePricing();

    // Particle Burst on Purchase
    if (purchaseBtn) {
        purchaseBtn.addEventListener('click', (e) => {
            // Button state swap
            const originalText = purchaseBtn.innerText;
            purchaseBtn.innerText = 'Reserved. Excellent Choice.';
            purchaseBtn.style.pointerEvents = 'none';
            purchaseBtn.style.backgroundColor = '#4CAF50';
            purchaseBtn.style.color = '#fff';

            setTimeout(() => {
                purchaseBtn.innerText = originalText;
                purchaseBtn.style.pointerEvents = 'auto';
                purchaseBtn.style.backgroundColor = '';
                purchaseBtn.style.color = '';
            }, 3000);

            // Trigger particles
            const rect = purchaseBtn.getBoundingClientRect();
            // ClientX/Y of the mouse, or center of the button if accessed via keyboard
            const centerX = e.clientX || rect.left + rect.width / 2;
            const centerY = e.clientY || rect.top + rect.height / 2;

            for (let i = 0; i < 40; i++) {
                const particle = document.createElement('div');
                particle.classList.add('particle');
                
                // Random outward position and rotation
                const angle = Math.random() * Math.PI * 2;
                const velocity = 30 + Math.random() * 120;
                const tx = Math.cos(angle) * velocity;
                const ty = Math.sin(angle) * velocity - 30; // slight upward bias
                const rot = (Math.random() - 0.5) * 720;
                
                // Set CSS custom properties for the keyframe
                particle.style.setProperty('--tx', `${tx}px`);
                particle.style.setProperty('--ty', `${ty}px`);
                particle.style.setProperty('--rot', `${rot}deg`);
                
                // Random sizes
                const size = 3 + Math.random() * 6;
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
                
                // Position fixed over screen exactly where clicked
                particle.style.left = `${centerX}px`;
                particle.style.top = `${centerY}px`;
                
                document.body.appendChild(particle);
                
                // Cleanup after animation completes
                setTimeout(() => {
                    particle.remove();
                }, 800);
            }
        });
    }
});
