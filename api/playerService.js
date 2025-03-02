import { api } from "./api";

export async function getLeaderboard() {
    return await api.getLeaderboard();
}

export async function updatePlayerScore(username, points) {
    return await api.updateScore(username, points);
}
