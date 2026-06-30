# import os
# from flask import Flask, request, jsonify
# import google.generativeai as genai
# from dotenv import load_dotenv
# from flask_cors import CORS  # Import CORS

# Load environment variables
# load_dotenv()

# Configure Google Gemini API
# genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Initialize Flask app
# app = Flask(__name__)

# CORS(app)


# Chatbot Route
# @app.route('/api/chat', methods=['POST'])
# def chat():
    # try:
        # data = request.get_json()
        # user_message = data.get("message", "")
        
        # if not user_message:
            # return jsonify({"error": "No message provided"}), 400
        
        # Create generative model
        # model = genai.GenerativeModel(model_name="gemini-2.0-flash")
        # chat_session = model.start_chat(history=[])
        # response = chat_session.send_message(user_message)
        
        # return jsonify({"reply": response.text})
    
    # except Exception as e:
        # return jsonify({"error": str(e)}), 500

# Run server
# if __name__ == "__main__":
    # app.run(host="127.0.0.1", port=5001)





import os
from flask import Flask, request, jsonify
import google.generativeai as genai
from dotenv import load_dotenv
from flask_cors import CORS

# Load environment variables
load_dotenv()

# Configure Google Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Chatbot Route
@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        user_message = data.get("message", "")
        
        if not user_message:
            return jsonify({"error": "No message provided"}), 400
        
        # Create generative model
        model = genai.GenerativeModel(model_name="gemini-2.0-flash")
        chat_session = model.start_chat(history=[])
        response = chat_session.send_message(user_message)
        
        return jsonify({"reply": response.text})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Translation Route
@app.route('/api/tweets/translate', methods=['POST'])
def translate_description():
    try:
        data = request.get_json()
        text = data.get("text", "")
        
        if not text:
            return jsonify({"error": "No text provided"}), 400

        # Use Gemini to translate or paraphrase the description
        model = genai.GenerativeModel(model_name="gemini-2.0-flash")
        chat_session = model.start_chat(history=[])
        prompt = f"Translate the following text into simple English: {text}"
        response = chat_session.send_message(prompt)

        return jsonify({"translated": response.text})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Run server
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001)
