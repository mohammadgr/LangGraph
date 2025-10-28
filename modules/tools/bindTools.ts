import { model } from "../../config/llm.js";
import { add } from "./addTool.js";
import { multiply } from "./multiplyTool.js";
import { divide } from "./divideTool.js";
import { minus } from "./minusTool.js";

export const toolsByName = {
    [add.name]: add,
    [multiply.name]: multiply,
    [divide.name]: divide,
    [minus.name]: minus
};

const tools = Object.values(toolsByName);
export const modelWithTools = model.bindTools(tools);