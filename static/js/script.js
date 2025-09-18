async function generateDream() {  
    const dream = document.getElementById("dreamText").value;  
    const response = await fetch("/generate", {  
        method: "POST",  
        headers: { "Content-Type": "application/json" },  
        body: JSON.stringify({ dream: dream })  
    });  
    const data = await response.json();  
    // Afficher l'image/son (étape suivante)  
}