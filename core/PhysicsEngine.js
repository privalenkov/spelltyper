import Matter from 'matter-js';
import { Graphics, Ticker } from 'pixi.js';

export class PhysicsEngine {
    constructor(renderer) {
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;
        this.renderer = renderer;
        this.debugMode = false; // Флаг для отладки коллайдеров

        this.runner = Matter.Runner.create();
        Matter.Runner.run(this.runner, this.engine);

        // Контейнер для отладки
        this.debugGraphics = new Graphics();
        this.renderer.stage.addChild(this.debugGraphics);

        // Запускаем обновление отрисовки коллайдеров в каждом кадре
        const ticker = new Ticker();
        ticker.add(() => {
            if (!this.debugMode) return;

            // Очищаем предыдущие линии перед рисованием новых
            this.debugGraphics.clear();

            // Устанавливаем стиль перед началом рисования
            this.debugGraphics.lineStyle(2, 0xff0000, 0.7);

            // Перерисовываем контуры коллайдеров
            this.world.bodies.forEach(body => {
                if (body.parts.length > 1) return; // Игнорируем составные тела

                this.debugGraphics.moveTo(body.vertices[0].x, body.vertices[0].y);
                for (let i = 1; i < body.vertices.length; i++) {
                    this.debugGraphics.lineTo(body.vertices[i].x, body.vertices[i].y);
                }
                this.debugGraphics.lineTo(body.vertices[0].x, body.vertices[0].y);
            });

            // Вызываем `stroke()` после рисования
            this.debugGraphics.stroke();

            // Поднимаем debugGraphics наверх
            this.renderer.stage.removeChild(this.debugGraphics);
            this.renderer.stage.addChild(this.debugGraphics);
        });

        ticker.start();
    }

    addBody(body) {
        if (Array.isArray(body)) {
            Matter.World.add(this.world, body);
        } else {
            Matter.World.add(this.world, [body]);
        }
    }

    createStaticBody(x, y, width, height) {
        return Matter.Bodies.rectangle(x, y, width, height, { isStatic: true });
    }

    setDebugMode(enabled) {
        this.debugMode = enabled;
    }
}
