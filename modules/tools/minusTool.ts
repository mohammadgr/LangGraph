import { tool } from '@langchain/core/tools';
import * as z from "zod";

export const minus = tool(({ a, b }) => a - b, {
    name: "minus",
    description: "Minus two numbers",
    schema: z.object({
        a: z.number().describe("First Number"),
        b: z.number().describe("Second Number")
    }),
});
