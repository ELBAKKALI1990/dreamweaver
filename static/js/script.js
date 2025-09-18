// Variables globales
let map;
let userLocation = null;
let userMarker = null;
let dreamMarkers = [];

// Initialisation de la carte
function initMap() {
    // Créer la carte centrée sur une position par défaut (Paris)
    map = L.map('map').setView([48.8566, 2.3522], 3);
    
    // Ajouter la couche de tuiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Obtenir la localisation de l'utilisateur
    getUserLocation();
    
    // Charger les rêves existants
    loadDreams();
}

// Obtenir la localisation de l'utilisateur
function getUserLocation() {
    if ("geolocation" in navigator) {
        const statusElement = document.getElementById('locationStatus');
        statusElement.textContent = "Localisation: En cours...";
        
        navigator.geolocation.getCurrentPosition(
            function(position) {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                statusElement.textContent = `Localisation: Activée (${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)})`;
                
                // Centrer la carte sur la position de l'utilisateur
                map.setView([userLocation.lat, userLocation.lng], 10);
                
                // Ajouter un marqueur pour l'utilisateur
                if (userMarker) {
                    map.removeLayer(userMarker);
                }
                
                userMarker = L.marker([userLocation.lat, userLocation.lng])
                    .addTo(map)
                    .bindPopup('Votre position actuelle')
                    .openPopup();
            },
            function(error) {
                const statusElement = document.getElementById('locationStatus');
                statusElement.textContent = "Localisation: Non disponible - Utilisation de la position par défaut";
                console.error("Erreur de géolocalisation:", error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    } else {
        const statusElement = document.getElementById('locationStatus');
        statusElement.textContent = "Localisation: Non supportée par votre navigateur";
    }
}

// Charger les rêves depuis le serveur
async function loadDreams() {
    try {
        const response = await fetch('/dreams');
        const dreams = await response.json();
        
        // Mettre à jour les statistiques
        updateStats(dreams);
        
        // Afficher les rêves sur la carte
        displayDreamsOnMap(dreams);
    } catch (error) {
        console.error('Erreur lors du chargement des rêves:', error);
    }
}

// Mettre à jour les statistiques
function updateStats(dreams) {
    document.getElementById('dreamsCount').textContent = dreams.length;
    
    // Compter les pays uniques (simplifié)
    const uniqueCountries = new Set();
    dreams.forEach(dream => {
        if (dream.latitude && dream.longitude) {
            // Ici, nous pourrions utiliser une API de géocodage inverse pour obtenir le pays
            // Pour l'instant, nous utilisons une approximation basée sur les coordonnées
            uniqueCountries.add(`${Math.round(dream.latitude)},${Math.round(dream.longitude)}`);
        }
    });
    document.getElementById('countriesCount').textContent = uniqueCountries.size;
    
    // Calculer le taux de rêves positifs (simulé)
    const positiveRate = Math.min(90, Math.max(70, Math.floor(dreams.length * 1.5)));
    document.getElementById('positiveRate').textContent = `${positiveRate}%`;
}

// Afficher les rêves sur la carte
function displayDreamsOnMap(dreams) {
    // Supprimer les marqueurs existants
    dreamMarkers.forEach(marker => map.removeLayer(marker));
    dreamMarkers = [];
    
    // Ajouter chaque rêve à la carte
    dreams.forEach(dream => {
        if (dream.latitude && dream.longitude) {
            const marker = L.marker([dream.latitude, dream.longitude])
                .addTo(map)
                .bindPopup(`
                    <div style="text-align: center;">
                        <img src="${dream.image}" alt="Rêve" style="max-width: 100px; border-radius: 5px; margin-bottom: 10px;">
                        <p><strong>Rêve #${dream.id}</strong></p>
                        <p>${dream.text.substring(0, 100)}${dream.text.length > 100 ? '...' : ''}</p>
                    </div>
                `);
            
            dreamMarkers.push(marker);
        }
    });
}

// Générer la visualisation du rêve
async function generateDream() {
    const dreamText = document.getElementById('dreamText').value;
    
    if (!dreamText) {
        alert('Veuillez décrire votre rêve avant de générer.');
        return;
    }
    
    // Afficher la section de visualisation
    document.getElementById('visualizationSection').classList.remove('hidden');
    
    // Afficher un message de chargement
    const dreamImage = document.getElementById('dreamImage');
    dreamImage.src = '';
    dreamImage.alt = 'Génération de votre visualisation...';
    
    try {
        // Envoyer le rêve au serveur
        const response = await fetch("/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                dream: dreamText,
                location: userLocation
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Afficher l'image générée
            dreamImage.src = data.image;
            dreamImage.alt = `Visualisation du rêve: ${dreamText.substring(0, 30)}...`;
            
            // Recharger les rêves pour mettre à jour la carte
            loadDreams();
        } else {
            throw new Error(data.error);
        }
        
    } catch (error) {
        console.error("Erreur lors de la génération:", error);
        alert('Erreur lors de la génération. Veuillez réessayer.');
    }
}

// Télécharger l'image
function downloadImage() {
    const dreamImage = document.getElementById('dreamImage');
    if (dreamImage.src) {
        const link = document.createElement('a');
        link.href = dreamImage.src;
        link.download = `dreamweaver-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Initialiser l'application
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser la carte
    initMap();
    
    // Événements
    document.getElementById('generateBtn').addEventListener('click', generateDream);
    document.getElementById('downloadBtn').addEventListener('click', downloadImage);
    document.getElementById('refreshMapBtn').addEventListener('click', () => loadDreams());
    document.getElementById('shareBtn').addEventListener('click', function() {
        alert('Fonctionnalité de partage à venir!');
    });
    
    // Focus sur le textarea
    document.getElementById('dreamText').focus();
});