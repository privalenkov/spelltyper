import { api } from "./api";

export async function checkWord(word) {
    return await api.getWord(word);
}

export async function checkCombination(id1, id2) {
    const key = [id1, id2].sort().join(",");
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(mockDb.combinations[key] || null);
        }, 300);
    });
}

