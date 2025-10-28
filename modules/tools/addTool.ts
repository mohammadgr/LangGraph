import { tool } from '@langchain/core/tools';
import * as z from "zod";

export const add = tool(({ a, b }) => a + b, { // Tool operator
    name: "add", // Tool name
    description: "Add two numbers", // Tool description
    schema: z.object({ // Tool schema
        a: z.number().describe("First Number"),
        b: z.number().describe("Second Number")
    }),
});