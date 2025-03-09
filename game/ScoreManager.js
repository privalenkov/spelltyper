import { WebSocketClient } from '../network/WebSocketClient.js';

export class ScoreManager {
    constructor() {
        this.score = 0;
        this.webSocket = new WebSocketClient(this);
    }

    updateScoreDisplay(currentScore, points) {
        this.score = currentScore;
        console.log(`+${points} очков! Текущий счёт: ${this.score}`);

    }

    submitScore(username) {
        fetch('http://localhost:3000/submit-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username }),
        }).then(res => res.json()).then(data => {
            if (data.success) console.log('Ваш результат сохранен');
        });
    }

    resetScore() {
        this.score = 0; // ✅ Очищаем список использованных слов
        console.log("Очки сброшены");
    }
}
