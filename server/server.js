import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';
import fs from 'fs';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

let firstPrompt = '';
const promptHistory = [];

fs.readFile('first_prompt.txt', 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  firstPrompt = data.trim();
  console.log(`Loaded first prompt: ${firstPrompt}`);
});

app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'This is OpenAI CodeX'
  });
});

app.post('/', async (req, res) => {
  try {
    const prompt = req.body.prompt;

    promptHistory.push(prompt);
    if (promptHistory.length > 4) {
      promptHistory.shift();
    }

    let promptWithHistory = '';
    if (firstPrompt) {
      promptWithHistory = `${firstPrompt}\n${promptHistory.join('\n')}`;
    } else {
      promptWithHistory = prompt;
      firstPrompt = prompt;
      fs.writeFile('first_prompt.txt', prompt, (err) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log(`Saved first prompt: ${prompt}`);
      });
    }

    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: `${promptWithHistory}`,
      temperature: 0.5,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0.5,
      presence_penalty: 0.5,
    });

    res.status(200).send({
      bot: response.data.choices[0].text
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error });
  }
});

app.listen(5000, () => console.log('Server is running on port http://localhost:5000'));