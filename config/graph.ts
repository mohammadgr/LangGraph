import * as z from "zod";
import { type BaseMessage } from "@langchain/core/messages";
import { MessagesZodMeta } from "@langchain/langgraph";
import { SystemMessage } from "@langchain/core/messages";
import { AIMessage, ToolMessage } from "@langchain/core/messages";
import { StateGraph, START, END } from "@langchain/langgraph";
import { registry } from "@langchain/langgraph/zod";

import { modelWithTools, toolsByName } from "../modules/tools/bindTools.js";

// Define StateGraph schema
const MessagesState = z.object({
    messages: z
        .array(z.custom<BaseMessage>())
        .register(registry, MessagesZodMeta as any), // change type to any because had an error!   *** Array of messages like SystemMessage، HumanMessage، AIMessage، ToolMessage
    llmCalls: z.number().optional() // Counter of model calls
});

// Define Nodes
async function llmCall(state: z.infer<typeof MessagesState>) {
    // Return new messages(AIMessage)
    return {
        messages: await modelWithTools.invoke([
            new SystemMessage(
                "You are a helpful assistant tasked with performing arithmetic on a set of inputs."
            ),
            ...state.messages, // Old messages
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

// Specify graph route
async function shouldContinue(state: z.infer<typeof MessagesState>) {
    const lastMessage = state.messages.at(-1);

    if (lastMessage == null || !AIMessage.isInstance(lastMessage)) return END;

    if (lastMessage.tool_calls?.length) {
        return "toolNode";
    }

    return END;
}

// Create graph
export const agent = new StateGraph(MessagesState)
    .addNode("llmCall", llmCall)
    .addNode("toolNode", toolNode)
    .addEdge(START, 'llmCall')
    .addConditionalEdges('llmCall', shouldContinue, ["toolNode", END])
    .addEdge("toolNode", "llmCall")
    .compile();