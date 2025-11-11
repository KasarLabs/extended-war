import { DynamicStructuredTool, tool } from 'langchain';
import { z } from 'zod';
export const send_operation_tool = new DynamicStructuredTool({
  name: 'send_operation',
  description:
    'Execute trading operations including market orders, limit orders, TP/SL management, leverage adjustments, and order cancellations when analysis identifies favorable opportunities.',
  schema: z.object({
    operation: z.string().describe('The operation query to perform.'),
  }),
  func: async (input: { operation: string }) => {},
});

export const wait_tool = new DynamicStructuredTool({
  name: 'wait',
  description:
    'Hold current positions and monitor market when waiting for price to reach target levels or when existing positions are performing as expected with risk management already in place.',
  schema: z.object({
    reason: z.string().describe('The reason for waiting.'),
  }),
  func: async (input: { reason: string }) => {},
});
