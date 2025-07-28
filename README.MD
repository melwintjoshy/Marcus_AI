```markdown
# 📌 Project: Marcus AI : YouTube Video Question Answering System

## 🧠 Overview

This project provides a comprehensive system for question answering based on YouTube video content. It leverages several key technologies to achieve its functionality:

*   **YouTube Transcript API:** Fetches transcripts from YouTube videos.
*   **FAISS:** Creates a vector store for efficient semantic search within the transcripts.
*   **Google Generative AI Models (via LangChain):** Generates concise answers to user questions based on relevant context extracted from the video transcript.
*   **FastAPI:** Provides a RESTful API for interacting with the question-answering functionality.
*   **React :** A frontend application bootstrapped with Create React App (CRA) to interact with the backend API.

The system fetches video transcripts, creates a vector store for semantic search, and utilizes a language model to generate answers. 

## ⚙️ Features

*   **Transcript Retrieval:** Retrieves YouTube video transcripts, handling errors and proxy configurations.
*   **Vector Store Creation:** Converts transcripts into a FAISS vector store for efficient context retrieval.
*   **Caching:** Implements an in-memory cache to optimize performance by storing vector stores.
*   **Question Answering Endpoint:** `/ask` endpoint to receive video ID and question, and return an answer based on the transcript.
*   **CORS Configuration:** Enables Cross-Origin Resource Sharing for frontend interaction.
*   **Error Handling:** Robust error handling for transcript retrieval and response generation.
*   **Reproducible Environment:**  Uses a Conda environment definition file for dependency management.
*   **Frontend Application:** A React frontend bootstrapped with Create React App for user interaction.

## 🛠️ Installation Steps

### 1. Backend (FastAPI) Setup:

   a.  **Create and Activate Conda Environment:**
       ```bash
       conda env create -f environment.yml
       conda activate <your_env_name> # Replace <your_env_name> with the environment name (e.g., youtube-qa)
       ```

   b.  **Navigate to Backend Directory:**  Assuming the backend code is in a directory (e.g., `backend`), navigate into it:
       ```bash
       cd <backend_directory> # Replace with your backend directory
       ```

   c.  **Install Dependencies (if needed - usually handled by Conda):**  While the Conda environment definition handles dependency management, you might need to activate the environment.
       ```bash
       # Conda will handle most of this, but if needed...
       pip install -r requirements.txt # Assuming you have a requirements.txt file
       ```

### 2. Frontend (React) Setup:

   a.  **Navigate to Frontend Directory:** Assuming the frontend code is in a directory (e.g., `frontend`), navigate into it:
       ```bash
       cd <frontend_directory> # Replace with your frontend directory
       ```

   b.  **Install Dependencies:**
       ```bash
       npm install
       ```



## 🚀 How to Run / Usage Instructions

### 1. Run the Backend (FastAPI):

   a.  **Start the FastAPI server:**  From your backend directory, run the following command using Uvicorn:
       ```bash
       uvicorn main:app --reload
       ```
       *   `main:app`:  Assuming your main FastAPI application is defined in a file named `main.py` and the application instance is named `app`.  Adjust accordingly if your file/app name is different.
       *   `--reload`: Enables automatic reloading of the server whenever the code changes (for development).

   b.  **Test the API:**  Open your web browser or use a tool like Postman to access the API documentation at `http://localhost:8000/docs` (assuming the server runs on port 8000).

### 2. Run the Frontend (React):

   a.  **Start the React development server:** From your frontend directory, run:
       ```bash
       npm start
       ```

   b.  **Access the Frontend:** Open your web browser and navigate to `http://localhost:3000` (or the port specified by `npm start`).

### 3.  Using the System:

   *   **Enter a YouTube video ID and your question** in the frontend interface.
   *   The frontend will send a request to the `/ask` endpoint of the backend.
   *   The backend will fetch the transcript, create a vector store (if not cached), perform a semantic search, and use the LLM to generate an answer.
   *   The answer will be displayed in the frontend.

```
