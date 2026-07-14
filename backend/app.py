from flask_cors import CORS
from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import pandas as pd
import numpy as np
import os     
import gdown

app = Flask(__name__)
CORS(app) 

# Similarity Model Download Logic
if not os.path.exists('similarity.pkl'):
    print("Downloading similarity.pkl from Google Drive...")

    gdown.download('https://drive.google.com/file/d/1wUvn7Xnx_tixXh5xd2fNYAOKDJJPjvkk/view?usp=drive_link', 'similarity.pkl', quiet=False, fuzzy=True)

# Movie Dict Download Logic
if not os.path.exists('movie_dict.pkl'):
    print("Downloading movie_dict.pkl from Google Drive...")
    
    gdown.download('https://drive.google.com/file/d/17fN0kBGD0fRIeWsHKsfdhKNYXKpvnPTL/view?usp=sharing', 'movie_dict.pkl', quiet=False, fuzzy=True)

# 1. Load the ML Models/Data on Server Startup
try:
    movies_dict = pickle.load(open('movie_dict.pkl', 'rb'))
    movies = pd.DataFrame(movies_dict)
    similarity = pickle.load(open('similarity.pkl', 'rb'))
    print("Pickle files loaded successfully! 🎬")
except Exception as e:
    print(raise_error_or_log = f"Error loading pickle files: {e}")

# 2. Recommendation Core Logic Function
def get_recommendations(movie_title):
    try:
        # Check if movie exists in dataset (case-insensitive handle karne ke liye)
        movies['title_lower'] = movies['title'].str.lower()
        if movie_title.lower() not in movies['title_lower'].values:
            return None
        
        movie_index = movies[movies['title_lower'] == movie_title.lower()].index[0]
        distances = similarity[movie_index]
        
        # Sort distances and fetch top 5 similar movies (excluding itself)
        movies_list = sorted(list(enumerate(distances)), reverse=True, key=lambda x: x[1])[1:6]
        
        recommended_movies = []
        for i in movies_list:
            movie_id = movies.iloc[i[0]].movie_id
            title = movies.iloc[i[0]].title
            recommended_movies.append({
                'movie_id': int(movie_id), # JSON serializer safe int
                'title': str(title)
            })
            
        return recommended_movies
    except Exception as e:
        print(f"Error in logic: {e}")
        return None

# 3. API Endpoint: Get list of all movies for search dropdown
@app.route('/api/movies', methods=['GET'])
def get_all_movies():
    movie_titles = movies['title'].tolist()
    return jsonify({'movies': movie_titles})

# 4. API Endpoint: Recommend movies based on input
@app.route('/api/recommend', methods=['POST'])
def recommend():
    data = request.json
    movie_title = data.get('movie')
    
    if not movie_title:
        return jsonify({'error': 'Movie name is required!'}), 400
        
    recommendations = get_recommendations(movie_title)
    
    if recommendations is None:
        return jsonify({'error': 'Movie not found in database!'}), 404
        
    return jsonify({'recommendations': recommendations})

if __name__ == '__main__':
    # Server will run on http://127.0.0.1:5000
    app.run(debug=True, port=5000)