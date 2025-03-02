import { mockDb } from "./mockDb.js";
import { v4 as uuidv4 } from 'uuid';

export const api = {
    async getWord(word) {
        return new Promise(resolve => {
            setTimeout(() => {
                const foundWord = mockDb.words.find(w => w.word === word);
                if (!foundWord) {
                    resolve(null);
                    return;
                }

                // Генерируем уникальный GUID
                const guid = uuidv4();
                const timestamp = Date.now();

                const newObject = { 
                    guid, 
                    word: foundWord.word, 
                    rarity: foundWord.rarity, 
                    sprite: foundWord.sprite, 
                    x: null, y: null, 
                    timestamp 
                };

                // Добавляем предмет в активные
                mockDb.activeObjects.push(newObject);

                resolve(newObject);
            }, 300);
        });
    },

    async updateObjectPosition(guid, x, y) {
        return new Promise(resolve => {
            setTimeout(() => {
                const object = mockDb.activeObjects.find(obj => obj.guid === guid);
                if (!object) {
                    resolve({ error: "Объект не найден" });
                    return;
                }

                object.x = x;
                object.y = y;

                resolve({ success: true });
            }, 100);
        });
    },

    async checkCombination(guids) {
        return new Promise(resolve => {
            setTimeout(() => {
                // Проверяем, существуют ли предметы
                const objects = guids.map(guid => mockDb.activeObjects.find(obj => obj.guid === guid));
                if (objects.includes(undefined)) {
                    resolve({ error: "Один из объектов не существует" });
                    return;
                }

                // Проверяем, были ли объекты рядом (радиус 50px)
                const dx = Math.abs(objects[0].x - objects[1].x);
                const dy = Math.abs(objects[0].y - objects[1].y);
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 50) {
                    resolve({ error: "Объекты не были рядом" });
                    return;
                }

                // Проверяем, есть ли комбинация
                const sortedIds = objects.map(obj => mockDb.words.find(w => w.word === obj.word)?.id).sort((a, b) => a - b);
                const combination = mockDb.combinations.find(c =>
                    JSON.stringify(c.ingredient_ids.sort((a, b) => a - b)) === JSON.stringify(sortedIds)
                );

                if (!combination) {
                    resolve({ error: "Нет подходящей комбинации" });
                    return;
                }

                // Удаляем старые объекты и создаём новый
                mockDb.activeObjects = mockDb.activeObjects.filter(obj => !guids.includes(obj.guid));

                const guid = uuidv4();
                const timestamp = Date.now();
                const resultWord = mockDb.words.find(w => w.id === combination.result_id);

                const newObject = {
                    guid,
                    word: resultWord.word,
                    rarity: resultWord.rarity,
                    sprite: resultWord.sprite,
                    x: objects[0].x,
                    y: objects[0].y,
                    timestamp
                };

                mockDb.activeObjects.push(newObject);

                resolve({
                    result_guid: guid,
                    word: newObject.word,
                    sprite: newObject.sprite,
                    points: 25,
                    timestamp
                });
            }, 300);
        });
    }
};
