let socket;

function connectWebSocket() {
    socket = new WebSocket("ws://localhost:8080");

    socket.onopen = () => console.log("🔌 Подключено к WebSocket");
    
    socket.onmessage = (event) => {
        console.log("Обновленный лидерборд:", JSON.parse(event.data));
    };

    socket.onclose = () => {
        console.log("❌ Соединение потеряно. Переподключаемся...");
        setTimeout(connectWebSocket, 2000);
    };

    socket.onerror = (error) => console.error("WebSocket ошибка:", error);
}

connectWebSocket();
