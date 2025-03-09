export class WebSocketClient {
    constructor(scoreManager, wordInput) {
        this.scoreManager = scoreManager;
        this.wordInput = wordInput;
        this.wordsData = {}; // 🔥 Локальный кеш данных о словах
        this.socket = new WebSocket('ws://localhost:8082');
        this.pendingInstanceIds = [];

        this.socket.addEventListener('open', () => {
            console.log('Подключено к WebSocket серверу');
        });

        this.socket.addEventListener('message', (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'leaderboard') {
                this.updateLeaderboardUI(data.data);
            }

            if (data.type === 'word_check') {
                if (data.exists) {
                    this.wordsData[data.wordData.guid] = data.wordData; // Кешируем слово
                }
                this.wordInput.handleWordResponse(data);
            }

            if (data.type === 'new_object') {
                console.log('new object');
                this.wordInput.objectManager.replaceObjectsWithNew(this.pendingInstanceIds, data.newObject, data.collisionPoint);
                this.pendingInstanceIds = [];

                if (data.scoreUpdate) {
                    this.scoreManager.updateScoreDisplay(data.scoreUpdate.previous_score, data.scoreUpdate.points);
                }
            }
        });

        this.socket.addEventListener('close', () => {
            console.log('WebSocket соединение закрыто');
        });
    }

    checkWord(word) {
        this.socket.send(JSON.stringify({ type: 'check_word', word }));
    }

    checkCombination(ingredientGuids, instanceIds, collisionPoint) {
        this.socket.send(JSON.stringify({ type: 'check_combination', ingredientGuids, collisionPoint }));

        this.pendingInstanceIds = instanceIds;
    }

    updateLeaderboardUI(leaderboard) {
        console.log('Обновление UI лидерборда', leaderboard);
    }
}
