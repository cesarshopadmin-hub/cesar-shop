/// <reference types="cypress" />

// ─────────────────────────────────────────────────────────────────────────────
// Full Post Approval Lifecycle
// User creates → Admin rejects → User edits → Admin approves
//
// ⚠️  This test runs against a LIVE backend (http://localhost:5173 + real API).
//    The dev server must be running before executing this spec.
//
// Strategy
// ─────────
// • Login is done via the real UI login form (POST /api/auth/login).
// • After each actor's steps we clear localStorage to simulate a logout,
//   then navigate to /login for the next actor.
//   (The logout *button* uses a t() i18n key so we avoid relying on its
//    translated text and instead clear state programmatically — this is
//    more reliable and faster.)
// • A unique title based on Date.now() ensures the post can be identified
//   unambiguously even if other posts exist in the pending queue.
// ─────────────────────────────────────────────────────────────────────────────

// ── Credentials ──────────────────────────────────────────────────────────────
const ADMIN_EMAIL    = "mariamessamedward555@gmail.com";
const ADMIN_PASSWORD = "123456";
const USER_EMAIL     = "romaessam570@gmail.com";
const USER_PASSWORD  = "123456";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Log in via the login page form and wait for auth to fully complete.
 *  Two-stage guard:
 *  1. URL must leave /login (the redirect happened).
 *  2. The logout button must be visible in the navbar (token is in
 *     localStorage and AuthContext has re-rendered with the user).
 *  Only after both conditions pass does the calling test continue.
 */
function loginAs(email, password) {
  cy.visit("/login");
  cy.get('input[name="identifier"]').should("be.visible").type(email);
  cy.get('input[name="password"]').should("be.visible").type(password);
  cy.contains("button", "دخول").click();

  // Stage 1: URL must no longer contain /login (allow 20s for cold-start backends)
  cy.url({ timeout: 20000 }).should("not.include", "/login");

  // Stage 2: The logout button being visible proves the token is persisted
  // and the navbar has re-rendered in authenticated state.
  cy.contains("تسجيل خروج", { timeout: 15000 }).should("be.visible");
}

