'use server';
import { config } from 'dotenv';
config();

// The following import is used to configure Genkit for Node.js.
import '@genkit-ai/firebase/plugin';

import '@/ai/flows/kra-refinement.ts';
