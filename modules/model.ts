import { ChatOllama } from "@langchain/ollama";
import { tool } from '@langchain/core/tools';
import * as z from "zod";
import { StateGraph, START, END } from "@langchain/langgraph";
import { MessagesZodMeta } from "@langchain/langgraph";
import { registry } from "@langchain/langgraph/zod";
import { type BaseMessage } from "@langchain/core/messages";
import { SystemMessage } from "@langchain/core/messages";
import { AIMessage, ToolMessage } from "@langchain/core/messages";
import { HumanMessage } from "@langchain/core/messages";

const model = new ChatOllama({
    model: "phi4-mini",
    baseUrl: 'http://localhost:11434/',
    temperature: 0,
});

const add = tool(({ a, b }) => a + b, {
    name: "add",
    description: "Add two numbers",
    schema: z.object({
        a: z.number().describe("First Number"),
        b: z.number().describe("Second Number")
    }),
});

const multiply = tool(({ a, b }) => a * b, {
    name: "multiply",
    description: "Multiply two numbers",
    schema: z.object({
        a: z.number().describe("First number"),
        b: z.number().describe("Second number"),
    }),
});

const divide = tool(({ a, b }) => a / b, {
    name: "divide",
    description: "Divide two numbers",
    schema: z.object({
        a: z.number().describe("First number"),
        b: z.number().describe("Second number"),
    }),
});

const minus = tool(({ a, b }) => a - b, {
    name: "minus",
    description: "Minus two numbers",
    schema: z.object({
        a: z.number().describe("First Number"),
        b: z.number().describe("Second Number")
    }),
});

const toolsByName = {
    [add.name]: add,
    [multiply.name]: multiply,
    [divide.name]: divide,
    [minus.name]: minus,
};

const tools = Object.values(toolsByName);
const modelWithTools = model.bindTools(tools);

const MessagesState = z.object({
    messages: z
        .array(z.custom<BaseMessage>())
        .register(registry, MessagesZodMeta as any), // change type to any because had an error!
    llmCalls: z.number().optional()
});

async function llmCall(state: z.infer<typeof MessagesState>) {
    return {
        messages: await modelWithTools.invoke([
            new SystemMessage(
                "You are a helpful assistant tasked with performing arithmetic on a set of inputs."
            ),
            ...state.messages,
        ]),
        llmCalls: (state.llmCalls ?? 0) + 1,
    };
}

async function toolNode(state: z.infer<typeof MessagesState>) {
    const lastMessage = state.messages.at(-1);

    if (lastMessage == null || !AIMessage.isInstance(lastMessage)) {
        return { messages: [] };
    }

    const result: ToolMessage[] = [];
    for (const toolCall of lastMessage.tool_calls ?? []) {
        const tool = toolsByName[toolCall.name];
        if (!tool) {
            throw new Error(`Tool "${toolCall.name}" not found`);
        }
        const observation = await tool.invoke(toolCall);
        result.push(observation);
    }

    return { messages: result };
}

async function shouldContinue(state: z.infer<typeof MessagesState>) {
    const lastMessage = state.messages.at(-1);

    if (lastMessage == null || !AIMessage.isInstance(lastMessage)) return END;

    if (lastMessage.tool_calls?.length) {
        return "toolNode";
    }

    return END;
}

const agent = new StateGraph(MessagesState)
    .addNode("llmCall", llmCall)
    .addNode("toolNode", toolNode)
    .addEdge(START, 'llmCall')
    .addConditionalEdges('llmCall', shouldContinue, ["toolNode", END])
    .addEdge("toolNode", "llmCall")
    .compile();

export const result = await agent.invoke({
    messages: [new HumanMessage("minus 56 and 8.")],
});