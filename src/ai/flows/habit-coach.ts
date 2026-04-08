'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const HabitCoachInputSchema = z.object({
  habitName: z.string(),
  description: z.string().optional(),
  currentStreak: z.number().optional(),
  history: z.array(z.string()).optional(), // Dates of check-ins
  userQuery: z.string().optional(),
});

const HabitCoachOutputSchema = z.object({
  advice: z.string().describe('The AI coach advice or analysis.'),
});

export type HabitCoachInput = z.infer<typeof HabitCoachInputSchema>;
export type HabitCoachOutput = z.infer<typeof HabitCoachOutputSchema>;

const habitCoachPrompt = ai.definePrompt({
  name: 'habitCoachPrompt',
  input: { schema: HabitCoachInputSchema },
  output: { schema: HabitCoachOutputSchema },
  prompt: `You are a supportive and expert Habit Coach.
  A user is tracking a habit called "{{habitName}}".
  Description: {{description}}
  Current Streak: {{currentStreak}} days.
  
  {{#if userQuery}}
  The user is asking: "{{userQuery}}"
  {{else}}
  Analyze their progress and give them a short, motivational, and actionable tip to stay consistent.
  {{/if}}
  
  Keep your response friendly, concise, and professional.`,
});

export const getHabitCoachAdvice = ai.defineFlow(
  {
    name: 'getHabitCoachAdvice',
    inputSchema: HabitCoachInputSchema,
    outputSchema: HabitCoachOutputSchema,
  },
  async (input) => {
    const { output } = await habitCoachPrompt(input);
    return output!;
  }
);
