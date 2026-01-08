import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

test.describe("State Persistence Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Go to page
    await page.goto(BASE_URL);
  });

  test("Scenario A: Open course → Play video → Quit → Back → Data persists", async ({
    page,
    context,
  }) => {
    console.log("🎬 Scenario A: Testing video state persistence...");

    // 1. Open course
    console.log("1️⃣  Opening course page...");
    await page.goto(`${BASE_URL}/video-learning-module/1`);

    // Wait for course to load
    await page.waitForTimeout(2000);

    // 2. Check if lessons loaded
    const lessonsContainer = await page.locator('[class*="lesson"]').first();
    const initialLessonText = await lessonsContainer
      .textContent()
      .catch(() => "");

    if (!initialLessonText) {
      console.warn("⚠️  No lessons found initially");
    } else {
      console.log(
        `✅ Initial lesson loaded: "${initialLessonText.substring(0, 50)}..."`,
      );
    }

    // 3. Click on lesson if available
    const lessonButtons = await page
      .locator('[role="button"]')
      .filter({ hasText: /Leçon|Lesson|Video/ })
      .all();
    if (lessonButtons.length > 0) {
      console.log(`2️⃣  Clicking on first lesson...`);
      await lessonButtons[0].click();
      await page.waitForTimeout(1000);
    }

    // 4. Get current state (number of lessons visible)
    const videoElements = await page.locator("video").count();
    const lessonElements = await page.locator('[class*="lesson"]').count();

    console.log(
      `📊 Current state: ${videoElements} videos, ${lessonElements} lessons`,
    );

    // 5. Click "Quitter" (Quit) button
    const quitButton = await page
      .locator('[role="button"]')
      .filter({ hasText: /Quitter|Quit|Back/ })
      .first();
    if (quitButton) {
      console.log(`3️⃣  Clicking Quit button...`);
      await quitButton.click();

      // Await confirmation dialog if exists
      const confirmButton = await page
        .locator('[role="button"]')
        .filter({ hasText: /Oui|Quitter|Confirm/ })
        .first();
      if (confirmButton) {
        await confirmButton.click();
      }

      await page.waitForTimeout(1000);
    }

    // 6. Go back
    console.log(`4️⃣  Navigating back...`);
    await page.goBack();
    await page.waitForTimeout(2000);

    // 7. Check if data persists
    const videosAfter = await page.locator("video").count();
    const lessonsAfter = await page.locator('[class*="lesson"]').count();
    const errorMessage = await page
      .locator("text=/Aucune|No lessons|no data/i")
      .count();

    console.log(
      `📊 After back: ${videosAfter} videos, ${lessonsAfter} lessons, ${errorMessage} errors`,
    );

    // Assert
    if (lessonsAfter === 0 && errorMessage > 0) {
      console.error("❌ FAIL: Data lost after back navigation");
      console.error("  Expected: lessons to persist");
      console.error("  Got: empty state with error message");
      throw new Error("Scenario A FAILED: State lost");
    } else {
      console.log("✅ PASS: Data persisted correctly");
    }
  });

  test("Scenario B: Logout → Back → Data cleared correctly", async ({
    page,
    context,
  }) => {
    console.log("🔐 Scenario B: Testing logout state handling...");

    // 1. Navigate to protected page
    console.log("1️⃣  Opening protected page...");
    await page.goto(`${BASE_URL}/video-learning-module/1`);
    await page.waitForTimeout(2000);

    // 2. Check current state
    const lessonsInitial = await page.locator('[class*="lesson"]').count();
    console.log(`📊 Initial state: ${lessonsInitial} lessons loaded`);

    // 3. Logout (simulated by clearing auth tokens)
    console.log("2️⃣  Simulating logout (clearing tokens)...");
    await context.addInitScript(() => {
      // Clear all auth-related storage
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
      sessionStorage.clear();
    });

    // 4. Go back
    console.log(`3️⃣  Navigating back after logout...`);
    await page.goBack();
    await page.waitForTimeout(2000);

    // 5. Check if auth check happened
    const authMessage = await page
      .locator("text=/authentification|connection|login/i")
      .count();
    const stillLoggedIn = await page
      .locator("text=/Déconnexion|Logout/i")
      .count();

    console.log(
      `📊 After logout back: ${authMessage} auth messages, ${stillLoggedIn} logout buttons`,
    );

    // Assert
    if (authMessage === 0 && stillLoggedIn > 0) {
      console.error("❌ FAIL: Auth check not working after logout");
      throw new Error("Scenario B FAILED: Auth not cleared");
    } else {
      console.log("✅ PASS: Auth state handled correctly");
    }
  });

  test('Scenario C: Check for "No lessons" error message when data should exist', async ({
    page,
  }) => {
    console.log('⚠️  Scenario C: Checking for false "No lessons" errors...');

    // Navigate to video module
    console.log("1️⃣  Opening video module...");
    await page.goto(`${BASE_URL}/video-learning-module/1`, {
      waitUntil: "networkidle",
    });

    // Wait for potential loading
    await page.waitForTimeout(3000);

    // Check for false positive errors
    const noDataMessages = await page
      .locator("text=/Aucune leçon|No lessons|Erreur/i")
      .count();
    const actualLessons = await page.locator('[class*="lesson"]').count();

    console.log(
      `📊 Messages: ${noDataMessages}, Actual lessons: ${actualLessons}`,
    );

    // If we have lessons, we shouldn't have "no data" message
    if (actualLessons > 0 && noDataMessages > 0) {
      console.error(
        `❌ FAIL: False positive error detected. Has ${actualLessons} lessons but showing "no data" message`,
      );
      throw new Error("Scenario C FAILED: False positive error");
    } else {
      console.log("✅ PASS: No false positive errors");
    }
  });
});
