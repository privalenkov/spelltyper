import Matter from 'matter-js';
import { Graphics, Ticker } from 'pixi.js';

export class PhysicsEngine {
    constructor(renderer) {
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;
        this.renderer = renderer;
        this.debugMode = false;

        this.runner = Matter.Runner.create();
        Matter.Runner.run(this.runner, this.engine);

        this.debugGraphics = new Graphics();
        this.renderer.stage.addChild(this.debugGraphics);

        this.ticker = new Ticker();
        this.ticker.add(this.drawDebug.bind(this));
        this.ticker.start();
    }

    addBody(body) {
        Matter.World.add(this.world, Array.isArray(body) ? body : [body]);
    }

    createStaticBody(x, y, width, height) {
        return Matter.Bodies.rectangle(x, y, width, height, { isStatic: true });
    }

    enableDebugMode(enabled) {
        this.debugMode = enabled;
    }

    drawDebug() {
        if (!this.debugMode) return;

        this.debugGraphics.clear();
        // this.debugGraphics.lineStyle(2, 0xff0000, 0.7);

        this.world.bodies.forEach(body => {
            if (body.parts.length > 1) return;
            this.debugGraphics.moveTo(body.vertices[0].x, body.vertices[0].y);
            for (let i = 1; i < body.vertices.length; i++) {
                this.debugGraphics.lineTo(body.vertices[i].x, body.vertices[i].y);
            }
            this.debugGraphics.lineTo(body.vertices[0].x, body.vertices[0].y);
        });

        this.debugGraphics.stroke();

        this.renderer.stage.removeChild(this.debugGraphics);
        this.renderer.stage.addChild(this.debugGraphics);
    }

    destroy() {
        this.ticker.stop();
        Matter.Runner.stop(this.runner);
    }
}
