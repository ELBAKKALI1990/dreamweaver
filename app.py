from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
import sqlite3
import json
import time
import io
import random
from PIL import Image, ImageDraw, ImageFilter
import base64

app = Flask(__name__)
CORS(app)

# Configuration de la base de données
def init_db():
    conn = sqlite3.connect('dreams.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS dreams
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  text TEXT NOT NULL,
                  latitude REAL,
                  longitude REAL,
                  image_data TEXT,
                  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')
    conn.commit()
    conn.close()

init_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate():
    try:
        data = request.json
        dream_text = data.get('dream', '')
        location = data.get('location', {})
        
        # Générer une image basée sur le texte du rêve
        img_data = generate_dream_image(dream_text)
        
        # Enregistrer le rêve dans la base de données
        conn = sqlite3.connect('dreams.db')
        c = conn.cursor()
        c.execute('''INSERT INTO dreams (text, latitude, longitude, image_data)
                     VALUES (?, ?, ?, ?)''',
                  (dream_text, location.get('lat'), location.get('lng'), img_data))
        dream_id = c.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'dream_id': dream_id,
            'image': img_data,
            'message': 'Rêve enregistré avec succès!'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/dreams', methods=['GET'])
def get_dreams():
    try:
        conn = sqlite3.connect('dreams.db')
        c = conn.cursor()
        c.execute('SELECT id, text, latitude, longitude, image_data FROM dreams ORDER BY timestamp DESC')
        dreams = []
        for row in c.fetchall():
            dreams.append({
                'id': row[0],
                'text': row[1],
                'latitude': row[2],
                'longitude': row[3],
                'image': row[4]
            })
        conn.close()
        return jsonify(dreams)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def generate_dream_image(dream_text):
    """Génère une image abstraite basée sur le texte du rêve"""
    # Dimensions de l'image
    width, height = 400, 400
    
    # Créer une nouvelle image avec un fond aléatoire
    colors = [
        (70, 130, 180),  # Acier
        (106, 90, 205),  # Violet
        (72, 61, 139),   # Bleu foncé
        (147, 112, 219), # Violet moyen
        (123, 104, 238), # Violet bleu
        (135, 206, 250), # Ciel
        (255, 160, 122), # Saumon
        (255, 105, 180), # Rose
    ]
    
    bg_color = random.choice(colors)
    image = Image.new('RGB', (width, height), bg_color)
    draw = ImageDraw.Draw(image)
    
    # Ajouter des éléments basés sur la longueur du texte
    num_elements = min(len(dream_text) // 5, 20)  # Maximum 20 éléments
    
    for _ in range(num_elements):
        # Choisir une forme aléatoire
        shape_type = random.choice(['circle', 'rectangle', 'line', 'star'])
        color = random.choice(colors)
        
        if shape_type == 'circle':
            x = random.randint(0, width)
            y = random.randint(0, height)
            radius = random.randint(5, 50)
            draw.ellipse([x-radius, y-radius, x+radius, y+radius], fill=color)
        
        elif shape_type == 'rectangle':
            x1 = random.randint(0, width)
            y1 = random.randint(0, height)
            x2 = random.randint(x1, width)
            y2 = random.randint(y1, height)
            draw.rectangle([x1, y1, x2, y2], fill=color)
        
        elif shape_type == 'line':
            x1 = random.randint(0, width)
            y1 = random.randint(0, height)
            x2 = random.randint(0, width)
            y2 = random.randint(0, height)
            draw.line([x1, y1, x2, y2], fill=color, width=random.randint(1, 5))
        
        elif shape_type == 'star':
            x = random.randint(0, width)
            y = random.randint(0, height)
            size = random.randint(5, 30)
            draw.regular_polygon((x, y, size), n_sides=5, fill=color)
    
    # Ajouter un effet de flou aléatoire
    if random.random() > 0.5:
        image = image.filter(ImageFilter.GaussianBlur(radius=random.randint(1, 3)))
    
    # Convertir l'image en base64
    buffered = io.BytesIO()
    image.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"

if __name__ == '__main__':
    app.run(debug=True)