/** Clear auth state (equivalent to logout) without relying on nav button text. */
function logoutViaLocalStorage() {
  cy.window().then((win) => {
    win.localStorage.removeItem("token");
    win.localStorage.removeItem("user");
  });
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe("Full Post Approval Lifecycle", () => {
  // uniqueTitle is shared across all steps via an alias set in the first test.
  // Cypress aliases reset per-spec but persist across `it` blocks within one suite
  // when using before() + cy.wrap().as().
  before(() => {
    const title = `إعلان تجريبي ${Date.now()}`;
    cy.wrap(title).as("uniqueTitle");
  });

  // ── Step 1: Regular User creates a post ─────────────────────────────────────
  it("Step 1 — User creates a new pending post", function () {
    const { uniqueTitle } = this;

    loginAs(USER_EMAIL, USER_PASSWORD);

    cy.visit("/add-post");
    cy.contains("إضافة إعلان جديد").should("be.visible");

    // Fill the form
    cy.get('input[name="title"]').type(uniqueTitle);
    cy.get('select[name="category"]').select("أخرى");
    cy.get('input[name="price"]').type("200");
    cy.get('textarea[name="description"]').type(
      "هذا إعلان تجريبي لاختبار دورة حياة الموافقة الكاملة على المنصة"
    );

    // Attach a 1×1 pixel PNG so the image validation passes
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          "base64"
        ),
        fileName: "test.png",
        mimeType: "image/png",
      },
      { force: true }
    );

    // Submit and verify success
    cy.contains("button", "إرسال الإعلان").click();
    cy.contains("تم إضافة الإعلان بنجاح!", { timeout: 10000 }).should("be.visible");

    // Verify the post now appears in the user's profile as pending
    cy.visit("/profile");
    cy.contains(uniqueTitle, { timeout: 10000 }).should("be.visible");
    cy.contains("قيد المراجعة").should("be.visible");

    logoutViaLocalStorage();
  });

  // ── Step 2: Admin rejects the post ──────────────────────────────────────────
  it("Step 2 — Admin finds the post and rejects it with a reason", function () {
    const { uniqueTitle } = this;

    loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);

    cy.visit("/admin/dashboard");
    cy.contains("مراجعة المنشورات المعلقة", { timeout: 10000 }).should("be.visible");

    // Locate the specific post card by its unique title
    cy.contains(uniqueTitle, { timeout: 10000 })
      .closest("article")
      .within(() => {
        // Click the reject button inside this card
        cy.contains("button", "رفض").click();
      });

    // The rejection modal should appear
    cy.contains("رفض المنشور").should("be.visible");

    // Fill in the rejection reason
    cy.get(
      'textarea[placeholder="اكتب سببًا واضحًا ومختصرًا لرفض المنشور..."]'
    ).type("يرجى توضيح السعر بشكل أفضل وإضافة تفاصيل إضافية للمنتج");

    // Confirm the rejection
    cy.contains("button", "تأكيد الرفض").click();

    // Toast confirming the rejection
    cy.contains("تم رفض المنشور بنجاح.", { timeout: 10000 }).should("be.visible");

    // The post card should disappear from the pending list
    cy.contains(uniqueTitle).should("not.exist");

    logoutViaLocalStorage();
  });

  // ── Step 3: User edits the rejected post ────────────────────────────────────
  it("Step 3 — User sees the rejection reason and edits the post", function () {
    const { uniqueTitle } = this;

    loginAs(USER_EMAIL, USER_PASSWORD);

    cy.visit("/profile");

    // The post should now appear as rejected with the rejection reason
    cy.contains(uniqueTitle, { timeout: 10000 })
      .closest("article")
      .within(() => {
        cy.contains("مرفوض").should("be.visible");
        cy.contains("سبب الرفض").should("be.visible");
        cy.contains("يرجى توضيح السعر بشكل أفضل").should("be.visible");

        // Click the edit link
        cy.contains("تعديل الإعلان وإعادة التقديم").click();
      });

    // Should now be on the edit page
    cy.contains("تعديل الإعلان", { timeout: 10000 }).should("be.visible");

    // Update the price and description to address the rejection reason
    cy.get('input[name="price"]').clear().type("350");
    cy.get('textarea[name="description"]')
      .clear()
      .type(
        "تم تحديث الوصف: حساب PUBG مستوى ماسي، السعر 350 جنيه يشمل جميع السكنات النادرة"
      );

    // Submit the edits
    cy.contains("button", "إرسال التعديلات").click();

    // Toast confirming the edit was saved
    cy.contains("تم تعديل الإعلان بنجاح!", { timeout: 10000 }).should("be.visible");

    // After edit, redirects to /profile and post is back to pending
    cy.url().should("include", "/profile");
    cy.contains(uniqueTitle, { timeout: 10000 }).should("be.visible");
    cy.contains("قيد المراجعة").should("be.visible");

    logoutViaLocalStorage();
  });

  // ── Step 4: Admin approves the re-submitted post ─────────────────────────────
  it("Step 4 — Admin approves the re-submitted post", function () {
    const { uniqueTitle } = this;

    loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);

    cy.visit("/admin/dashboard");
    cy.contains("مراجعة المنشورات المعلقة", { timeout: 10000 }).should("be.visible");

    // Find the re-submitted post and approve it
    cy.contains(uniqueTitle, { timeout: 10000 })
      .closest("article")
      .within(() => {
        cy.contains("button", "موافقة").click();
      });

    // Toast confirming approval
    cy.contains("تمت الموافقة على المنشور بنجاح.", { timeout: 10000 }).should(
      "be.visible"
    );

    // Post disappears from the pending list after approval
    cy.contains(uniqueTitle).should("not.exist");

    logoutViaLocalStorage();
  });
});
