import express from 'express';
import { HumanMessage } from "@langchain/core/messages";

import { agent } from './config/graph.js';

const app = express();

const port = process.env.PORT || 4000;

app.get('/', async (req, res) => {
    const result = await agent.invoke({
        messages: [new HumanMessage("minus 56 and 8.")], // User request
    });

    for (const message of result.messages) {
        console.log(`[${message.type}]: ${message.text}`);
    }

    res.send('Hello');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
