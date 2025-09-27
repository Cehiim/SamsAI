from langchain.schema import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.retrievers import ParentDocumentRetriever
from langchain.storage import InMemoryStore
from langchain_community.docstore.in_memory import InMemoryDocstore
from langchain.text_splitter import RecursiveCharacterTextSplitter
from .models import DocumentoJSON
from faiss import IndexFlatL2

# Embeddings
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# Armazenamento dos pais (normalmente em memória ou DB)
parent_store = InMemoryStore()

# Splitter para os filhos (mesmo que não usado ativamente na sua lógica, é necessário)
child_splitter = RecursiveCharacterTextSplitter(chunk_size=400)

child_vectorstore = FAISS(embedding_function=embeddings, index=IndexFlatL2(384), docstore=InMemoryDocstore({}), index_to_docstore_id={})

# Criar retriever
retriever = ParentDocumentRetriever(
    vectorstore=child_vectorstore,
    docstore=parent_store,
    child_splitter=child_splitter  # não precisa split extra, já controlamos via JSON
)

def processar_json_para_parent_child(json_data):
    pais = []
    filhos = []

    for artigo, conteudo in json_data.items():
        # Documento pai (o artigo inteiro)
        texto_pai = conteudo["caput"]
        for p in conteudo.get("paragrafos", []):
            texto_pai += "\n" + p["texto"]
            for inciso in p.get("incisos", []):
                texto_pai += "\n" + inciso["texto"]

        pai = Document(
            page_content=texto_pai,
            metadata={"artigo": artigo, "tipo": "pai"}
        )
        pais.append(pai)

        # Documentos filhos (caput, parágrafos, incisos etc.)
        filhos.append(
            Document(
                page_content=conteudo["caput"],
                metadata={"artigo": artigo, "tipo": "caput"}
            )
        )

        for p in conteudo.get("paragrafos", []):
            filhos.append(
                Document(
                    page_content=p["texto"],
                    metadata={"artigo": artigo, "tipo": "parágrafo", "rotulo": p["rotulo"]}
                )
            )
            for inciso in p.get("incisos", []):
                filhos.append(
                    Document(
                        page_content=inciso["texto"],
                        metadata={"artigo": artigo, "tipo": "inciso", "rotulo": inciso["rotulo"]}
                    )
                )

    return pais, filhos

def carregar_documentos_no_retriever():
    """Carrega todos os JSONs salvos no banco no retriever"""
    docs = DocumentoJSON.objects.all()
    for doc in docs:
        pais, filhos = processar_json_para_parent_child(doc.conteudo)  # .conteudo = JSONField
        retriever.add_documents(pais, child_documents=filhos)

def consultar_rag(query: str, top_k: int = 3) -> str:
    """Consulta o RAG e retorna contexto concatenado"""
    resultados = retriever.invoke(query)
    contexto = "\n\n".join([doc.page_content for doc in resultados[:top_k]])
    return contexto
