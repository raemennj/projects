// script.js

// Speech Recognition Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert('Sorry, your browser does not support Speech Recognition.');
} else {
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true; // Keep recognition running
    recognition.interimResults = false;

    let startTime;
    let displayedWord;
    let challengingWords = [];
    let currentWords = [];
    let lastWord = ''; // To track the last word presented
    let isRecognitionActive = false;
    let isTestPhase = false; // New state variable for test phase

    // Fixed response threshold in milliseconds (e.g., 2000 ms = 2 seconds)
    const RESPONSE_THRESHOLD = 3000; // Adjust as needed

    const TEST_PHRASE = 'reading is fun';

    let exceptions = {};

    // Initialize currentWords by shuffling highFrequencyWords
    function initializeCurrentWords(words) {
        currentWords = [...words];
        shuffleArray(currentWords);
        console.log('🌀 Current High Frequency Words Initialized and Shuffled.');
    }

    // Add a word to the challenging words list and reinsert it later
    function addChallengingWord(word) {
        if (!challengingWords.includes(word)) {
            challengingWords.push(word);
            updateChallengingWordsCount();
            console.log(`Added "${word}" to challenging words.`);
        }

        // Reinsert the challenging word at a random position later in currentWords
        const BUFFER = 2; // Number of words to skip before reinserting
        let insertionIndex = Math.floor(Math.random() * (currentWords.length - BUFFER + 1)) + BUFFER;

        // Ensure insertionIndex does not exceed the array bounds
        if (insertionIndex > currentWords.length) {
            insertionIndex = currentWords.length;
        }

        currentWords.splice(insertionIndex, 0, word);
        console.log(`🔄 Reinserted "${word}" at position ${insertionIndex +1} in the queue.`);
    }

    // Remove a word from the challenging words list
    function removeChallengingWord(word) {
        challengingWords = challengingWords.filter(w => w !== word);
        updateChallengingWordsCount();
        console.log(`Removed "${word}" from challenging words.`);
    }

    // Update the display count for challenging words
    function updateChallengingWordsCount() {
        document.getElementById('challengingWordsCount').innerHTML = `📚 Challenging Words: ${challengingWords.length}`;
    }

    // Calculate and log the remaining words
    function logRemainingWords() {
        const remainingWords = currentWords.length;
        console.log(`🔢 Words Remaining: ${remainingWords} (Challenging Words: ${challengingWords.length})`);
    }

    // Display the next word in the rotation
    function displayNextWord() {
        if (currentWords.length === 0) {
            declareVictory();
            return;
        }

        displayedWord = currentWords.shift(); // Get the first word

        // Prevent immediate repetition of the same word
        if (displayedWord === lastWord && currentWords.length > 0) {
            // Swap with the next word
            const temp = displayedWord;
            displayedWord = currentWords.shift();
            currentWords.push(temp);
            console.log(`🔄 Swapped "${temp}" with "${displayedWord}" to prevent immediate repetition.`);
        }

        lastWord = displayedWord; // Update lastWord

        const wordElement = document.getElementById('word');
        wordElement.textContent = displayedWord;
        console.log(`Displayed word: "${displayedWord}"`);
        startTime = Date.now();

        // Log remaining words after displaying a new word
        logRemainingWords();
    }

    // Declare victory when all words are successfully spoken
    function declareVictory() {
        const wordElement = document.getElementById('word');
        wordElement.textContent = '🎉 Congratulations! You won the game!';
        const resultElement = document.getElementById('result');
        resultElement.style.color = 'blue';
        resultElement.innerHTML = '👏 You have successfully spoken all the high frequency words!';
        stopRecognition();

        // Log final victory state
        console.log('🏆 Victory! All high frequency words have been successfully spoken.');
    }

    // Shuffle an array using Fisher-Yates algorithm
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Start the game with test phrase
    function startGame() {
        challengingWords = [];
        document.getElementById('result').textContent = '';
        updateChallengingWordsCount();
        lastWord = ''; // Reset lastWord

        isTestPhase = true;
        const wordElement = document.getElementById('word');
        wordElement.textContent = 'Please say "reading is fun" to begin.';
        console.log('🔄 Test phase initiated. Awaiting test phrase.');

        if (!isRecognitionActive) {
            recognition.start();
            isRecognitionActive = true;
            console.log('🎤 Speech recognition started for test phase.');
        }
    }

    // Stop the speech recognition
    function stopRecognition() {
        recognition.stop();
        isRecognitionActive = false;
        console.log('⏹️ Speech recognition stopped.');
    }

    // Load JSON data
    async function loadJSON(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error loading JSON:', error);
        }
    }

    // Load a specific trimester's high frequency words
    async function loadTrimesterWords(trimesterNumber) {
        const filePath = `data/trimester_${trimesterNumber}_high_frequency_words.json`;
        const data = await loadJSON(filePath);
        if (data && data.highFrequencyWords) {
            initializeCurrentWords(data.highFrequencyWords);
            console.log(`📂 Loaded Trimester ${trimesterNumber} high frequency words.`);
        } else {
            console.error(`❌ Failed to load Trimester ${trimesterNumber} high frequency words.`);
        }
    }

    // Load exceptions
    async function loadExceptions() {
        const data = await loadJSON('data/homophone_exceptions.json');
        if (data && data.exceptions) {
            exceptions = data.exceptions;
            console.log('📂 Loaded homophone exceptions.');
        } else {
            console.error('❌ Failed to load homophone exceptions.');
        }
    }

    // Handle speech recognition events
    recognition.onstart = () => {
        console.log('🎤 Speech recognition service has started');
    };

    recognition.onresult = (event) => {
        const spokenWordRaw = event.results[event.results.length - 1][0].transcript.trim();
        const spokenWord = spokenWordRaw.toLowerCase();
        const endTime = Date.now();
        const responseTime = endTime - startTime; // in milliseconds

        const resultElement = document.getElementById('result');

        // Remove previous feedback classes
        resultElement.classList.remove('correct-feedback', 'almost-feedback', 'incorrect-feedback');

        if (isTestPhase) {
            // Handle Test Phrase Verification
            if (spokenWord === TEST_PHRASE) {
                resultElement.style.color = 'green';
                resultElement.innerHTML = `🎉 Test phrase recognized successfully! Let's start the game.`;
                resultElement.classList.add('correct-feedback');
                isTestPhase = false;

                console.log(`✅ Test phrase "${spokenWordRaw}" recognized.`);
                // Proceed to game
                displayNextWord();
            } else {
                resultElement.style.color = 'red';
                resultElement.innerHTML = `🤔 You said "${spokenWordRaw}". Please say "reading is fun" to begin.`;
                resultElement.classList.add('incorrect-feedback');
                console.log(`❌ Incorrect test phrase: "${spokenWordRaw}"`);
            }
        } else {
            // Handle Game Phase
            // Determine acceptable answers
            let acceptableAnswers = [displayedWord.toLowerCase()];
            if (exceptions.hasOwnProperty(displayedWord.toLowerCase())) {
                acceptableAnswers = acceptableAnswers.concat(exceptions[displayedWord.toLowerCase()].map(word => word.toLowerCase()));
            }

            // Check if the spoken word is acceptable
            if (acceptableAnswers.includes(spokenWord)) {
                if (responseTime <= RESPONSE_THRESHOLD) {
                    resultElement.style.color = 'green';
                    resultElement.innerHTML = `🎉 Excellent! You recognized "${displayedWord}" in ${(responseTime / 1000).toFixed(2)} seconds.`;
                    resultElement.classList.add('correct-feedback');
                    // If the word was in challenging list, remove it
                    if (challengingWords.includes(displayedWord)) {
                        removeChallengingWord(displayedWord);
                    }
                    console.log(`✅ Correct: "${spokenWordRaw}"`);
                } else {
                    resultElement.style.color = 'orange';
                    resultElement.innerHTML = `😊 Good job! You took ${(responseTime / 1000).toFixed(2)} seconds. Try to respond within ${(RESPONSE_THRESHOLD / 1000).toFixed(1)} seconds next time.`;
                    resultElement.classList.add('almost-feedback');
                    addChallengingWord(displayedWord);
                    console.log(`⚠️ Almost Correct: "${spokenWordRaw}" (Took ${(responseTime / 1000).toFixed(2)}s)`);
                }
            } else {
                resultElement.style.color = 'red';
                resultElement.innerHTML = `🤔 You said "${spokenWordRaw}". Let's try "${displayedWord}" again!`;
                resultElement.classList.add('incorrect-feedback');
                addChallengingWord(displayedWord);
                console.log(`❌ Incorrect: "${spokenWordRaw}"`);
            }

            // Log remaining words after processing the response
            logRemainingWords();

            // Automatically display the next word after a short delay
            setTimeout(() => {
                displayNextWord();
            }, 3000); // 3 seconds delay
        }
    };

    recognition.onerror = (event) => {
        console.error('⚠️ Speech recognition error detected:', event.error);
        const resultElement = document.getElementById('result');
        resultElement.style.color = 'red';
        resultElement.innerHTML = `⚠️ Error occurred in recognition: ${event.error}`;
    };

    recognition.onend = () => {
        console.log('🔇 Speech recognition service disconnected');
        if (isRecognitionActive) {
            recognition.start(); // Restart recognition if it stopped unexpectedly
            console.log('🔄 Speech recognition restarted.');
        }
    };

    // Event listener for the Start button
    document.getElementById('startButton').addEventListener('click', () => {
        startGame();
    });

    // Event listener for the Reset button
    document.getElementById('resetButton').addEventListener('click', async () => {
        challengingWords = [];
        const selectedTrimester = document.getElementById('trimesterSelector').value;
        await loadTrimesterWords(selectedTrimester);
        updateChallengingWordsCount();
        document.getElementById('result').textContent = '';
        document.getElementById('word').textContent = 'Press "Start" to begin';
        stopRecognition();
        isTestPhase = false;
        console.log('🔁 Game has been reset.');
    });

    // Event listener for the Trimester selector
    document.getElementById('trimesterSelector').addEventListener('change', async (event) => {
        const trimester = event.target.value;
        await loadTrimesterWords(trimester);
        // Optionally reset the game state here
        challengingWords = [];
        updateChallengingWordsCount();
        document.getElementById('result').textContent = '';
        document.getElementById('word').textContent = 'Press "Start" to begin';
        stopRecognition();
        isTestPhase = false;
        console.log(`📅 Trimester ${trimester} selected and high frequency words loaded.`);
    });

    // Initialize the game on page load
    window.addEventListener('load', async () => {
        await loadTrimesterWords(1); // Load trimester 1 by default
        await loadExceptions();
        console.log('📄 Page loaded. Awaiting user to press Start.');
    });
}
// JavaScript Document