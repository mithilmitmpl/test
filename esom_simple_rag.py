"""
ESOM Finance RAG Chatbot Server
--------------------------------
This script creates a simple Flask server that implements a Retrieval Augmented 
Generation (RAG) chatbot for economics and finance topics.

The server handles requests at the /api/chat endpoint, processes user queries,
retrieves relevant information, and generates responses using a combination of 
retrieved content and LLM capabilities.
"""

import os
import json
import time
from datetime import datetime
import logging
import argparse
import random
from typing import List, Dict, Any, Optional

# Third-party imports
import numpy as np
import torch
from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Default path for data
DEFAULT_DATA_PATH = "econ_finance_data/processed"

# Global variables for storing data and models
embeddings_model = None
document_store = []
document_embeddings = []
glossary = {}
market_data = {}
current_trends = {}

class SimpleRAG:
    """Simple Retrieval-Augmented Generation system for economics and finance data."""
    
    def __init__(self, data_path: str = DEFAULT_DATA_PATH):
        """Initialize the RAG system with data from the specified path."""
        self.data_path = data_path
        self.embeddings_model = None
        self.document_store = []
        self.document_embeddings = None
        self.glossary = {}
        self.market_data = {}
        self.current_trends = {}
        
        # Load models and data
        self._load_embedding_model()
        self._load_documents()
        self._load_glossary()
        self._load_market_data()
        
        logger.info(f"Initialized RAG system with {len(self.document_store)} documents")
    
    def _load_embedding_model(self):
        """Load the sentence embedding model."""
        logger.info("Loading embedding model...")
        try:
            self.embeddings_model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("Embedding model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading embedding model: {e}")
            # Use a simpler model as fallback
            try:
                self.embeddings_model = SentenceTransformer('paraphrase-MiniLM-L3-v2')
                logger.info("Fallback embedding model loaded")
            except Exception as e2:
                logger.error(f"Failed to load fallback model: {e2}")
                raise
    
    def _load_documents(self):
        """Load documents from JSONL files and create embeddings."""
        logger.info(f"Loading documents from {self.data_path}...")
        
        # Create data directory if it doesn't exist
        os.makedirs(self.data_path, exist_ok=True)
        
        documents = []
        
        # List of document types to look for
        document_types = [
            "research_papers", "textbook_excerpts", 
            "financial_news", "economic_indicators"
        ]
        
        for doc_type in document_types:
            file_path = os.path.join(self.data_path, f"{doc_type}.jsonl")
            
            # Create dummy data if file doesn't exist
            if not os.path.exists(file_path):
                self._create_dummy_data(file_path, doc_type)
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        doc = json.loads(line)
                        # Add source information
                        doc["source"] = doc_type
                        documents.append(doc)
                logger.info(f"Loaded {doc_type} documents")
            except Exception as e:
                logger.error(f"Error loading {doc_type} documents: {e}")
        
        # Store the documents
        self.document_store = documents
        
        # Create embeddings for documents
        if documents and self.embeddings_model:
            logger.info("Creating document embeddings...")
            texts = [doc.get("content", "") for doc in documents]
            self.document_embeddings = self.embeddings_model.encode(texts)
            logger.info(f"Created embeddings for {len(texts)} documents")
    
    def _create_dummy_data(self, file_path: str, doc_type: str):
        """Create dummy data files for testing purposes."""
        logger.info(f"Creating dummy {doc_type} data")
        
        # Define dummy data based on document type
        dummy_docs = []
        
        if doc_type == "research_papers":
            dummy_docs = [
                {"title": "Impact of Monetary Policy on Inflation", 
                 "content": "Monetary policy has a significant impact on inflation rates. Central banks use various tools like interest rates to control inflation. In India, the Reserve Bank of India implements monetary policy to maintain price stability."},
                {"title": "Economic Growth Patterns in Developing Nations",
                 "content": "Developing nations often show different growth patterns compared to developed economies. Factors such as infrastructure, education, and governance play crucial roles in determining these patterns."}
            ]
        
        elif doc_type == "textbook_excerpts":
            dummy_docs = [
                {"title": "Principles of Macroeconomics", 
                 "content": "Macroeconomics studies the behavior of the economy as a whole, including inflation, GDP, and unemployment. These factors are interconnected and influence economic policy decisions."},
                {"title": "Introduction to Financial Markets", 
                 "content": "Financial markets are mechanisms that allow people to buy and sell (trade) financial securities, commodities, and other fungible items. They are crucial for allocating resources in the economy."}
            ]
        
        elif doc_type == "financial_news":
            dummy_docs = [
                {"title": "Stock Market Reaches New High", 
                 "date": "2025-05-29",
                 "content": "The stock market reached a new record high today as investors responded positively to recent economic data showing strong growth and controlled inflation."},
                {"title": "Central Bank Announces Interest Rate Decision", 
                 "date": "2025-05-28",
                 "content": "The central bank announced today that it will maintain current interest rates, citing balanced risks to economic growth and inflation targets."}
            ]
        
        elif doc_type == "economic_indicators":
            dummy_docs = [
                {"indicator": "GDP Growth", 
                 "value": "4.2%",
                 "period": "Q1 2025",
                 "content": "India's GDP grew by 4.2% in the first quarter of 2025, showing resilience despite global economic challenges."},
                {"indicator": "Inflation Rate", 
                 "value": "3.8%",
                 "period": "April 2025",
                 "content": "Consumer price inflation stood at 3.8% in April 2025, remaining within the Reserve Bank's target range of 2-6%."}
            ]
        
        # Save dummy data to file
        with open(file_path, 'w', encoding='utf-8') as f:
            for doc in dummy_docs:
                f.write(json.dumps(doc) + "\n")
        
        logger.info(f"Created dummy {doc_type} data with {len(dummy_docs)} entries")
    
    def _load_glossary(self):
        """Load financial and economic terms glossary."""
        file_path = os.path.join(self.data_path, "finance_glossary.jsonl")
        
        # Create dummy glossary if file doesn't exist
        if not os.path.exists(file_path):
            self._create_dummy_glossary(file_path)
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    item = json.loads(line)
                    term = item.get("term", "").lower()
                    if term:
                        self.glossary[term] = item.get("definition", "")
            logger.info(f"Loaded glossary with {len(self.glossary)} terms")
        except Exception as e:
            logger.error(f"Error loading glossary: {e}")
    
    def _create_dummy_glossary(self, file_path: str):
        """Create a dummy financial terms glossary."""
        dummy_terms = [
            {"term": "Inflation", "definition": "A general increase in prices and fall in the purchasing value of money."},
            {"term": "GDP", "definition": "Gross Domestic Product - the total value of goods produced and services provided in a country during one year."},
            {"term": "Bull Market", "definition": "A market in which share prices are rising, encouraging buying."},
            {"term": "Bear Market", "definition": "A market in which prices are falling, encouraging selling."},
            {"term": "Fiscal Policy", "definition": "Government policy relating to taxation, borrowing, and public spending."}
        ]
        
        with open(file_path, 'w', encoding='utf-8') as f:
            for term in dummy_terms:
                f.write(json.dumps(term) + "\n")
        
        logger.info(f"Created dummy glossary with {len(dummy_terms)} terms")
    
    def _load_market_data(self):
        """Load market data and current economic trends."""
        file_path = os.path.join(self.data_path, "market_data.json")
        
        # Create dummy market data if file doesn't exist
        if not os.path.exists(file_path):
            self._create_dummy_market_data(file_path)
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.market_data = data.get("market_data", {})
                self.current_trends = data.get("trends", {})
            logger.info("Loaded market data and trends")
        except Exception as e:
            logger.error(f"Error loading market data: {e}")
    
    def _create_dummy_market_data(self, file_path: str):
        """Create dummy market data for testing."""
        dummy_data = {
            "market_data": {
                "indices": {
                    "SENSEX": "66,782.43 (+0.4%)",
                    "NIFTY": "20,189.65 (+0.3%)",
                    "S&P500": "5,432.67 (+0.2%)"
                },
                "currencies": {
                    "USD/INR": "74.23 (-0.1%)",
                    "EUR/INR": "87.65 (+0.2%)",
                    "GBP/INR": "102.36 (+0.3%)"
                },
                "commodities": {
                    "Gold": "₹62,450/10g (+0.5%)",
                    "Crude Oil": "$82.75/barrel (-0.3%)"
                }
            },
            "trends": {
                "inflation_rate": "3.8% (April 2025)",
                "repo_rate": "5.25%",
                "gdp_growth": "4.2% (Q1 2025)",
                "unemployment": "6.8% (April 2025)"
            }
        }
        
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(dummy_data, f, indent=2)
        
        logger.info("Created dummy market data")
    
    def retrieve_relevant_documents(self, query: str, top_k: int = 3) -> List[Dict]:
        """Retrieve the most relevant documents for a given query."""
        if not self.document_embeddings is not None or not self.document_store:
            logger.warning("No document embeddings available for retrieval")
            return []
        
        # Create query embedding
        query_embedding = self.embeddings_model.encode([query])[0]
        
        # Calculate similarities
        similarities = np.dot(self.document_embeddings, query_embedding)
        top_indices = np.argsort(similarities)[-top_k:][::-1]  # Get indices of top-k most similar docs
        
        # Return the top-k documents
        relevant_docs = [self.document_store[i] for i in top_indices]
        
        # Add similarity scores for debugging
        for i, doc in enumerate(relevant_docs):
            doc["similarity_score"] = float(similarities[top_indices[i]])
        
        return relevant_docs
    
    def check_glossary_terms(self, query: str) -> Dict:
        """Check if the query contains any terms from our glossary."""
        query_lower = query.lower()
        found_terms = {}
        
        # Check for exact terms (prioritize longer matches)
        sorted_terms = sorted(self.glossary.keys(), key=len, reverse=True)
        for term in sorted_terms:
            if term in query_lower:
                found_terms[term] = self.glossary[term]
                if len(found_terms) >= 2:  # Limit to prevent overwhelming responses
                    break
        
        return found_terms
    
    def get_relevant_market_data(self, query: str) -> Dict:
        """Extract relevant market data based on the query."""
        result = {}
        query_lower = query.lower()
        
        # Check for economic indicators
        if any(term in query_lower for term in ["inflation", "cpi", "price index"]):
            result["inflation"] = self.current_trends.get("inflation_rate", "Data not available")
        
        if any(term in query_lower for term in ["interest rate", "repo", "repo rate"]):
            result["repo_rate"] = self.current_trends.get("repo_rate", "Data not available")
        
        if any(term in query_lower for term in ["gdp", "growth", "economic growth"]):
            result["gdp_growth"] = self.current_trends.get("gdp_growth", "Data not available")
        
        # Check for market indices
        if any(term in query_lower for term in ["sensex", "stock market", "share market", "bse"]):
            result["SENSEX"] = self.market_data.get("indices", {}).get("SENSEX", "Data not available")
        
        if any(term in query_lower for term in ["nifty", "nse"]):
            result["NIFTY"] = self.market_data.get("indices", {}).get("NIFTY", "Data not available")
        
        # Check for commodities
        if "gold" in query_lower:
            result["Gold"] = self.market_data.get("commodities", {}).get("Gold", "Data not available")
        
        if any(term in query_lower for term in ["oil", "crude", "petroleum"]):
            result["Crude Oil"] = self.market_data.get("commodities", {}).get("Crude Oil", "Data not available")
        
        return result
    
    def generate_response(self, query: str, chat_history: List = None) -> Dict:
        """Generate a response to the user query using retrieval and synthesis."""
        if chat_history is None:
            chat_history = []
        
        # Initialize response data
        response_data = {
            "answer": "",
            "sources": [],
            "glossary_terms": {},
            "market_data": {}
        }
        
        try:
            # Step 1: Retrieve relevant documents
            relevant_docs = self.retrieve_relevant_documents(query, top_k=3)
            
            # Step 2: Check glossary for relevant terms
            glossary_terms = self.check_glossary_terms(query)
            
            # Step 3: Get relevant market data
            market_data = self.get_relevant_market_data(query)
            
            # Step 4: Generate answer based on retrieved information
            answer = self._synthesize_answer(query, relevant_docs, glossary_terms, market_data, chat_history)
            
            # Step 5: Format sources information
            sources = []
            for doc in relevant_docs:
                source_info = {
                    "type": doc.get("source", "unknown"),
                    "title": doc.get("title", "Untitled")
                }
                if "date" in doc:
                    source_info["date"] = doc["date"]
                sources.append(source_info)
            
            # Step 6: Assemble the response
            response_data["answer"] = answer
            response_data["sources"] = sources
            response_data["glossary_terms"] = glossary_terms
            response_data["market_data"] = market_data
            
            return response_data
            
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return {
                "answer": "I'm sorry, I encountered an error while processing your query. Please try again.",
                "sources": [],
                "glossary_terms": {},
                "market_data": {}
            }
    
    def _synthesize_answer(self, query: str, docs: List[Dict], glossary_terms: Dict, 
                          market_data: Dict, chat_history: List) -> str:
        """Synthesize an answer from retrieved information."""
        # This is a simple version that doesn't use an actual LLM
        # In a production system, you would use an actual LLM here
        
        if not docs:
            # No relevant documents found
            if glossary_terms:
                # But we found glossary terms
                terms_list = list(glossary_terms.keys())
                if len(terms_list) == 1:
                    return f"I see you're asking about '{terms_list[0]}'. {glossary_terms[terms_list[0]]}"
                else:
                    definitions = [f"'{term}': {glossary_terms[term]}" for term in terms_list]
                    return f"I found these relevant terms in your query:\n\n" + "\n\n".join(definitions)
            
            if market_data:
                # We have market data
                data_points = [f"{key}: {value}" for key, value in market_data.items()]
                return f"Here's the latest data related to your query:\n\n" + "\n".join(data_points)
            
            # Generic response for no information
            return "I don't have specific information on that topic yet. Please try asking about economics, finance, or market data that might be in my knowledge base."
        
        # We have relevant documents
        answer_parts = []
        
        # Use content from most relevant document
        main_content = docs[0].get("content", "")
        if len(main_content) > 300:
            main_content = main_content[:300] + "..."
        answer_parts.append(main_content)
        
        # Add glossary definitions if any
        if glossary_terms:
            terms_text = "\n\nRelated terms:\n"
            terms_text += "\n".join([f"- {term.capitalize()}: {definition}" for term, definition in glossary_terms.items()])
            answer_parts.append(terms_text)
        
        # Add market data if any
        if market_data:
            market_text = "\n\nRelevant market data:\n"
            market_text += "\n".join([f"- {key}: {value}" for key, value in market_data.items()])
            answer_parts.append(market_text)
        
        return " ".join(answer_parts)

