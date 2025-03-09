import { Renderer } from './core/Renderer.js';
import { PhysicsEngine } from './core/PhysicsEngine.js';
import { SceneManager } from './core/SceneManager.js';
import { ObjectManager } from './game/ObjectManager.js';
import { WordInput } from './game/WordInput.js';
import { ScoreManager } from './game/ScoreManager.js';
import { WebSocketClient } from './network/WebSocketClient.js';

async function initGame() {
    const renderer = new Renderer();
    await renderer.init();

    const physics = new PhysicsEngine(renderer);
    physics.enableDebugMode(true);

    const scoreManager = new ScoreManager();
    const wordInput = new WordInput(renderer, null, null);
    const webSocket = new WebSocketClient(scoreManager, wordInput);
    const objectManager = new ObjectManager(renderer, physics, wordInput, scoreManager, webSocket);

    wordInput.objectManager = objectManager;
    wordInput.webSocket = webSocket;

    await new SceneManager(renderer, physics).loadCauldron();

    function gameLoop() {
        objectManager.updateObjects();
        requestAnimationFrame(gameLoop);
    }

    gameLoop();
}

initGame();
