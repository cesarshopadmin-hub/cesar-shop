/// <reference types="cypress" />

describe("Home Page Flow", () => {
  it("displays the brand name 'متجر سيزار' on the home page", () => {
    // Visit the root route and assert the brand name is visible in the navbar/hero.
    cy.visit("/");
    cy.contains("متجر سيزار").should("be.visible");
  });

  it("navigates to posts page and uses search input", () => {
    // The search input lives on the Posts page (/posts), not the root route.
    cy.visit("/posts");

    // Wait for the search input to be rendered (posts may still be loading,
    // but the search bar is rendered immediately with the page shell).
    cy.get('input[placeholder="ابحث باسم المنشور أو الوصف..."]')
      .should("exist")
      .should("be.visible")
      .type("ماين كرافت")
      .should("have.value", "ماين كرافت");
  });
});

