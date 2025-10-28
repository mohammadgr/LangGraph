import express from 'express';
import { result } from './dist/model.js';

const app = express();

const port = process.env.PORT || 4000;

for (const message of result.messages) {
    console.log(`[${ message.type }]: ${ message.text }`);
}

app.get('/', (req, res) => {
    res.send('Hello');
});

app.listen(port, () => {
    console.log(`Server running on port ${ port }`);
});
