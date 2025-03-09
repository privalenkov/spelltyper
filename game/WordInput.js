import { Container, Text, Ticker } from 'pixi.js';

export class WordInput {
    constructor(renderer, objectManager, webSocket) {
        this.renderer = renderer;
        this.objectManager = objectManager;
        this.word = '';
        this.letters = [];
        this.webSocket = webSocket;
        this.letterContainer = new Container();
        this.renderer.stage.addChild(this.letterContainer);
        this.inactivityTimeout = null;
        this.maxWordLength = 35;
        this.maxLetterSpacing = 80;
        this.minLetterSpacing = 35;
        this.isAnimatingLetters = false;
        this.letterSpacingMap = { // Дополнительные отступы для широких букв
            'м': 1.2, 'ш': 1.3, 'щ': 1.4, 'ж': 1.3, 'ф': 1.3, 'ё': 1.1, 'г': .7, 'ы': 1.2, 'ю': 1.2
        };
        this.baseRadiusY = 100;
        this.baseArcAngle = Math.PI / 3;
        this.isBlockedInput = false; // Флаг блокировки ввода

        window.addEventListener("keydown", (e) => this.handleInput(e));

        this.ticker = new Ticker();
        this.ticker.add(() => this.animateLetters());
        this.ticker.start();
    }

    clearWord() {
        this.word = '';
        this.letterContainer.removeChildren();
        this.letters = [];
    }

    setIsBlockedInput(state) {
        this.isBlockedInput = state; // 🔥 Включает / выключает блокировку
    }

    isAnimating() {
        return this.isAnimatingLetters; // ✅ Возвращает true, если идёт анимация букв
    }

    handleInput(event) {
        if (this.isBlockedInput) return; // Блокируем ввод во время анимации

        clearTimeout(this.inactivityTimeout);

        if (event.key === "Enter") {
            // this.processWord();
            this.webSocket.checkWord(this.word);
        } else if (event.key === "Backspace") {
            this.removeLetter();
        } else if (/^[а-яА-Я]$/.test(event.key)) {
            this.addLetter(event.key);
        }

        this.inactivityTimeout = setTimeout(() => this.webSocket.checkWord(this.word), 1200);
    }

    addLetter(letter) {
        if (this.word.length >= this.maxWordLength) return;
        this.word += letter;
        this.updateWordPosition();
    }

    removeLetter() {
        if (this.letters.length > 0) {
            this.letterContainer.removeChild(this.letters.pop());
            this.word = this.word.slice(0, -1);
            this.updateWordPosition();
        }
    }

    handleWordResponse(data) {
        this.isBlockedInput = true; // Блокируем ввод на время анимации
        this.isAnimatingLetters = true;

        if (data.exists) {
            this.ticker.stop(); // Останавливаем дрожание
            this.animateMerge(data); // Анимация слияния букв
        } else {
            this.scatterLettersSequentially();
        }
    }

    animateMerge(data) {
        const centerX = this.renderer.app.screen.width / 2;
        const avgY = this.letters.reduce((sum, letter) => sum + letter.y, 0) / this.letters.length;
        const centerY = avgY; // ✅ Теперь центр точно соответствует среднему уровню букв

        let mergedLetters = 0;
        let delay = 0;

        const mergeInterval = Math.max(50, 100 - this.word.length * 20);

        // ✅ Упорядочиваем буквы по расстоянию до центра
        const sortedLetters = [...this.letters].sort((a, b) => Math.abs(a.x - centerX) - Math.abs(b.x - centerX));

        sortedLetters.forEach((letter, index) => {
            setTimeout(() => {
                this.mergeLetter(letter, centerX, centerY, () => {
                    mergedLetters++;
                    if (mergedLetters === this.letters.length) {
                        this.finalizeMerge(data);
                    }
                });
            }, delay);
            delay += mergeInterval; // ✅ Интервал между слиянием букв
        });
    }

    mergeLetter(letter, centerX, centerY, onComplete) {
        const mergeTicker = new Ticker();
        mergeTicker.add(() => {
            letter.x += (centerX - letter.x) * 0.2;
            letter.y += (centerY - letter.y) * 0.2;
            letter.alpha -= 0.1; // Постепенное исчезновение

            if (Math.abs(letter.x - centerX) < 1000 && Math.abs(letter.y - centerY) < 1000 && letter.alpha <= 0.5) {
                mergeTicker.stop();
                this.letterContainer.removeChild(letter);
                onComplete();
            }
        });

        mergeTicker.start();
    }

