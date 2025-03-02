import { WebSocketServer } from "ws";
import mockDb from "./mockDB";

// Создаем WebSocket сервер на порту 8080
const wss = new WebSocketServer({ port: 8080 });

console.log("WebSocket-сервер запущен на ws://localhost:8080");

// Функция для рассылки обновленного лидерборда
function broadcastLeaderboard() {
    const leaderboardData = JSON.stringify(mockDb.leaderboard);

    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            try {
                client.send(leaderboardData);
            } catch (error) {
                console.error("Ошибка при отправке данных:", error);
            }
        }
    });
}

function cleanOldRecords() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    mockDb.leaderboard = mockDb.leaderboard.filter(record =>
        new Date(record.updated_at) >= oneWeekAgo
    );
}


// Симулируем обновление таблицы рекордов каждые 10 секунд
setInterval(() => {
    cleanOldRecords();
    console.log("Очищаем старые рекорды...");
    broadcastLeaderboard();
}, 10000);

// Обрабатываем подключения клиентов
wss.on("connection", (ws) => {
    console.log("Новый клиент подключился.");

    try {
        ws.send(JSON.stringify(mockDb.leaderboard));
    } catch (error) {
        console.error("Ошибка при отправке данных:", error);
    }

    ws.on("close", () => console.log("Клиент отключился."));
    ws.on("error", (error) => console.error("Ошибка WebSocket:", error));
});