import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

let firstPrompt = '';
const promptHistory = [];

// Load firstPrompt synchronously at startup.
try {
  firstPrompt = fs.readFileSync('first_prompt.txt', 'utf8').trim();
  console.log(`Loaded first prompt: ${firstPrompt}`);
} catch (err) {
  console.error('Error reading first_prompt.txt:', err);
}

app.get('/', (req, res) => {
  res.status(200).send({
    message: 'This is OpenAI CodeX'
  });
});

app.post('/', handlePrompt);

async function handlePrompt(req, res) {
  try {
    const prompt = req.body.prompt;

    if (!prompt) {
      return res.status(400).send({ error: 'Prompt is missing' });
    }

    promptHistory.push(prompt);
    if (promptHistory.length > 4) {
      promptHistory.shift();
    }

    let promptWithHistory = firstPrompt ? `${firstPrompt}\n${promptHistory.join('\n')}` : prompt;

    if (!firstPrompt) {
      firstPrompt = prompt;
      try {
        fs.writeFileSync('first_prompt.txt', prompt);
        console.log(`Saved first prompt: ${prompt}`);
      } catch (err) {
        console.error('Error writing to first_prompt.txt:', err);
      }
    }

    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: promptWithHistory,
      temperature: 0.5,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0.5,
      presence_penalty: 0.5,
    });

    res.status(200).send({
      bot: response.data.choices[0].text.trim()
    });
  } catch (error) {
    console.error('Error processing prompt:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
}

app.listen(PORT, () => console.log(`Server is running on port http://localhost:${PORT}`));
