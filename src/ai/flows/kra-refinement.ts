'use server';

/**
 * @fileOverview This file defines a Genkit flow for refining KRA task descriptions using generative AI.
 *
 * @module kra-refinement
 * @exports refineKraTaskDescription - An async function to refine KRA task descriptions.
 * @exports RefineKraTaskDescriptionInput - The input type for the refineKraTaskDescription function.
 * @exports RefineKraTaskDescriptionOutput - The output type for the refineKraTaskDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RefineKraTaskDescriptionInputSchema = z.object({
  taskDescription: z
    .string()
    .describe('The KRA task description to be refined.'),
});
export type RefineKraTaskDescriptionInput = z.infer<
  typeof RefineKraTaskDescriptionInputSchema
>;

const RefineKraTaskDescriptionOutputSchema = z.object({
  refinedTaskDescription: z
    .string()
    .describe('The refined KRA task description.'),
});
export type RefineKraTaskDescriptionOutput = z.infer<
  typeof RefineKraTaskDescriptionOutputSchema
>;

export async function refineKraTaskDescription(
  input: RefineKraTaskDescriptionInput
): Promise<RefineKraTaskDescriptionOutput> {
  return refineKraTaskDescriptionFlow(input);
}

const refineKraTaskDescriptionPrompt = ai.definePrompt({
  name: 'refineKraTaskDescriptionPrompt',
  input: {schema: RefineKraTaskDescriptionInputSchema},
  output: {schema: RefineKraTaskDescriptionOutputSchema},
  prompt: `You are an expert in writing clear and effective KRA task descriptions.

  Please refine the following KRA task description to improve its clarity and ensure it is easily understood.

  Original Task Description: {{{taskDescription}}}

  Refined Task Description:`, // Ensure the prompt clearly defines the expected output format
});

const refineKraTaskDescriptionFlow = ai.defineFlow(
  {
    name: 'refineKraTaskDescriptionFlow',
    inputSchema: RefineKraTaskDescriptionInputSchema,
    outputSchema: RefineKraTaskDescriptionOutputSchema,
  },
  async input => {
    const {output} = await refineKraTaskDescriptionPrompt(input);
    return output!;
  }
);
