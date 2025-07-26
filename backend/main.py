from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableParallel, RunnablePassthrough, RunnableLambda
from langchain_core.output_parsers import StrOutputParser

import os

from fastapi.middleware.cors import CORSMiddleware


# Load environment variables
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    raise EnvironmentError("GOOGLE_API_KEY not found in environment variables.")

# Initialize FastAPI
app = FastAPI(title="Chat with YouTube Videos Bot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://marcus-ai-469f.vercel.app"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/")
def root():
    return {"message": "FastAPI backend is running!"}

# Request model
class QueryRequest(BaseModel):
    video_id: str
    query: str

# Helper to format retrieved docs
def format_docs(retrieved_docs):
    return "\n".join([doc.page_content for doc in retrieved_docs])

# Transcript fetcher
def get_transcript(video_id):
    try:
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=["en"])
        return "".join(chunk["text"] for chunk in transcript_list)
    except TranscriptsDisabled:
        raise HTTPException(status_code=400, detail="Transcripts are disabled for this video.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching transcript: {e}")


@app.post("/ask")
def ask_youtube_bot(request: QueryRequest):
    # Step 1: Fetch transcript
    transcript_text = get_transcript(request.video_id)

    # Step 2: Split into chunks
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.create_documents([transcript_text])

    # Step 3: Create embeddings and FAISS vectorstore
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    vectorstore = FAISS.from_documents(chunks, embeddings)
    retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 4})

    # Step 4: LLM setup
    llm = GoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=GOOGLE_API_KEY)

    prompt = PromptTemplate(
        template="""
        You are a helpful assistant.
        Answer ONLY from the provided context.
        If the context is insufficient, say "I don't know."

        {context}
        Question: {question}
        """,
        input_variables=["context", "question"]
    )

    # Step 5: Chain
    parallel_chain = RunnableParallel({
        "context": retriever | RunnableLambda(format_docs),
        "question": RunnablePassthrough()
    })
    parser = StrOutputParser()
    main_chain = parallel_chain | prompt | llm | parser

    # Step 6: Run chain
    try:
        response = main_chain.invoke(request.query)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating response: {e}")
