import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is not set in the environment.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateDocumentContent = async (
  topic: string, 
  tone: string, 
  docType: string
): Promise<{ title: string; body: string }> => {
  const ai = getAiClient();
  if (!ai) {
    throw new Error("Chave de API não encontrada.");
  }

  const prompt = `
    Atue como um redator profissional especializado em documentos corporativos e governamentais.
    
    TAREFA:
    Escreva um documento do tipo "${docType}" sobre o seguinte contexto: "${topic}".
    
    DIRETRIZES:
    - Tom de voz: ${tone}.
    - Idioma: Português do Brasil.
    - O texto deve ser bem estruturado, com introdução, desenvolvimento (pontos chave) e conclusão.
    - NÃO use formatação Markdown complexa (como **negrito** ou # headers). Use apenas quebras de linha para separar parágrafos.
    - Crie um Título Profissional e conciso para este documento baseado no contexto.

    FORMATO DE SAÍDA (JSON OBRIGATÓRIO):
    Responda APENAS com um objeto JSON válido contendo dois campos: "title" e "body".
    Exemplo: { "title": "Proposta de Serviço X", "body": "Prezados,\\n\\nSegue a proposta..." }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json'
      }
    });
    
    const textResponse = response.text;
    if (!textResponse) throw new Error("Sem resposta da IA");

    const json = JSON.parse(textResponse);
    
    return {
      title: json.title || "Documento Sem Título",
      body: json.body || textResponse
    };
  } catch (error) {
    console.error("Erro ao gerar conteúdo:", error);
    // Fallback em caso de erro de parse ou conexão
    return {
      title: "Erro na Geração",
      body: "Não foi possível estruturar o documento automaticamente. Verifique sua conexão e tente novamente."
    };
  }
};