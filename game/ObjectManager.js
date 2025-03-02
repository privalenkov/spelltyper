import { Sprite, Assets } from 'pixi.js';
import Matter from 'matter-js';

export class ObjectManager {
    constructor(renderer, physics) {
        this.renderer = renderer;
        this.physics = physics;
        this.objects = [];
        this.activeObject = null;
        this.wordToSprite = {
            "яблоко": "/assets/ui/apple.png",
            "вода": "/assets/ui/water.png",
            "огонь": "/assets/ui/fire.png"
        };

        window.addEventListener("mousemove", (e) => this.onMouseMove(e));
        window.addEventListener("mousedown", () => this.onMouseDown());
    }

    async spawnObject(word) {
        if (!this.wordToSprite[word]) return;

        const texture = await Assets.load(this.wordToSprite[word]);
        const sprite = new Sprite(texture);
        sprite.width = 50;
        sprite.height = 50;
        sprite.anchor.set(0.5, 0.5);

        const centerX = this.renderer.app.screen.width / 2;
        const startY = 180;

        sprite.x = centerX;
        sprite.y = startY;

        const body = Matter.Bodies.circle(centerX, startY, 25, { restitution: 0.5, density: 0.001 });
        Matter.Body.setStatic(body, true);
        this.physics.addBody(body);

        const objectData = { sprite, body, centerX, targetX: centerX, isMoving: true };
        this.objects.push(objectData);
        this.renderer.stage.addChild(sprite);
        this.activeObject = objectData;
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
        this.objects.forEach(({ sprite, body, isMoving, targetX }) => {
            if (isMoving) {
                // Сглаженное движение к курсору
                sprite.x += (targetX - sprite.x) * 0.15;
                Matter.Body.setPosition(body, { x: sprite.x, y: body.position.y });
            } else {
                sprite.x = body.position.x;
                sprite.y = body.position.y;
                sprite.rotation = body.angle;
            }
        });
    }
}
