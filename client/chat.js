import bot from '/assets/heart.svg';
import user from '/assets/user.svg';

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');
const promptInput = form.querySelector('textarea[name="prompt"]');
const startRecognitionButton = document.getElementById('startRecognition');

const recognition = new webkitSpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = 'en-US';

let finalTranscript = '';
let isAIResponding = false;
let isRecording = false;

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

function displayInitialMessage() {
  const initialMessage = "Hello! Click on 'Start Voice' to begin recording. Click again to send your message.";
  chatContainer.innerHTML += chatStripe(true, initialMessage, generateUniqueId());
}

recognition.onresult = function(event) {
  let interimTranscript = '';

  for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
          finalTranscript += transcript;
      } else {
          interimTranscript += transcript;
      }
  }

  promptInput.value = finalTranscript + interimTranscript;
};

startRecognitionButton.addEventListener('click', function() {
  if (isRecording) {
      recognition.stop();
  } else {
      finalTranscript = ''; // Reset final transcript before starting a new recording
      recognition.start();
  }
});

recognition.onstart = function() {
  isRecording = true;
  startRecognitionButton.textContent = "Stop Recording"; // Optional: change the button label
};

recognition.onend = function() {
  if (isRecording) {
      sendPrompt(finalTranscript);
      isRecording = false;
      startRecognitionButton.textContent = "Start Recording"; // Optional: revert the button label
  }
};

async function sendPrompt(promptText) {
    if (promptText.trim() === '') return;

    isAIResponding = true;
    recognition.stop();

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
                prompt: promptText,
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

    isAIResponding = false;
    recognition.start();
}

document.addEventListener('DOMContentLoaded', function() {
  displayInitialMessage(); // Display the initial instruction

  form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const prompt = promptInput.value;
      sendPrompt(prompt);
  });

  form.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          const prompt = promptInput.value;
          sendPrompt(prompt);
      }
  });
});

