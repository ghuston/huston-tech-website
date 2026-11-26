import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { FormDefinition } from "./schema.ts";
import { dataKindLabel, dataKinds, healthTerm, newDataKinds, refusedTerm } from "./sensitive.ts";

const form = (fields: FormDefinition["fields"], status: FormDefinition["status"] = "live"): FormDefinition => ({ name: "F", status, fields, button: "Go", thanks: "Thanks" });
const email = { id: "email", type: "email", label: "Email", required: true } as const;

describe("refusedTerm", () => {
  test("card, bank, ID and password words are refused, whatever the case", () => {
    for (const text of [
      "Card number",
      "Your credit card",
      "DEBIT CARD",
      "CVV",
      "cvc",
      "Security code",
      "Expiry date",
      "Expiration date",
      "Account number",
      "Routing number",
      "Sort code",
      "IBAN",
      "Social security number",
      "SSN",
      "National Insurance number",
      "Passport number",
      "Passport no.",
      "Driver's licence number",
      "Driver’s license number",
      "Tax ID",
      "TIN",
      "National ID",
      "ID number",
      "Password",
      "Your PIN",
    ]) {
      assert.notEqual(refusedTerm(text), null, text);
    }
  });
  test("ordinary words are not refused", () => {
    for (const text of ["Your name", "Email", "Project type", "Tell me about the project", "Pinterest board", "Identification of the room", "Business address", "Token of thanks", "Tin roof or slate?", "Bowling pins", "Pin a time that suits you", "Do you have a valid passport?"]) {
      assert.equal(refusedTerm(text), null, text);
    }
  });
  test("names the term", () => assert.equal(refusedTerm("Enter your card number"), "card number"));
});

describe("healthTerm", () => {
  test("health words are found", () => {
    for (const text of ["health", "Medical history", "diagnosis", "Any medical conditions?", "medication", "prescription", "symptoms", "Allergies", "disability", "mental health", "therapy", "pregnancy", "injury"]) {
      assert.notEqual(healthTerm(text), null, text);
    }
  });
  test("other words are not", () => {
    for (const text of ["Your name", "Project type", "healthy lunch", "Wellness", "I agree to the terms and conditions", "Condition of the car"]) assert.equal(healthTerm(text), null, text);
  });
});

describe("dataKinds", () => {
  test("maps fields to kinds, in a fixed order, each once", () => {
    const def = form([
      { id: "m", type: "long-text", label: "M", required: true },
      email,
      { id: "n", type: "short-text", label: "N", required: true, purpose: "name" },
      { id: "n2", type: "short-text", label: "N2", required: false },
      { id: "q", type: "dropdown", label: "Q", required: false, options: ["a", "b"] },
      { id: "c", type: "consent", label: "C", required: false },
      { id: "b", type: "short-text", label: "B", required: false, purpose: "organization" },
      { id: "w", type: "short-text", label: "W", required: false, purpose: "website" },
      { id: "a", type: "short-text", label: "A", required: false, purpose: "address" },
      { id: "p", type: "phone", label: "P", required: false },
    ]);
    assert.deepEqual(dataKinds(def), ["name", "email", "phone", "address", "business", "website", "message", "answers", "consent"]);
  });
  test("labels are plain plurals", () => {
    assert.equal(dataKindLabel("address"), "postal addresses");
    assert.equal(dataKindLabel("answers"), "answers to questions");
  });
});

describe("newDataKinds", () => {
  const nameField = { id: "n", type: "short-text", label: "N", required: true, purpose: "name" } as const;
  test("lists kinds only live forms in `after` collect and no live form in `before` did", () => {
    const before = [form([email])];
    const after = [form([email]), form([email, nameField, { id: "p", type: "phone", label: "P", required: false }])];
    assert.deepEqual(newDataKinds(before, after), ["name", "phone"]);
  });
  test("a kind another live form already collected is not new", () => {
    assert.deepEqual(newDataKinds([form([email, nameField])], [form([email, nameField]), form([email, nameField])]), []);
  });
  test("archived forms collect nothing, before or after", () => {
    assert.deepEqual(newDataKinds([form([email, nameField], "archived")], [form([email])]), ["email"]);
    assert.deepEqual(newDataKinds([form([email])], [form([email, nameField], "archived")]), []);
    assert.deepEqual(newDataKinds([form([email, nameField], "archived")], [form([email, nameField])]), ["name", "email"]);
  });
  test("no forms before: every kind is new", () => assert.deepEqual(newDataKinds([], [form([email])]), ["email"]));
});
