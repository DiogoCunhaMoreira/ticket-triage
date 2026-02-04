import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

export const ai = new GoogleGenAI({}); 
// Lê GEMINI_API_KEY do ambiente (conforme quickstart). :contentReference[oaicite:4]{index=4}