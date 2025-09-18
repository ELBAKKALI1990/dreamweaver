from flask import Flask, render_template, request, jsonify  
app = Flask(__name__)  

@app.route('/')  
def index():  
    return render_template('index.html')  

@app.route('/generate', methods=['POST'])  
def generate():  
    dream = request.json.get('dream')  
    # Logique IA à venir (étape 3)  
    return jsonify({"image": "placeholder", "sound": "placeholder"})  

if __name__ == '__main__':  
    app.run(debug=True)