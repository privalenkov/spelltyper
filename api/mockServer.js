import { WebSocketServer } from 'ws';
import express from 'express';
import cors from 'cors';

let newMockDatabase = {
    leaderboard: [
        { id: 1, username: "player1", score: 5000, achieved_at: Date.now() },
        { id: 2, username: "player2", score: 4000, achieved_at: Date.now() },
        { id: 3, username: "player3", score: 3000, achieved_at: Date.now() },
        { id: 4, username: "player4", score: 2000, achieved_at: Date.now() },
        { id: 5, username: "player5", score: 1000, achieved_at: Date.now() }
    ],
    rarity_points: {  
        "common": 10,
        "epic": 50,
        "legendary": 100
    },
    words: [
        { id: 1, guid: '1111-1111', word: "яблоко", rarity: "common", sprite: "apple.png", combinationGuids: ['2222-2222'] },
        { id: 2, guid: '2222-2222', word: "вода", rarity: "common", sprite: "water.png", combinationGuids: ['1111-1111'] },
        { id: 3, guid: '3333-3333', word: "огонь", rarity: "epic", sprite: "fire.png", combinationGuids: ['10101010-10101010'] },
        { id: 10, guid: '10101010-10101010', word: null, rarity: "epic", sprite: "juice.png", combinationGuids: ['3333-3333'] },
        { id: 20, guid: '4444-4444', word: null, rarity: "legendary", sprite: "flame.png", combinationGuids: [] }  
    ],
    combinations: [
        { ingredient_guids: ['1111-1111', '2222-2222'], result_id: 10 },
        { ingredient_guids: ['10101010-10101010', '3333-3333'], result_id: 20 }
    ],
};

let mockDatabase = {
    players: [
        { id: 1, username: "player1", score: 1500, created_at: Date.now(), updated_at: Date.now() },
        { id: 2, username: "player2", score: 2300, created_at: Date.now(), updated_at: Date.now() }
    ],
    leaderboard: [],
    rarity_points: {  
        "common": 10,
        "epic": 50,
        "legendary": 100
    },
    words: [
        { id: 1, guid: '1111-1111', word: "яблоко", rarity: "common", sprite: "apple.png", combinationGuids: ['2222-2222'] },
        { id: 2, guid: '2222-2222', word: "вода", rarity: "common", sprite: "water.png", combinationGuids: ['1111-1111'] },
        { id: 3, guid: '3333-3333', word: "огонь", rarity: "epic", sprite: "fire.png", combinationGuids: ['10101010-10101010'] },
        { id: 10, guid: '10101010-10101010', word: null, rarity: "epic", sprite: "juice.png", combinationGuids: ['3333-3333'] },
        { id: 20, guid: '4444-4444', word: null, rarity: "legendary", sprite: "flame.png", combinationGuids: [] }  
    ],
    combinations: [
        { ingredient_guids: ['1111-1111', '2222-2222'], result_id: 10 },
        { ingredient_guids: ['10101010-10101010', '3333-3333'], result_id: 20 }
    ],
};

function updateLeaderboard() {
    mockDatabase.leaderboard = [...mockDatabase.players]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
}

// Функция расчёта очков за комбинации
function calculateCombinationScore(ingredients) {
    let totalScore = 0;

    let currentPoints = 0;
    ingredients.forEach(guid => {
        const wordData = mockDatabase.words.find(w => w.guid === guid);
        if (!wordData) return;

        const basePoints = mockDatabase.rarity_points[wordData.rarity] || 0;
        const minCombinations = 3;
        const maxCombinations = 11;
        const bonusFactor = 100;
        const comboBonus = Math.round(
            bonusFactor * ((maxCombinations - wordData.combinationGuids.length) / (maxCombinations - minCombinations))
        );

        currentPoints += basePoints + Math.max(comboBonus, 0);
    });
    totalScore += currentPoints;

    return { points: currentPoints, totalScore };
}

// WebSocket-сервер
const wss = new WebSocketServer({ port: 8082 });

let tempScores = {};

wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    console.log(`Игрок подключился с IP: ${clientIp}`);
   
    if (!tempScores[clientIp]) {
        tempScores[clientIp] = 0; // Начальный счёт = 0
    }

    ws.send(JSON.stringify({ type: 'leaderboard', data: mockDatabase.leaderboard }));

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'sync_objects') {
            console.log('Синхронизация объектов:', data.objects);
        }

        if (data.type === 'check_word') {
            const foundWord = mockDatabase.words.find(w => w.word === data.word);
            ws.send(JSON.stringify({
                type: 'word_check',
                exists: !!foundWord,
                wordData: foundWord || null
            }));
        }

        if (data.type === 'check_combination') {
            const foundCombination = mockDatabase.combinations.find(combo =>
                combo.ingredient_guids.every(ing => data.ingredientGuids.includes(ing))
            );

            if (foundCombination) {
                const newObject = mockDatabase.words.find(w => w.id === foundCombination.result_id);
                const { points, totalScore } = calculateCombinationScore(data.ingredientGuids);

                const previousScore = tempScores[clientIp] || 0;
                const updateScore = previousScore + totalScore;
                tempScores[clientIp] = updateScore

                ws.send(JSON.stringify({
                    type: 'new_object',
                    newObject,
                    scoreUpdate: { previous_score: previousScore, points },
                    collisionPoint: data.collisionPoint
                }));
            }
        }
    });

    ws.on('close', () => {
        console.log(`Игрок с IP ${clientIp} отключился`);
        delete tempScores[clientIp]
    });
});

// REST API
const app = express();
app.use(cors());
app.use(express.json());

app.post('/check-word', (req, res) => {
    const { word } = req.body;
    const found = mockDatabase.words.find(w => w.word === word);
    res.json({ exists: !!found, wordData: found || null });
});

app.post('/submit-score', (req, res) => {
    const { username } = req.body;
    const clientIp = req.ip;

    if (!username) {
        return res.status(400).json({ success: false, message: "Имя пользователя не указано" });
    }

    let player = mockDatabase.players.find(p => p.username === username);
    const finalScore = tempScores[clientIp] || 0; // Берём накопленные очки

    if (player) {
        player.score = Math.max(player.score, finalScore); // Обновляем, если новый счёт больше
        player.updated_at = Date.now();
    } else {
        player = { 
            id: mockDatabase.players.length + 1, 
            username, 
            score: finalScore,
            created_at: Date.now(), 
            updated_at: Date.now() 
        };
        mockDatabase.players.push(player);
    }

    updateLeaderboard();
    delete tempScores[clientIp];
    res.json({ success: true });
});

app.listen(3333, () => console.log('Mock-сервер запущен на порту 3000'));
