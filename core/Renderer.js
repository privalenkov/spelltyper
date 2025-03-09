import { Application } from 'pixi.js';

export class Renderer {
    constructor() {
        this.app = new Application();
    }

    async init() {
        await this.app.init({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x282c34,
            antialias: true,
            autoDensity: true,
            resolution: window.devicePixelRatio || 1,
        });

        document.body.appendChild(this.app.canvas);

        // Обновление размеров при изменении окна
        window.addEventListener("resize", this.updateSize.bind(this));
    }

    updateSize() {
        this.app.renderer.resize(window.innerWidth, window.innerHeight);
    }

    destroy() {
        window.removeEventListener("resize", this.updateSize.bind(this));
        this.app.destroy(true);
    }

    get stage() {
        return this.app.stage;
    }
}
