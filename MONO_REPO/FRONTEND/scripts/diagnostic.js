// ============================================
// 🔍 SCRIPT DE DIAGNOSTIC - À COPIER DANS LA CONSOLE
// ============================================
//
// Utilisation:
// 1. Ouvrez DevTools: F12
// 2. Onglet: Console
// 3. Copier-collez TOUT ce script ci-dessous
// 4. Appuyez Entrée
// 5. Regardez les résultats
//
// ============================================

console.log(
  "%c🔍 DIAGNOSTIC DE LA TABLE DE TOKENS",
  "font-size: 20px; color: blue; font-weight: bold;",
);
console.log(
  "%c═════════════════════════════════════",
  "color: blue; font-weight: bold;",
);

// Configuration
const WORDPRESS_URL = "https://bibocomdigital.com";
const ENDPOINT = `${WORDPRESS_URL}/wp-json/sama/v1/diagnose`;

// Fonction principale
async function diagnoseTokenTable() {
  try {
    console.log("\n📡 Envoi de la requête...");
    console.log(`URL: ${ENDPOINT}`);

    const response = await fetch(ENDPOINT, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    console.log(`HTTP Status: ${response.status}`);

    if (!response.ok) {
      console.error(`❌ Erreur HTTP: ${response.status}`);
      return;
    }

    const data = await response.json();

    // Affichage des résultats
    console.log(
      "\n%c✅ RÉSULTATS DU DIAGNOSTIC",
      "font-size: 16px; color: green; font-weight: bold;",
    );
    console.log("═════════════════════════════════════");

    // 1. État de la table
    console.log("\n📊 État de la Table:");
    console.log(`   Nom: ${data.table_name}`);
    console.log(`   Existe: ${data.table_exists ? "✅ OUI" : "❌ NON"}`);
    console.log(`   Timestamp: ${data.timestamp}`);

    // 2. Nombre de tokens
    if (data.table_exists) {
      console.log("\n📈 Statistiques:");
      console.log(`   Nombre total de tokens: ${data.token_count || 0}`);

      // 3. Derniers tokens
      if (data.recent_tokens && data.recent_tokens.length > 0) {
        console.log("\n📋 Derniers Tokens:");
        data.recent_tokens.forEach((token, i) => {
          console.log(
            `   ${i + 1}. User ID: ${token.user_id} | Email: ${token.email} | Verified: ${token.verified}`,
          );
        });
      } else {
        console.log("\n📋 Pas de tokens en base (normal si c'est nouveau)");
      }

      // 4. Structure de la table
      if (data.columns && data.columns.length > 0) {
        console.log("\n🏗️ Structure de la Table:");
        data.columns.forEach((col) => {
          console.log(
            `   - ${col.Field}: ${col.Type} ${col.Null === "NO" ? "(NOT NULL)" : "(NULL)"}`,
          );
        });
      }
    }

    // 5. Résumé final
    console.log(
      "\n%c═══════════════════════════════════",
      "color: green; font-weight: bold;",
    );
    if (data.table_exists) {
      console.log(
        "%c✅ LA TABLE EXISTE ET EST ACCESSIBLE",
        "color: green; font-weight: bold; font-size: 14px;",
      );
      console.log(
        "%cVous pouvez tester l'inscription maintenant!",
        "color: green; font-size: 12px;",
      );
    } else if (data.auto_created) {
      console.log(
        "%c⚙️ LA TABLE A ÉTÉ CRÉÉE AUTOMATIQUEMENT",
        "color: orange; font-weight: bold; font-size: 14px;",
      );
      console.log(
        "%cAttendez 5 secondes et réessayez ce diagnostic",
        "color: orange; font-size: 12px;",
      );
    } else {
      console.log(
        "%c❌ LA TABLE N'EXISTE PAS",
        "color: red; font-weight: bold; font-size: 14px;",
      );
      console.log(
        "%c⚠️  Il faut demander à l'admin WordPress de créer la table",
        "color: red; font-size: 12px;",
      );
      console.log(
        "%c📧 Envoyez-lui le fichier TOKEN_CREATION.sql",
        "color: red; font-size: 12px;",
      );
    }
    console.log(
      "%c═══════════════════════════════════",
      "color: green; font-weight: bold;",
    );

    // Afficher la réponse complète en JSON
    console.log("\n📄 Réponse Complète (JSON):");
    console.table(data);

    return data;
  } catch (error) {
    console.error("%c❌ ERREUR", "color: red; font-weight: bold;");
    console.error(`Message: ${error.message}`);
    console.error("Stack:", error);
    return null;
  }
}

// Exécuter le diagnostic
console.log("\n⏳ Exécution du diagnostic...\n");
const result = await diagnoseTokenTable();

// Résultat pour utilisation ultérieure
if (result) {
  window._lastDiagnosis = result;
  console.log("\n✅ Résultat sauvegardé dans: window._lastDiagnosis");
}
