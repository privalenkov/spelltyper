import { Sprite, Assets, Ticker } from 'pixi.js';
import Matter from 'matter-js';
import { v4 as uuidv4 } from 'uuid';

export class ObjectManager {
    constructor(renderer, physics, wordInput, scoreManager, webSocket) {
        this.renderer = renderer;
        this.physics = physics;
        this.wordInput = wordInput;
        this.scoreManager = scoreManager;
        this.objects = [];
        this.activeObject = null;
        this.webSocket = webSocket;
        this.isGameOver = false;
        this.collidedPairs = new Set();

        Matter.Events.on(this.physics.engine, 'collisionStart', (event) => this.handleCollisions(event));
        window.addEventListener("mousemove", (e) => this.onMouseMove(e));
        window.addEventListener("mousedown", () => this.onMouseDown());
    }

    async spawnObject(wordData, position = null, isNew) {
        if (!wordData?.sprite) return;
        const texture = await Assets.load(`/assets/ui/${wordData.sprite}`);
        const sprite = new Sprite(texture);
        sprite.width = 140;
        sprite.height = 140;
        sprite.anchor.set(0.5, 0.5);


        const spawnX = !isNew ? position.x : this.renderer.app.screen.width / 2;
        const spawnY = !isNew ? position.y : 180;
    
        sprite.x = spawnX;
        sprite.y = spawnY;
    
        const body = Matter.Bodies.circle(spawnX, spawnY, 50, { restitution: 0.2, density: 0.001 });
        if (isNew) Matter.Body.setStatic(body, true);
        this.physics.addBody(body);
    
        const objectData = {
            instanceId: uuidv4(),
            sprite,
            body,
            wordData,
            centerX: spawnX,
            targetX: spawnX,
            isMoving: position ? false : true
        };
        this.objects.push(objectData);
        this.renderer.stage.addChild(sprite);
        if (isNew) this.activeObject = objectData;
    }

    onMouseMove(event) {
        if (!this.activeObject) return;

        // Ограничиваем движение в пределах ±150 пикселей от центра
        const minX = this.activeObject.centerX - 150;
        const maxX = this.activeObject.centerX + 150;
        this.activeObject.targetX = Math.min(maxX, Math.max(minX, event.clientX));
    }

    onMouseDown() {
        if (!this.activeObject) return;

        Matter.Body.setStatic(this.activeObject.body, false);
        this.activeObject.isMoving = false;
        this.activeObject = null;
    }

    updateObjects() {
        if (this.isGameOver) return;
        let isAnyObjectMoving = false;
        const velocityThreshold = 0.1;

        this.objects.forEach(({ sprite, body, isMoving, targetX }) => {
            if (isMoving) {
                // Сглаженное движение к курсору
                sprite.x += (targetX - sprite.x) * 0.15;
                Matter.Body.setPosition(body, { x: sprite.x, y: body.position.y });
            } else {
                const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
                if (speed > velocityThreshold) {
                    isAnyObjectMoving = true;
                }

                sprite.x = body.position.x;
                sprite.y = body.position.y;
                sprite.rotation = body.angle;

                // ✅ Если объект упал ниже экрана — завершаем игру
                if (sprite.y > this.renderer.app.screen.height + 50) {
                    this.endGame();
                }
            }
        });

        const shouldBlockInput = isAnyObjectMoving || this.wordInput.isAnimating() || this.activeObject;
        this.wordInput.setIsBlockedInput(shouldBlockInput);
    }

    animateMerge(instanceIds, collisionPoint, callback) {
        this.wordInput.setIsBlockedInput(false);
        const mergingObjects = this.objects.filter(obj => instanceIds.includes(obj.instanceId));
    
        if (mergingObjects.length < 2) {
            callback();
            return;
        }
    
        let mergedCount = 0;
        const duration = 100; // 🔥 Время анимации в миллисекундах
        const fadeSpeed = 1; // 🔥 Скорость исчезновения
        const startTime = performance.now();
    
        const ticker = new Ticker();
        ticker.add(() => {
            const currentTime = performance.now();
            const progress = Math.min((currentTime - startTime) / duration, 1); // 🔥 Процент завершения (0 → 1)
    
            mergingObjects.forEach(obj => {
                if (!obj.sprite) return;
    
                // ✅ Центрируем спрайты (если не было)
                obj.sprite.anchor.set(0.5, 0.5);
    
                // 🔥 Линейное движение к точке столкновения
                obj.sprite.x = obj.startX + (collisionPoint.x - obj.startX) * progress;
                obj.sprite.y = obj.startY + (collisionPoint.y - obj.startY) * progress;
    
                // 🔥 Fade-out начинается только в конце пути
                if (progress > 0.8) {
                    obj.sprite.alpha -= fadeSpeed * 0.1; // 🔥 Коррекция, чтобы alpha уменьшалась плавно
                }
    
                // 🔥 Когда объект полностью исчезает, удаляем его
                if (obj.sprite.alpha <= 0) {
                    this.renderer.stage.removeChild(obj.sprite);
                    Matter.World.remove(this.physics.world, obj.body);
                    mergedCount++;
                }
            });
    
            // ✅ Останавливаем Ticker после завершения анимации
            if (mergedCount === mergingObjects.length) {
                ticker.stop(); // Останавливаем Ticker
                console.log("✅ Анимация слияния завершена!");
                callback();
            }
        });
    
        // ✅ Запоминаем стартовые координаты перед началом движения
        mergingObjects.forEach(obj => {
            obj.startX = obj.sprite.x;
            obj.startY = obj.sprite.y;
        });
    
        ticker.start(); // 🔥 Запускаем анимацию
    }

