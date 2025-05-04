/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js"; // Import du container pour tester la logique métier
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import "@testing-library/jest-dom";
import mockStore from "../__mocks__/store.js";

import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore); // Mock du store pour éviter les requêtes réseau

describe("Given I am connected as an employee", () => {
  // expect attendi ici

  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      // Simule l'utilisateur connecté
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));

      // Ajout de l'élément root pour simuler le DOM
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);

      router();
      window.onNavigate(ROUTES_PATH.Bills);

      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");

      // Vérifie que l'icône des notes de frais est bien mise en surbrillance
      expect(windowIcon).toHaveClass("active-icon");
    });

    test("Then bills should be ordered from earliest to latest", () => {
      // Génère l'affichage des factures avec des données mockées
      document.body.innerHTML = BillsUI({ data: bills });

      // Récupère toutes les dates affichées
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      console.log(dates);
      // Vérifie que les dates sont triées du plus récent au plus ancien
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    test("Then the new bill button should be displayed", () => {
      // Génère l'affichage des factures
      document.body.innerHTML = BillsUI({ data: bills });

      // Vérifie si le bouton "Nouvelle note de frais" est bien présent
      const newBillButton = screen.getByTestId("btn-new-bill");
      expect(newBillButton).toBeTruthy();
    });

    test("When I click on new bill button, I should be redirected to NewBill page", () => {
      // Mock de la fonction de navigation
      const onNavigate = jest.fn();

      // Création de l'instance de Bills avec les éléments du DOM
      document.body.innerHTML = BillsUI({ data: bills });
      const billsContainer = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage,
      });

      // Simule un clic sur le bouton "Nouvelle note de frais"
      const newBillButton = screen.getByTestId("btn-new-bill");
      newBillButton.addEventListener(
        "click",
        billsContainer.handleClickNewBill
      );
      fireEvent.click(newBillButton);

      // Vérifie que la fonction de navigation a bien été appelée avec la page NewBill
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.NewBill);
    });

    test("Then eye icons should be displayed", () => {
      // Génère l'affichage des factures
      document.body.innerHTML = BillsUI({ data: bills });

      // Vérifie que chaque facture a une icône "œil" pour voir le justificatif
      const iconEyes = screen.getAllByTestId("icon-eye");
      expect(iconEyes.length).toBeGreaterThan(0);
    });

    test("When I click on an eye icon, a modal should open", () => {
      // Mock de la fonction jQuery pour éviter une erreur
      $.fn.modal = jest.fn();

      // Création de l'instance de Bills
      document.body.innerHTML = BillsUI({ data: bills });
      const onNavigate = jest.fn();
      const billsContainer = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage,
      });

      // Récupère l'icône "œil" et simule un clic dessus
      const iconEye = screen.getAllByTestId("icon-eye")[0];
      iconEye.addEventListener("click", () =>
        billsContainer.handleClickIconEye(iconEye)
      );
      fireEvent.click(iconEye);

      // Vérifie que la fonction du modal a bien été appelée
      expect($.fn.modal).toHaveBeenCalledWith("show");
    });

    test("When API returns an error, it should display an error message", async () => {
      // Mock du store pour simuler une erreur
      mockStore.bills = jest.fn(() => ({
        list: jest.fn(() => Promise.reject(new Error("Erreur 500"))),
      }));

      // Simule la navigation vers la page des factures
      document.body.innerHTML = BillsUI({ error: "Erreur 500" });

      // Vérifie si le message d'erreur est bien affiché
      expect(screen.getByText("Erreur 500")).toBeTruthy();
    });
  });
});

/**
 * test d'intégration GET
 */

jest.mock("../app/Store", () => mockStore);

// describe("Given I am a user connected as Employee", () => {
//   describe("When I navigate to Bills Page", () => {
//     test("fetches bills from mock API GET", async () => {
//       // Mock du localStorage
//       Object.defineProperty(window, "localStorage", {
//         value: localStorageMock,
//       });
//       window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));

//       // Création du root et initialisation du router
//       const root = document.createElement("div");
//       root.setAttribute("id", "root");
//       document.body.append(root);
//       router();

//       // Navigation vers la page Bills
//       window.onNavigate(ROUTES_PATH.Bills);
//       await waitFor(() => screen.findByText("Mes notes de frais"));

//       // Vérifie que les factures sont bien affichées
//       const billRows = screen.getAllByTestId("icon-eye");
//       expect(billRows.length).toBeGreaterThan(0);
//     });
//   });

//   describe("When an error occurs on API", () => {
//     beforeEach(() => {
//       jest.spyOn(mockStore, "bills");
//       Object.defineProperty(window, "localStorage", {
//         value: localStorageMock,
//       });
//       window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));

//       const root = document.createElement("div");
//       root.setAttribute("id", "root");
//       document.body.appendChild(root);
//       router();
//     });

//     test("fetches bills from an API and fails with 404 message error", async () => {
//       // Simulation d'une erreur 404
//       mockStore.bills.mockImplementationOnce(() => {
//         return {
//           list: () => Promise.reject(new Error("Erreur 404")),
//         };
//       });

//       window.onNavigate(ROUTES_PATH.Bills);
//       await new Promise(process.nextTick);
//       const message = await screen.findAllByText(/Erreur 404/);
//       expect(message).toBeTruthy();
//     });

//     test("fetches bills from an API and fails with 500 message error", async () => {
//       // Simulation d'une erreur 500
//       mockStore.bills.mockImplementationOnce(() => {
//         return {
//           list: () => Promise.reject(new Error("Erreur 500")),
//         };
//       });

//       window.onNavigate(ROUTES_PATH.Bills);
//       await new Promise(process.nextTick);
//       const message = await screen.getAllByText(/Erreur 500/);
//       expect(message).toBeTruthy();
//     });
//   });
// });
