from rag import consultar_rag, carregar_documentos_no_retriever
from decouple import config
import openai

# Obtém contexto utilizando RAG
def obtem_contexto(mensagem):
    carregar_documentos_no_retriever() # Carrega JSONs no retriever
    contexto = consultar_rag(mensagem)
    return contexto

#Chama o modelo de IA Sabiá-3
def chama_sabia3(mensagem, contexto=""):
    client = openai.OpenAI(
        api_key=config('LLM_API_KEY'),
        base_url="https://chat.maritaca.ai/api"
    )
    response = client.chat.completions.create( # Corpo da requisição
      model="sabia-3",
      messages=[
        {"role": "system", "content": "Responda as questões fornecidas com apenas um único caractere, o da alternativa correta. Responda com letra maiscúla"},
        {"role": "user", "content": f"Contexto: {contexto} Pergunta do usuário: {mensagem}"},
      ],
      max_tokens=8000
    )
    mensagem_IA = response.choices[0].message.content # Extrai mensagem da IA
    return mensagem_IA


