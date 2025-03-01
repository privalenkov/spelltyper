import { Sprite, Assets, Graphics } from 'pixi.js';

export class SceneManager {
    constructor(renderer, physics) {
        this.renderer = renderer;
        this.physics = physics;
    }

    async loadCauldron() {
        const texture = await Assets.load('/assets/ui/cauldron.png');
        const cauldron = new Sprite(texture);

        cauldron.width = 300;
        cauldron.height = 150;
        cauldron.x = (this.renderer.app.screen.width - cauldron.width) / 2;
        cauldron.y = this.renderer.app.screen.height - cauldron.height - 80;

        this.renderer.stage.addChild(cauldron);

        // Физические границы
        const leftWall = this.physics.createStaticBody(cauldron.x, cauldron.y + 70, 10, 150);
        const rightWall = this.physics.createStaticBody(cauldron.x + cauldron.width, cauldron.y + 70, 10, 150);
        const bottomWall = this.physics.createStaticBody(cauldron.x + cauldron.width / 2, cauldron.y + cauldron.height - 10, cauldron.width - 20, 10);

        this.physics.addBody([leftWall, rightWall, bottomWall]);
    }
}
