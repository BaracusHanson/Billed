/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import mockStore from "../__mocks__/store";
import { ROUTES } from "../constants/routes";

jest.mock("../app/Store", () => mockStore);

describe("Given I am connected as an employee", () => {
  // Espionner console.error avant chaque test
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {}); // Espionner console.error
  });

  describe("When I am on NewBill Page", () => {
    test("Then the NewBill form should be rendered", () => {
      document.body.innerHTML = NewBillUI();
      const form = screen.getByTestId("form-new-bill");
      expect(form).toBeTruthy();
    });

    test("Then all form inputs should be present", () => {
      document.body.innerHTML = NewBillUI();

      expect(screen.getByTestId("expense-name")).toBeTruthy();
      expect(screen.getByTestId("datepicker")).toBeTruthy();
      expect(screen.getByTestId("amount")).toBeTruthy();
      expect(screen.getByTestId("vat")).toBeTruthy();
      expect(screen.getByTestId("pct")).toBeTruthy();
      expect(screen.getByTestId("commentary")).toBeTruthy();
      expect(screen.getByTestId("file")).toBeTruthy();
    });

    test("Then uploading a valid file should call store.bills().create()", async () => {
      document.body.innerHTML = NewBillUI();

      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      const fileInput = screen.getByTestId("file");
      const validFile = new File(["image"], "test.png", { type: "image/png" });

      Object.defineProperty(fileInput, "files", {
        value: [validFile],
      });

      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      fileInput.addEventListener("change", handleChangeFile);
      fireEvent.change(fileInput);

      expect(handleChangeFile).toHaveBeenCalled();
      await waitFor(() => expect(mockStore.bills().create).toHaveBeenCalled());
    });

    test("Then uploading an invalid file should show an alert", () => {
      document.body.innerHTML = NewBillUI();
      window.alert = jest.fn();

      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      const fileInput = screen.getByTestId("file");
      const invalidFile = new File(["text"], "test.txt", {
        type: "text/plain",
      });

      Object.defineProperty(fileInput, "files", {
        value: [invalidFile],
      });

      fireEvent.change(fileInput);
      expect(window.alert).toHaveBeenCalledWith(
        "Type de fichier invalide. Veuillez télécharger un fichier avec l'une des extensions suivantes : jpg, jpeg, png."
      );
    });

    test("Then submitting a valid bill should call the API and navigate", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ email: "employee@test.tld" })
      );

      document.body.innerHTML = NewBillUI();
      const onNavigate = jest.fn();

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      fireEvent.input(screen.getByTestId("expense-name"), {
        target: { value: "Restaurant" },
      });
      fireEvent.input(screen.getByTestId("amount"), {
        target: { value: "50" },
      });
      fireEvent.input(screen.getByTestId("datepicker"), {
        target: { value: "2024-02-10" },
      });
      fireEvent.change(screen.getByTestId("expense-type"), {
        target: { value: "Transport" },
      });

      const handleSubmit = jest.fn(newBill.handleSubmit);
      const form = screen.getByTestId("form-new-bill");
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);

      await waitFor(() => expect(mockStore.bills().update).toHaveBeenCalled());
      expect(onNavigate).toHaveBeenCalledWith(ROUTES.Bills);
    });

    // Nouveau test : vérifier comportement sans fichier
    test("Then submitting without a file should show an alert", () => {
      document.body.innerHTML = NewBillUI();
      window.alert = jest.fn();

      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      fireEvent.input(screen.getByTestId("expense-name"), {
        target: { value: "Restaurant" },
      });
      fireEvent.input(screen.getByTestId("amount"), {
        target: { value: "50" },
      });
      fireEvent.input(screen.getByTestId("datepicker"), {
        target: { value: "2024-02-10" },
      });

      const form = screen.getByTestId("form-new-bill");
      fireEvent.submit(form);

      expect(window.alert).toHaveBeenCalledWith(
        "Veuillez télécharger un fichier."
      );
    });

    // Nouveau test : simuler une erreur d'API sur l'upload
    test("Then an API error during file upload should log an error", async () => {
      // Simule un utilisateur connecté
      localStorage.setItem(
        "user",
        JSON.stringify({ email: "employee@test.tld" })
      );

      document.body.innerHTML = NewBillUI();
      const onNavigate = jest.fn();

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Remplacez `create` par `createFail` pour simuler une erreur lors de l'upload
      const mockCreateFail = mockStore.bills().createFail;

      // Espionner console.error pour vérifier que l'erreur est bien loggée
      jest.spyOn(console, "error").mockImplementation(() => {});

      const fileInput = screen.getByTestId("file");
      const invalidFile = new File(["invalid"], "test.pdf", {
        type: "application/pdf",
      });

      Object.defineProperty(fileInput, "files", {
        value: [invalidFile],
      });

      // Simuler l'upload d'un fichier invalide
      fireEvent.change(fileInput);

      // Vérifie que l'API a bien échoué
      await waitFor(() => expect(mockCreateFail).toHaveBeenCalled());

      // Vérifie que l'erreur a bien été loggée dans la console
      expect(console.error).toHaveBeenCalledWith(new Error("API Error"));
    });

    // Nouveau test : validation des champs vides
    test("Then submitting with empty fields should show an alert", () => {
      document.body.innerHTML = NewBillUI();

      // Mock de l'alerte pour vérifier son appel
      window.alert = jest.fn();

      // Créer une instance du composant NewBill
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Remplir le formulaire avec des valeurs vides
      fireEvent.input(screen.getByTestId("expense-name"), {
        target: { value: "" }, // Le champ "expense-name" est vide
      });
      fireEvent.input(screen.getByTestId("amount"), {
        target: { value: "" }, // Le champ "amount" est vide
      });
      fireEvent.input(screen.getByTestId("datepicker"), {
        target: { value: "" }, // Le champ "datepicker" est vide
      });
      fireEvent.change(screen.getByTestId("expense-type"), {
        target: { value: "" }, // Le champ "expense-type" est vide
      });

      // Soumettre le formulaire
      const form = screen.getByTestId("form-new-bill");
      fireEvent.submit(form);

      // Vérifier que l'alerte a été appelée avec le bon message
      expect(window.alert).toHaveBeenCalledWith(
        "Tous les champs obligatoires doivent être remplis."
      );
    });
  });

  describe("When I submit a valid new bill", () => {
    test("Then it should send a POST request to the API and navigate to the Bills page", async () => {
      // Simule un utilisateur connecté
      localStorage.setItem(
        "user",
        JSON.stringify({ email: "employee@test.tld" })
      );

      document.body.innerHTML = NewBillUI();
      const onNavigate = jest.fn();

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Remplir le formulaire avec des données valides
      fireEvent.input(screen.getByTestId("expense-name"), {
        target: { value: "Restaurant" },
      });
      fireEvent.input(screen.getByTestId("amount"), {
        target: { value: "50" },
      });
      fireEvent.input(screen.getByTestId("datepicker"), {
        target: { value: "2024-02-10" },
      });
      fireEvent.change(screen.getByTestId("expense-type"), {
        target: { value: "Transport" },
      });

      const fileInput = screen.getByTestId("file");
      const validFile = new File(["image"], "test.png", { type: "image/png" });

      Object.defineProperty(fileInput, "files", {
        value: [validFile],
      });

      fireEvent.change(fileInput);

      // Soumission du formulaire
      const handleSubmit = jest.fn(newBill.handleSubmit);
      const form = screen.getByTestId("form-new-bill");
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);

      // **PARTIE POST : Vérification de l'appel à l'API**
      await waitFor(() => expect(mockStore.bills().create).toHaveBeenCalled());
      expect(mockStore.bills().create).toHaveBeenCalledWith({
        data: expect.any(FormData),
        headers: { noContentType: true },
      });

      // Vérification de la navigation
      expect(onNavigate).toHaveBeenCalledWith(ROUTES.Bills);
    });
  });
});
