import bot from '/assets/heart.svg';
import user from '/assets/user.svg';

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');
let loadInterval;

async function logout() {
  try {
    await signOut(auth);
    console.log("User signed out successfully");
    window.location.href = "index.html";
  } catch (error) {
    console.error("Error signing out:", error.message);
  }
}

function loader(element) {
  element.textContent = ''

  loadInterval = setInterval(() => {
    element.textContent += '.';

    if (element.textContent === '....') {
       element.textContent = '';
    }
  }, 300);
}

function typeText(element, text) {
  let index = 0;

  let interval = setInterval(() => {
    if(index < text.length) {
      element.innerHTML += text.charAt(index);
      index++
    } else {
      clearInterval(interval)

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 1.5;

      const setVoice = () => {
        const voices = speechSynthesis.getVoices();
        const desiredVoice = voices.find(voice => voice.name === 'Microsoft Zira - English (United States)');

        if (desiredVoice) {
          utterance.voice = desiredVoice;
          speechSynthesis.speak(utterance);
        } else {
          console.error("Desired voice not found, using default voice");
          speechSynthesis.speak(utterance);
        }
      };

      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = setVoice;
      } else {
        setVoice();
      }
    }
  }, 20);
}

function generateUniqueId() {
  const timestamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16);

  return `id-${timestamp}-${hexadecimalString}`;
}

function chatStripe (isAi, value, uniqueId) {
  return(
    `
    <div class='wrapper ${isAi && 'ai'}'>
      <div class='chat'>
        <div class='profile'>
          <img
            src='${isAi ? bot : user}'
            alt='${isAi ? 'bot' : 'user'}'
          />
        </div>
        <div class='message' id=${uniqueId}>${value}</div>
      </div>
    </div>
    `
  )
}

const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData(form)

  chatContainer.innerHTML += chatStripe(false, data.get('prompt'))

  form.reset()

  const uniqueId = generateUniqueId()
  chatContainer.innerHTML += chatStripe(true, " ", uniqueId)

  chatContainer.scrollTop = chatContainer.scrollHeight;

  const messageDiv = document.getElementById(uniqueId);

  loader(messageDiv)

  const response = await fetch('https://islamai.onrender.com', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: data.get('prompt'),
      openaiAPI: sessionStorage.getItem('openaiAPI')
    })
  })

  clearInterval(loadInterval)
  messageDiv.innerHTML = ' '

  if(response.ok) {
    const data = await response.json();
    const parsedData = data.bot.trim()

    typeText(messageDiv, parsedData)
  } else {
    const err = await response.text()

    messageDiv.innerHTML = 'Something Went Wrong'
    alert(err)
  }
}

form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', (e) => {
  if (e.keyCode === 13) {
    handleSubmit(e)
  }
})

function initSpeechRecognition() {
  const startRecognitionButton = document.querySelector('#startRecognition');

  if (startRecognitionButton) {
    startRecognitionButton.addEventListener('click', () => {
      if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
          console.log('Speech recognition started');
        };

        recognition.onresult = (event) => {
          const lastResultIndex = event.results.length - 1;
          const transcript = event.results[lastResultIndex][0].transcript;
          if (event.results[lastResultIndex].isFinal) {
            handleSpokenInput(transcript);
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
        };

        recognition.start();
      } else {
        alert('Your browser does not support speech recognition. Please use a browser that supports it, such as Google Chrome.');
      }
    });
  }
}

function handleSpokenInput(transcript) {
  console.log('Spoken input:', transcript);
  const submitEvent = new Event('submit');
  form.prompt.value = transcript;
  handleSubmit(submitEvent);
  form.reset();
}

document.addEventListener('DOMContentLoaded', () => {
  initSpeechRecognition();
});

const logoutButton = document.getElementById("logoutBtn");
if (logoutButton) {
  logoutButton.addEventListener("click", logout);
}