from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled
from youtube_transcript_api.proxies import WebshareProxyConfig
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableParallel, RunnablePassthrough, RunnableLambda
from langchain_core.output_parsers import StrOutputParser
import os
from fastapi.middleware.cors import CORSMiddleware
from cachetools import TTLCache

load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
PROXY_USERNAME = os.getenv("PROXY_USERNAME")
PROXY_PASSWORD = os.getenv("PROXY_PASSWORD")

if not GOOGLE_API_KEY:
    raise EnvironmentError("GOOGLE_API_KEY not found in environment variables.")
if not PROXY_USERNAME or not PROXY_PASSWORD:
    print("Warning: Proxy credentials not found. Proceeding without proxy.")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://marcus-ai-469f.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Caching ---
# In-memory cache for vector stores to improve performance.
# This cache will store up to 100 vector stores for 1 hour (3600 seconds).
# This avoids the expensive process of fetching, chunking, and embedding for repeated requests on the same video.
vectorstore_cache = TTLCache(maxsize=100, ttl=3600)

class QueryRequest(BaseModel):
    video_id: str
    query: str


def format_docs(retrieved_docs):
    """Helper function to format retrieved documents into a single string."""
    return "\n\n".join([doc.page_content for doc in retrieved_docs])

def get_transcript(video_id: str):
    """
    Fetches the transcript for a given YouTube video ID.
    Uses proxy configuration if credentials are provided.
    """
    try:
        proxy_config = None
        if PROXY_USERNAME and PROXY_PASSWORD:
            proxy_config = WebshareProxyConfig(
                proxy_username=PROXY_USERNAME,
                proxy_password=PROXY_PASSWORD,
            )
        
        ytt_api = YouTubeTranscriptApi(proxy_config=proxy_config)
        
        fetched_transcript = ytt_api.fetch(video_id)
        return "".join(snippet.text for snippet in fetched_transcript)
    except TranscriptsDisabled:
        raise HTTPException(status_code=404, detail="Transcripts are disabled for this video.")
    except Exception as e:
        # Catching generic exceptions to handle various potential API errors
        raise HTTPException(status_code=500, detail=f"Error fetching transcript: {e}")

def create_vectorstore_from_text(text: str):
    """
    Creates a FAISS vector store from a given text.
    1. Splits the text into chunks.
    2. Generates embeddings for the chunks.
    3. Indexes the embeddings in a FAISS vector store.
    """
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.create_documents([text])

    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=GOOGLE_API_KEY)

    vectorstore = FAISS.from_documents(chunks, embeddings)
    return vectorstore

# --- API Endpoints ---

@app.get("/")
def root():
    """Root endpoint for health checks."""
    return {"message": "FastAPI backend for YouTube Chat is running!"}

@app.post("/ask")
def ask_youtube_bot(request: QueryRequest):
    """
    Main endpoint to ask a question about a YouTube video.
    It uses a cache to speed up responses for previously processed videos.
    """
    video_id = request.video_id
    query = request.query
    
    # Check if a vector store for this video_id already exists in the cache
    if video_id in vectorstore_cache:
        vectorstore = vectorstore_cache[video_id]
    else:
        # If not in cache, create it and add it to the cache
        transcript_text = get_transcript(video_id)
        if not transcript_text:
            raise HTTPException(status_code=404, detail="Could not retrieve transcript content.")
        vectorstore = create_vectorstore_from_text(transcript_text)
        vectorstore_cache[video_id] = vectorstore

    
    retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 5})

    llm = GoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=GOOGLE_API_KEY, temperature=0.2)

    prompt = PromptTemplate(
        template="""
        You are a helpful assistant designed to answer questions about a YouTube video based on its transcript.
        Your goal is to provide concise and accurate answers derived ONLY from the provided context.
        Do not use any external knowledge.
        If the information to answer the question is not in the context, you must say "I don't have enough information from the transcript to answer that question."

        CONTEXT:
        {context}
        
        QUESTION:
        {question}

        ANSWER:
        """,
        input_variables=["context", "question"]
    )

    parallel_chain = RunnableParallel({
        "context": retriever | RunnableLambda(format_docs),
        "question": RunnablePassthrough()
    })
    parser = StrOutputParser()
    main_chain = parallel_chain | prompt | llm | parser

    try:
        response = main_chain.invoke(query)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating response: {e}")
