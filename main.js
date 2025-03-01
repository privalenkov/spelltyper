import { Renderer } from './core/Renderer.js';
import { PhysicsEngine } from './core/PhysicsEngine.js';
import { SceneManager } from './core/SceneManager.js';
import { ObjectManager } from './game/ObjectManager.js';
import { WordInput } from './game/WordInput.js';

async function initGame() {
    const renderer = new Renderer();
    await renderer.init();

    const physics = new PhysicsEngine(renderer);
    physics.setDebugMode(true);

    const sceneManager = new SceneManager(renderer, physics);
    const objectManager = new ObjectManager(renderer, physics);
    const wordInput = new WordInput(renderer, objectManager, physics);

    await sceneManager.loadCauldron();

    function gameLoop() {
        objectManager.updateObjects();
        requestAnimationFrame(gameLoop);
    }
    gameLoop();
}

initGame();
