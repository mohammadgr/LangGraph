import { ChatOllama } from "@langchain/ollama";

// Define ollama model for use in app
export const model = new ChatOllama({
    model: "phi4-mini",
    baseUrl: 'http://localhost:11434/',
    temperature: 0,
});