    finalizeMerge(data) {
        this.objectManager.spawnObject(data.wordData, null, true);
        this.clearWord();
        this.isBlockedInput = true;
        this.isAnimatingLetters = false;
        this.ticker.start(); // Возобновляем анимацию дрожания
    }

    scatterLettersSequentially() {
        this.ticker.stop(); // Останавливаем дрожание перед разлетом

        let delay = 0;
        const scatterInterval = Math.max(30, 120 - this.word.length * 3);

        
        this.letters.forEach((letter, index) => {
            setTimeout(() => {
                this.scatterLetter(letter);
            }, delay);
            delay += scatterInterval; // ✅ Интервал между разлетом букв теперь 80 мс
        });

        // ✅ Убрали +1000, теперь работает точно по времени букв
        setTimeout(() => {
            this.clearWord();
            this.isAnimatingLetters = false;
            this.ticker.start(); // Возобновляем анимацию дрожания для новых букв
        }, this.letters.length * scatterInterval);
    }

    scatterLetter(letter) {
        letter.vx = (Math.random() - 0.5) * 6; // Горизонтальная скорость (от -3 до 3)
        letter.vy = (Math.random() - 0.2) * 4; // Вертикальная скорость (от -1 до 3)
        letter.gravity = 1; // ✅ Увеличена гравитация
        letter.fadeSpeed = 0.2; // ✅ Увеличена скорость исчезновения

        const scatterTicker = new Ticker();
        scatterTicker.add(() => {
            letter.x += letter.vx;
            letter.y += letter.vy;
            letter.vy += letter.gravity; // Гравитация притягивает вниз
            letter.alpha -= letter.fadeSpeed;

            if (letter.alpha <= 0) {
                scatterTicker.stop();
                this.letterContainer.removeChild(letter);
                this.letters = this.letters.filter(l => l !== letter);
            }
        });

        scatterTicker.start();
    }

    updateWordPosition() {
        this.letterContainer.removeChildren();
        this.letters = [];

        const centerX = this.renderer.app.screen.width / 2;
        const fontSize = Math.max(120 - this.word.length * 3, 40); // Увеличенный базовый размер
        let letterSpacing = Math.max(this.maxLetterSpacing - this.word.length * 1.5, this.minLetterSpacing); // Оптимизированный динамический отступ
        
        // Корректируем расстояние между буквами в зависимости от их ширины
        const adjustedLetterSpacing = this.word.split('').map(letter =>
            letterSpacing * (this.letterSpacingMap[letter] || 1)
        );
        
        const totalWidth = adjustedLetterSpacing.reduce((sum, space) => sum + space, 0);
        const startX = centerX - totalWidth / 2;
        const centerY = 200;
        const radiusY = this.baseRadiusY;
        const arcAngle = this.baseArcAngle + (this.word.length * 0.05);
        const stepAngle = arcAngle / Math.max(this.word.length - 1, 1);
        
        let currentX = startX;
        for (let i = 0; i < this.word.length; i++) {
            const x = currentX;
            const y = centerY - radiusY * Math.cos(-arcAngle / 2 + i * stepAngle);
            const shakeFactor = 1 + this.word.length * 0.01;
            
            const text = new Text(this.word[i], { fontSize: fontSize, fill: 0xffffff });
            text.x = x;
            text.y = y;
            text.initialX = text.x;
            text.initialY = text.y;
            text.shakeIntensityX = shakeFactor;
            text.shakeIntensityY = shakeFactor;
            text.shakeSpeedX = 0.42;
            text.shakeSpeedY = 0.42;
            text.shakeOffsetX = Math.random() * Math.PI * 2;
            text.shakeOffsetY = Math.random() * Math.PI * 2;
            this.letters.push(text);
            this.letterContainer.addChild(text);
            
            currentX += adjustedLetterSpacing[i]; // Учитываем индивидуальный отступ для каждой буквы
        }
    }
    animateLetters() {
        const time = Date.now();
        this.letters.forEach(letter => {
            letter.x = letter.initialX + Math.sin(time * letter.shakeSpeedX + letter.shakeOffsetX) * letter.shakeIntensityX;
            letter.y = letter.initialY + Math.cos(time * letter.shakeSpeedY + letter.shakeOffsetY) * letter.shakeIntensityY;
        });
    }
}