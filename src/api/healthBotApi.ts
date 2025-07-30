import axios from "axios";

const TOGETHER_API_URL = "https://api.together.xyz/v1/chat/completions";
const TOGETHER_API_KEY = import.meta.env.VITE_TOGETHER_API_KEY as string;

export interface HealthBotMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function sendToHealthBot(messages: HealthBotMessage[]): Promise<string> {
  try {
    const response = await axios.post(
      TOGETHER_API_URL,
      {
        model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
        messages,
        max_tokens: 1000,
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${TOGETHER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.choices?.[0]?.message?.content || "Sorry, I couldn't understand that.";
  } catch (error: any) {
    return "Sorry, there was a problem contacting HealthBot. Please try again.";
  }
}