from decouple import config
import openai

#Chama o modelo de IA Sabiá-3 para responder questões na interface do SamsAI
def chama_sabia3(mensagem, instrucao, contexto="", PDF_content=""):
    query_context = ""
    query_PDF_content = ""

    if contexto:
       query_context = f"Contexto: {contexto}"
    if PDF_content:
      query_PDF_content = f"Conteúdo do PDF: {PDF_content}"

    client = openai.OpenAI(
        api_key=config('LLM_API_KEY'),
        base_url="https://chat.maritaca.ai/api"
    )
    response = client.chat.completions.create( # Corpo da requisição
      model="sabia-3",
      messages=[
        {"role": "system", "content": f"{instrucao}"},
        {"role": "user", "content": f"{query_context} Pergunta do usuário: {mensagem} {query_PDF_content}"},
      ],
      max_tokens=8000
    )
    mensagem_IA = response.choices[0].message.content # Extrai mensagem da IA
    return mensagem_IA

#Chama o modelo de IA Sabiá-3 Para realização de Testes com questões da OAB e ENADE
def chama_sabia3_teste(mensagem, contexto=""):
    query_context = ""

    if contexto:
       query_context = f"Contexto: {contexto}"

    client = openai.OpenAI(
        api_key=config('LLM_API_KEY'),
        base_url="https://chat.maritaca.ai/api"
    )
    response = client.chat.completions.create( # Corpo da requisição
      model="sabia-3",
      messages=[
        {"role": "system", "content": "Responda as questões fornecidas com apenas um único caractere, o da alternativa correta. Responda com letra maiscúla"},
        {"role": "user", "content": f"{query_context} Pergunta a ser respondida: {mensagem}"},
      ],
      max_tokens=8000
    )
    mensagem_IA = response.choices[0].message.content # Extrai mensagem da IA
    return mensagem_IA


