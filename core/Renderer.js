import { Application } from 'pixi.js';

export class Renderer {
    constructor() {
        this.app = new Application();
    }

    async init() {
        await this.app.init({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x282c34
        });

        document.body.appendChild(this.app.canvas);

        // Обновление размеров при изменении окна
        window.addEventListener("resize", () => {
            this.app.renderer.resize(window.innerWidth, window.innerHeight);
        });
    }

    get stage() {
        return this.app.stage;
    }
}
