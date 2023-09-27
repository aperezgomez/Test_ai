import bot from '/assets/heart.svg';
import user from '/assets/user.svg';

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');

// Helper Functions
function generateUniqueId() {
    const timestamp = Date.now();
    const randomNumber = Math.random();
    const hexadecimalString = randomNumber.toString(16);
    return `id-${timestamp}-${hexadecimalString}`;
}

function loader(element) {
    element.textContent = '';
    let loadInterval = setInterval(() => {
        element.textContent += '.';
        if (element.textContent === '....') {
            element.textContent = '';
        }
    }, 300);
    return loadInterval;
}

function chatStripe(isAi, value, uniqueId) {
    return `
        <div class='wrapper ${isAi ? 'ai' : ''}'>
            <div class='chat'>
                <div class='profile'>
                    <img src='${isAi ? bot : user}' alt='${isAi ? 'bot' : 'user'}' />
                </div>
                <div class='message' id=${uniqueId}>${value}</div>
            </div>
        </div>`;
}

function typeText(element, text) {
    let index = 0;
    let interval = setInterval(() => {
        if (index < text.length) {
            element.innerHTML += text.charAt(index);
            index++;
        } else {
            clearInterval(interval);
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.pitch = 1.5;
            const setVoice = () => {
                const voices = speechSynthesis.getVoices();
                const desiredVoice = voices.find(voice => voice.name === 'Microsoft Zira - English (United States)');
                utterance.voice = desiredVoice ? desiredVoice : voices[0];
                speechSynthesis.speak(utterance);
            };
            if (speechSynthesis.onvoiceschanged !== undefined) {
                speechSynthesis.onvoiceschanged = setVoice;
            } else {
                setVoice();
            }
        }
    }, 20);
}

// Event Handlers
async function handleSubmit(e) {
    e.preventDefault();

    const data = new FormData(form);
    chatContainer.innerHTML += chatStripe(false, data.get('prompt'));
    form.reset();

    const uniqueId = generateUniqueId();
    chatContainer.innerHTML += chatStripe(true, " ", uniqueId);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    const messageDiv = document.getElementById(uniqueId);
    const loadInterval = loader(messageDiv);

    try {
        const response = await fetch('https://islamai.onrender.com', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: data.get('prompt'),
                openaiAPI: sessionStorage.getItem('openaiAPI')
            })
        });

        clearInterval(loadInterval);
        messageDiv.innerHTML = ' ';

        if (response.ok) {
            const responseData = await response.json();
            const parsedData = responseData.bot.trim();
            typeText(messageDiv, parsedData);
        } else {
            messageDiv.innerHTML = 'Something Went Wrong';
            alert(await response.text());
        }
    } catch (error) {
        clearInterval(loadInterval);
        messageDiv.innerHTML = 'Error occurred';
        console.error('Error:', error);
    }
}

function initSpeechRecognition() {
    const startRecognitionButton = document.querySelector('#startRecognition');
    if (startRecognitionButton) {
        startRecognitionButton.addEventListener('click', () => {
            if ('webkitSpeechRecognition' in window) {
                const recognition = new webkitSpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;

                recognition.onstart = () => console.log('Speech recognition started');
                recognition.onresult = (event) => {
                    const lastResultIndex = event.results.length - 1;
                    const transcript = event.results[lastResultIndex][0].transcript;
                    if (event.results[lastResultIndex].isFinal) {
                        handleSpokenInput(transcript);
                    }
                };

                recognition.onerror = (event) => console.error('Speech recognition error:', event.error);
                recognition.start();
            } else {
                alert('Your browser does not support speech recognition. Please use a browser that supports it, such as Google Chrome.');
            }
        });
    }
}

function handleSpokenInput(transcript) {
    const submitEvent = new Event('submit');
    form.prompt.value = transcript;
    form.dispatchEvent(submitEvent);
    form.reset();
}

// Event Listeners
form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        handleSubmit(e);
    }
});
document.addEventListener('DOMContentLoaded', initSpeechRecognition);
