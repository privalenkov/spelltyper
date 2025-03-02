export default {
    players: [
        { id: 1, username: "player1", score: 1500, created_at: 312312333, updated_at: 312312333 },
        { id: 2, username: "player2", score: 2300, created_at: 312312333, updated_at: 312312333 }
    ],
    leaderboard: [
        { player_id: 2, score: 2300, updated_at: 312312333 },
        { player_id: 1, score: 1500, updated_at: 312312333 }
    ],
    rarity_points: {  
        "common": 10,    
        "epic": 50,      
        "legendary": 100 
    },
    words: [
        { id: 1, guid: '', word: "яблоко", rarity: "common", sprite: "apple.png", combination_count: 1 },
        { id: 2, guid: '', word: "вода", rarity: "common", sprite: "water.png", combination_count: 1 },
        { id: 3, guid: '', word: "огонь", rarity: "epic", sprite: "fire.png", combination_count: 1 },
        { id: 10, guid: '', word: "сок", rarity: "epic", sprite: "juice.png", combination_count: 1 },
        { id: 20, guid: '', word: "пламя", rarity: "legendary", sprite: "flame.png", combination_count: 0 }  
    ],
    combinations: [
        { ingredient_guids: ['1111-1111', '2222-2222'], result_id: 10 },  
        { ingredient_guids: ['10101010-10101010', '3333-3333'], result_id: 20 }  
    ],
};
