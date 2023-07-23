import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { Configuration, OpenAIApi } from "openai";
import 'dotenv/config'

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

const PORT = 4000;

const configuration = new Configuration({
  apiKey: process.env.OPENAI_KEY
});

const openai = new OpenAIApi(configuration);

app.post("/chat", async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const { input } = req.body;
  
  var max_tokens = 256;
  var completion;

  try {
    completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      stream: true,
      stop: "\n",
      messages: [
        { "role": "system", "content": "You are a helpful bot, answer concisely." },
        { "role": "user", "content": `${input}` }
      ],
      max_tokens: max_tokens
    }, { responseType: 'stream' });

    completion.data.on('data', data => {
      const lines = data.toString().split('\n').filter(line => line.trim() !== '');
      for (const line of lines) {
        const message = line.replace(/^data: /, '');
        if (message === '[DONE]') {
          res.end();
          return; // Stream finished
        }
        try {
          const parsed = JSON.parse(message);
          const delta = parsed?.choices[0]?.delta?.content;
          if (delta) {
            res.write(delta);
          }
        } catch(error) {
          console.error('Could not JSON parse stream message', message, error);
        }
      }
    });
  } catch (error) {
    if (error.response?.status) {
      console.error(error.response.status, error.message);
      error.response.data.on('data', data => {
        const message = data.toString();
        try {
          const parsed = JSON.parse(message);
          console.error('An error occurred during OpenAI request: ', parsed);
        } catch(error) {
          console.error('An error occurred during OpenAI request: ', message);
        }
      });
    } else {
      console.error('An error occurred during OpenAI request', error);
    }
  }
});

app.listen(PORT, () => console.log(`Server running on port: ${PORT}`))
