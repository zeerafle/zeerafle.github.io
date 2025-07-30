---
title: "Personal Website's RAG"
classes: wide
toc_sticky: true
hidden: true
---

# 🤖 Intelligent Q&A System for My Personal Website

## Overview

I built an intelligent Retrieval-Augmented Generation (RAG) system that transforms my static personal website into an interactive knowledge base. Visitors can now ask questions about my projects, experience, and content, receiving accurate answers sourced directly from my website's content.

## 🏗️ Architecture & Technology Stack

### Core Components

- **LangChain**: Orchestrates the RAG pipeline and document processing
- **FAISS**: High-performance vector database for semantic search
- **Google Gemini 2.0 Flash Lite**: Latest LLM for natural language understanding and generation
- **FastAPI**: Modern, fast web framework for the RESTful API
- **Fly.io**: Cost-effective deployment with scale-to-zero capabilities

### Data Pipeline

The system automatically syncs with my GitHub repository containing website content:

````python
def clone_and_load_repo(github_url, local_dir):
    if os.path.exists(local_dir):
        Repo(local_dir).remotes.origin.pull()
    else:
        Repo.clone_from(github_url, local_dir)

    documents = []
    for root, _, files in os.walk(local_dir):
        for file in files:
            if file.endswith((".md")):
                loader = TextLoader(os.path.join(root, file))
                documents.extend(loader.load())
    return documents
````

## 🔄 RAG Implementation Details

### Vector Store Creation

Documents are processed through a sophisticated chunking strategy to maintain context while enabling efficient retrieval:

````python
def save_vector_store(docs):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    splits = text_splitter.split_documents(docs)

    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    vectorstore = FAISS.from_documents(splits, embeddings)
    vectorstore.save_local("vector_store/faiss_index")
````

### Retrieval Chain Setup

The RAG chain combines Google's latest embedding model with Gemini 2.0 Flash Lite for optimal and cost-efficient performance:

````python
def setup_rag():
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    vectorstore = FAISS.load_local(
        "vector_store/faiss_index",
        embeddings,
        allow_dangerous_deserialization=True
    )

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash-lite-preview-02-05",
        temperature=0.5,
    )

    retrieval_qa_chat_prompt = hub.pull("langchain-ai/retrieval-qa-chat")
    combine_docs_chain = create_stuff_documents_chain(llm, retrieval_qa_chat_prompt)
    rag_chain = create_retrieval_chain(vectorstore.as_retriever(), combine_docs_chain)

    return rag_chain
````

## 🚀 API Design & Deployment

### FastAPI Backend

Clean, documented API with proper error handling and CORS configuration:

````python
@app.post("/ask")
async def ask(query: Query):
    try:
        result = qa.invoke({"input": query.question})
        return {
            "answer": result["answer"],
            "sources": [doc.metadata["source"] for doc in result["context"]],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
````

## 📊 Technical Highlights

- **Semantic Search**: FAISS enables lightning-fast similarity search across embedded content
- **Context Preservation**: RecursiveCharacterTextSplitter maintains document coherence
- **Latest AI**: Gemini 2.0 Flash Lite provides state-of-the-art language understanding
- **Production Ready**: Proper error handling, logging, and security measures

## 🔄 Future Enhancements

- **Multi-modal support**: Image and video content understanding
- **Conversation memory**: Multi-turn dialogue capabilities
- **Cloud-based vector stores**: Such as Pinecone