# Initialize the RAG system
rag_system = None

def initialize_rag():
    """Initialize the RAG system with the specified data path."""
    global rag_system
    try:
        rag_system = SimpleRAG()
        return True
    except Exception as e:
        logger.error(f"Error initializing RAG: {e}")
        return False

@app.route('/', methods=['GET'])
def home():
    """Homepage route that displays a simple test page"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>ESOM Finance API Server</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .container { max-width: 800px; margin: 0 auto; }
            h1 { color: #333; }
            .status { padding: 20px; background-color: #d4edda; border-radius: 5px; }
            .endpoint { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px; }
            code { background-color: #eee; padding: 2px 5px; border-radius: 3px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>ESOM Finance API Server</h1>
            <div class="status">
                <h2>✅ Server is running correctly!</h2>
                <p>The API server is operational and ready to process requests.</p>
            </div>
            
            <div class="endpoint">
                <h3>Available Endpoint:</h3>
                <p><code>POST /api/chat</code> - Send economics & finance questions</p>
                <p>This endpoint accepts JSON with the format:</p>
                <pre><code>{
    "message": "Your question about economics or finance",
    "user_id": "optional_user_id",
    "chat_history": []
}</code></pre>
            </div>
            
            <div class="endpoint">
                <h3>Testing Your Chatbot:</h3>
                <p>To use the chatbot, add the JavaScript file to your HTML and open your website.</p>
                <p>The chatbot should connect to this server automatically.</p>
            </div>
        </div>
    </body>
    </html>
    """

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint that returns a 200 status"""
    return jsonify({
        "status": "ok",
        "message": "ESOM Finance API is running"
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    """Endpoint for handling chat requests"""
    # Check if RAG system is initialized
    global rag_system
    if rag_system is None:
        if not initialize_rag():
            return jsonify({
                "error": "RAG system initialization failed"
            }), 500
    
    # Parse request data
    data = request.json
    if not data:
        return jsonify({
            "error": "No data provided"
        }), 400
    
    message = data.get('message')
    user_id = data.get('user_id', 'anonymous')
    chat_history = data.get('chat_history', [])
    
    if not message:
        return jsonify({
            "error": "No message provided"
        }), 400
    
    try:
        # Generate response
        start_time = time.time()
        response_data = rag_system.generate_response(message, chat_history)
        
        # Log query for analytics
        logger.info(f"Query from {user_id}: '{message}' - Processed in {time.time() - start_time:.2f}s")
        
        # Return the response
        return jsonify({
            "response": response_data["answer"],
            "sources": response_data["sources"],
            "glossary_terms": response_data["glossary_terms"],
            "market_data": response_data["market_data"],
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error processing chat request: {e}")
        return jsonify({
            "error": "An error occurred while processing your request",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    # Command-line arguments
    parser = argparse.ArgumentParser(description='ESOM Finance RAG Chatbot Server')
    parser.add_argument('--host', type=str, default='0.0.0.0',
                        help='Host to run the server on')
    parser.add_argument('--port', type=int, default=5001,
                        help='Port to run the server on')
    parser.add_argument('--debug', action='store_true',
                        help='Run in debug mode')
    parser.add_argument('--data-path', type=str, default=DEFAULT_DATA_PATH,
                        help='Path to data directory')
    
    args = parser.parse_args()
    
    # Initialize RAG system
    if initialize_rag():
        logger.info(f"Starting server on {args.host}:{args.port}")
        app.run(host=args.host, port=args.port, debug=args.debug)
    else:
        logger.error("Failed to initialize RAG system. Exiting.")