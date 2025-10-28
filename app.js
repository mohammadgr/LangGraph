import express from 'express';
import { HumanMessage } from "@langchain/core/messages";
import { result } from './dist/model.js';

const app = express();

const port = process.env.PORT || 4000;



app.get('/', (req, res) => {
    res.send('Run model');
});

app.get('/userRequest', async (req, res) => {
    let text = req.body;
    const result = await agent.invoke({
        messages: [new HumanMessage(text)], // User request
    });
    for (const message of result.messages) {
        console.log(`[${ message.type }]: ${ message.text }`);
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${ port }`);
});
