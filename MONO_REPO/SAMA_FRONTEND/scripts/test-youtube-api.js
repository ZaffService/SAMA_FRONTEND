/**
 * Test rapide de la clé API Google pour YouTube
 *
 * À exécuter dans le terminal :
 * node scripts/test-youtube-api.js
 */

const API_KEY = "AIzaSyCaPHgcq-WClOHZb7de_Y2OUqyUNS6JPv0";

// Vidéo de test : "Les Bases du Développement Web"
const TEST_VIDEO_ID = "9VqJ5vH7q64";

async function testYoutubeApi() {
  console.log("🧪 Test de l'API YouTube Data v3");
  console.log(`Video ID: ${TEST_VIDEO_ID}`);
  console.log("---");

  try {
    // Construire l'URL
    const url = `https://www.googleapis.com/youtube/v3/videos?id=${TEST_VIDEO_ID}&key=${API_KEY}&part=contentDetails`;

    // Effectuer la requête
    console.log("📡 Envoi de la requête à YouTube API...");
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`❌ Erreur HTTP: ${response.status}`);
      const error = await response.json();
      console.error("Détails:", error);
      process.exit(1);
    }

    const data = await response.json();

    // Vérifier les résultats
    if (!data.items || data.items.length === 0) {
      console.error("❌ Vidéo non trouvée");
      process.exit(1);
    }

    const duration = data.items[0].contentDetails.duration;

    // Parser la durée (format ISO 8601)
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = duration.match(regex);
    const hours = parseInt(matches?.[1] || "0", 10);
    const minutes = parseInt(matches?.[2] || "0", 10);
    const seconds = parseInt(matches?.[3] || "0", 10);

    // Afficher les résultats
    console.log("✅ Succès!");
    console.log("---");
    console.log(`⏱  Durée brute (ISO 8601): ${duration}`);
    console.log(`📊 Heures: ${hours}h`);
    console.log(`📊 Minutes: ${minutes}m`);
    console.log(`📊 Secondes: ${seconds}s`);
    console.log(`📊 Format: ${hours}h ${minutes}m ${seconds}s`);
    console.log("---");
    console.log("🎉 La clé API fonctionne correctement!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    process.exit(1);
  }
}

testYoutubeApi();
