import { Sprite, Assets } from 'pixi.js';
import Matter from 'matter-js';

export class ObjectManager {
    constructor(renderer, physics) {
        this.renderer = renderer;
        this.physics = physics;
        this.objects = [];
        this.wordToSprite = {
            "яблоко": "/assets/ui/apple.png",
            "вода": "/assets/ui/water.png",
            "огонь": "/assets/ui/fire.png",
            "допустимсамоедлинноеслововмире": "/assets/ui/apple.png",
            "какоетосреднееслово": "/assets/ui/apple.png"
        };
    }

    async spawnObject(word) {
        if (!this.wordToSprite[word]) return;

        const texture = await Assets.load(this.wordToSprite[word]);
        const sprite = new Sprite(texture);
        sprite.width = 50;
        sprite.height = 50;

        // Центрируем спрайт относительно его размеров
        sprite.anchor.set(0.5, 0.5);

        // Устанавливаем позицию спрайта в центре экрана
        const startX = this.renderer.app.screen.width / 2;
        const startY = 125;

        sprite.x = startX;
        sprite.y = startY;

        // Создаём физическое тело, центр которого совпадает со спрайтом
        const body = Matter.Bodies.circle(startX, startY, 25, { restitution: 0.5 });
        this.physics.addBody(body);

        this.objects.push({ sprite, body });
        this.renderer.stage.addChild(sprite);
    }

    updateObjects() {
        this.objects.forEach(({ sprite, body }) => {
            sprite.x = body.position.x;
            sprite.y = body.position.y;
            sprite.rotation = body.angle;
        });
    }
}