    handleCollisions(event) {
        const pair = event.pairs[0];
        const objA = this.objects.find(o => o.body === pair.bodyA);
        const objB = this.objects.find(o => o.body === pair.bodyB);

        if (objA && objB && !this.collidedPairs.has(`${objA.instanceId}-${objB.instanceId}`)) {
            this.collidedPairs.add(`${objA.instanceId}-${objB.instanceId}`);
            this.collidedPairs.add(`${objB.instanceId}-${objA.instanceId}`); // 🔥 Обратное добавление

            
            
            if (this.canCombine(objA, objB)) {
                const collisionPoint = {
                    x: (objA.body.position.x + objB.body.position.x) / 2,
                    y: (objA.body.position.y + objB.body.position.y) / 2
                };
                
                Matter.Body.setStatic(objA.body, true);
                Matter.Body.setStatic(objB.body, true);

                this.webSocket.checkCombination(
                    [objA.wordData.guid, objB.wordData.guid],
                    [objA.instanceId, objB.instanceId],
                    collisionPoint
                );
            }
        }
    }

    checkCollisions() {
        const objectsToRemove = new Set();
    
        for (let i = 0; i < this.objects.length; i++) {
            for (let j = i + 1; j < this.objects.length; j++) {
                const objA = this.objects[i];
                const objB = this.objects[j];
    
                if (!objA?.body || !objB?.body) continue;
                if (objectsToRemove.has(objA) || objectsToRemove.has(objB)) continue; // 🔥 Игнорируем уже удаляемые объекты
    
                if (Matter.Collision.collides(objA.body, objB.body)) {
                    if (this.canCombine(objA, objB)) {
                        objectsToRemove.add(objA);
                        objectsToRemove.add(objB);
                        this.webSocket.checkCombination(
                            [objA.wordData.guid, objB.wordData.guid], 
                            [objA.instanceId, objB.instanceId] 
                        );
                    }
                }
            }
        }
    
        // 🔥 Удаляем объекты перед следующим обновлением
        objectsToRemove.forEach(obj => {
            this.removeObject(obj);
        });
    }

    removeObject(obj) {
        this.objects = this.objects.filter(o => o !== obj);
        this.renderer.stage.removeChild(obj.sprite);
        Matter.World.remove(this.physics.world, obj.body);
    }

    canCombine(objA, objB) {
        return objA.wordData.combinationGuids.includes(objB.wordData.guid);
    }    
    
    replaceObjectsWithNew(instanceIds, newObjectData, collisionPoint) {
        this.animateMerge(instanceIds, collisionPoint, () => {
            this.objects = this.objects.filter(obj => !instanceIds.includes(obj.instanceId));
    
            setTimeout(() => {
                this.spawnObject(newObjectData, collisionPoint, false);
            }, 100); // Небольшая задержка перед спавном нового объекта
        });
    }
    
    endGame() {
        if (this.isGameOver) return;
        this.isGameOver = true;

        // Очищаем текущее слово перед началом удаления объектов
        this.wordInput.clearWord();

        // Сначала удаляем объекты, потом спрашиваем имя
        this.clearObjects(() => {
            setTimeout(() => {
                const username = prompt("Введите ваше имя:");
                if (username) {
                    this.scoreManager.submitScore(username);
                }
                this.scoreManager.resetScore();
                this.isGameOver = false;
            }, 200); // Небольшая задержка, чтобы `prompt` не сработал сразу после анимации
        });
    }

    clearObjects(onComplete) {
        let delay = 0;
        const interval = 1000;
        const totalObjects = this.objects.length;

        this.objects.forEach(({ sprite, body }, index) => {
            setTimeout(() => {
                this.renderer.stage.removeChild(sprite);
                Matter.World.remove(this.physics.world, body);

                // Если это последний объект — вызываем onComplete
                if (index === totalObjects - 1 && onComplete) {
                    onComplete();
                }
            }, delay);
            delay += interval;
        });

        setTimeout(() => {
            this.objects = [];
        }, totalObjects * interval);
    }
}
