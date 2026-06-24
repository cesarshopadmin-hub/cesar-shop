/// <reference types="cypress" />

// ─── Shared test data ────────────────────────────────────────────────────────

const TEST_EMAIL = "test@example.com";
const TEST_PASSWORD = "password123";

// A realistic mock JWT and user object that AuthContext reads from localStorage.
// Using a non-expiring dummy token is fine for UI-level E2E tests.
const MOCK_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyJ9.DUMMY";
const MOCK_USER = { _id: "123", name: "مستخدم تجريبي", email: TEST_EMAIL, role: "user" };

// ─── Suite ───────────────────────────────────────────────────────────────────

describe("User Authentication and Post Creation Flow", () => {

  // ── Login ──────────────────────────────────────────────────────────────────

  describe("Login", () => {
    beforeEach(() => {
      // Stub the login API so the test never hits the real backend.
      cy.intercept("POST", "/api/auth/login", {
        statusCode: 200,
        body: {
          token: MOCK_TOKEN,
          _id: MOCK_USER._id,
          name: MOCK_USER.name,
          email: MOCK_USER.email,
          role: MOCK_USER.role,
        },
      }).as("loginRequest");

      cy.visit("/login");
    });

    it("renders the login form with email and password fields", () => {
      cy.get('input[name="identifier"]').should("be.visible");
      cy.get('input[name="password"]').should("be.visible");
      cy.contains("button", "دخول").should("be.visible");
    });

    it("submits credentials and redirects to the home page on success", () => {
      // Fill the form using the real name attributes from LoginPage.jsx
      cy.get('input[name="identifier"]')
        .should("be.visible")
        .type(TEST_EMAIL);

      cy.get('input[name="password"]')
        .should("be.visible")
        .type(TEST_PASSWORD);

      cy.contains("button", "دخول").click();

      // Wait for the intercepted API call to complete
      cy.wait("@loginRequest");

      // After a successful login the app navigates to "/"
      cy.url().should("eq", Cypress.config("baseUrl") + "/");
    });

    it("shows a validation error when the email format is invalid", () => {
      cy.intercept("POST", "/api/auth/login", {
        statusCode: 401,
        body: { message: "البريد الإلكتروني/رقم الهاتف أو كلمة المرور غير صحيحة" },
      }).as("loginErrorRequest");

      cy.get('input[name="identifier"]').type("not-an-email");
      cy.get('input[name="password"]').type(TEST_PASSWORD);
      cy.contains("button", "دخول").click();

      cy.wait("@loginErrorRequest");

      // The error banner rendered on submit failure
      cy.contains("البريد الإلكتروني/رقم الهاتف أو كلمة المرور غير صحيحة").should("be.visible");
    });
  });

  // ── Add Post ───────────────────────────────────────────────────────────────

  describe("Adding a Post (authenticated)", () => {
    beforeEach(() => {
      // Seed localStorage so AuthContext initialises as logged-in without a
      // real network login.  This mirrors exactly what AuthContext.login() does.
      cy.window().then((win) => {
        win.localStorage.setItem("token", MOCK_TOKEN);
        win.localStorage.setItem("user", JSON.stringify(MOCK_USER));
      });

      // Stub the POST /api/posts endpoint to return a successful response so
      // we never depend on the real backend or a real file upload.
      cy.intercept("POST", "/api/posts", {
        statusCode: 201,
        body: { message: "تم إضافة الإعلان بنجاح!" },
      }).as("createPost");

      // Stub the GET /api/posts/my-posts endpoint so navigating to /profile
      // does not request the real backend and fail with a 401 using the mock token.
      cy.intercept("GET", "/api/posts/my-posts", {
        statusCode: 200,
        body: [],
      }).as("myPosts");

      cy.visit("/add-post");
    });

    it("renders the add-post form heading", () => {
      cy.contains("إضافة إعلان جديد").should("be.visible");
    });

    it("fills the form and shows a success toast after submission", () => {
      // ── WhatsApp Number ───────────────────────────────────────────────────
      cy.get('input[type="tel"]')
        .should("be.visible")
        .type("1003481108");

      // ── Category (select) ─────────────────────────────────────────────────
      cy.get('select[name="category"]')
        .should("be.visible")
        .select("اخري"); // a real <option> value in AddPostPage.jsx

      // ── Price ─────────────────────────────────────────────────────────────
      cy.get('input[name="price"]')
        .should("be.visible")
        .type("150");

      // ── Description (≥ 10 characters) ─────────────────────────────────────
      cy.get('textarea[name="description"]')
        .should("be.visible")
        .type("هذا حساب ببجي عالي المستوى ومتكامل المزايا ويحتوي على سكنات نادرة");

      // ── Image (required by the form) ──────────────────────────────────────
      // Attach a small programmatically-created fixture file so the file
      // validation passes without uploading to a real server.
      cy.get('input[type="file"]').selectFile(
        {
          contents: Cypress.Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64"),
          fileName: "test-image.png",
          mimeType: "image/png",
        },
        { force: true } // the <input> is visually hidden under its <label>
      );

      // ── Submit ────────────────────────────────────────────────────────────
      cy.contains("button", "إرسال الإعلان").click();

      // Wait for the stubbed API call
      cy.wait("@createPost");

      // React-Toastify renders the success message in a toast container.
      // The toast text comes directly from AddPostPage: toast.success("تم إضافة الإعلان بنجاح!")
      cy.contains("تم إضافة الإعلان بنجاح!").should("be.visible");
    });

    it("shows validation errors when required fields are left empty", () => {
      // Click submit without filling anything — all four field errors should appear
      cy.contains("button", "إرسال الإعلان").click();

      cy.contains("رقم الواتساب مطلوب").should("be.visible");
      cy.contains("وصف الإعلان مطلوب").should("be.visible");
      cy.contains("السعر مطلوب").should("be.visible");
      cy.contains("يجب اختيار الفئة").should("be.visible");
      cy.contains("يجب اختيار صورة واحدة على الأقل").should("be.visible");
    });
  });
});
