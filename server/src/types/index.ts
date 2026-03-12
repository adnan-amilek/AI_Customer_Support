export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  sessionId: string;
  message: string;
  context: Message[];
}

export interface ChatResponse {
  reply: string;
  source: "faq" | "llm" | "fallback";
  confidence: number;
  escalate: boolean;
  faqId?: string;
}

export interface LeadRequest {
  sessionId: string;
  name: string;
  email: string;
}

export interface EscalateRequest {
  sessionId: string;
  trigger: "user_request" | "low_confidence";
  transcript: Message[];
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
}
