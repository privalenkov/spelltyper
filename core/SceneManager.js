import { Sprite, Assets } from 'pixi.js';

export class SceneManager {
    constructor(renderer, physics, objectManager) {
        this.renderer = renderer;
        this.physics = physics;
        this.objectManager = objectManager;
        this.cauldron = null;
    }

    async loadCauldron() {
        const texture = await Assets.load('/assets/ui/cauldron.png');
        this.cauldron = new Sprite(texture);
        this.cauldron.width = 300;
        this.cauldron.height = 150;
        this.cauldron.x = (this.renderer.app.screen.width - this.cauldron.width) / 2;
        this.cauldron.y = this.renderer.app.screen.height - this.cauldron.height - 80;

        this.renderer.stage.addChild(this.cauldron);
        this.createPhysicsBounds();
    }

    createPhysicsBounds() {
        const { x, y, width, height } = this.cauldron;
        const leftWall = this.physics.createStaticBody(x, y + 70, 10, 150);
        const rightWall = this.physics.createStaticBody(x + width, y + 70, 10, 150);
        const bottomWall = this.physics.createStaticBody(x + width / 2, y + height - 10, width - 20, 10);

        this.physics.addBody([leftWall, rightWall, bottomWall]);
    }

    destroy() {
        if (this.cauldron) {
            this.renderer.stage.removeChild(this.cauldron);
            this.cauldron = null;
        }
    }
}
