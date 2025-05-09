/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import "@testing-library/jest-dom";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);

      router();
      window.onNavigate(ROUTES_PATH.Bills);

      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");

      // Vérifie que l'icône des notes de frais est bien mise en surbrillance
      expect(windowIcon).toBeTruthy();
      expect(windowIcon).toHaveClass("active-icon");
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });

      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);

      const chrono = (a, b) => (a > b ? 1 : -1);
      const datesSorted = [...dates].sort(chrono);
      expect(dates).toEqual(datesSorted);
    });

    test("Then the new bill button should be displayed", () => {
      document.body.innerHTML = BillsUI({ data: bills });

      const newBillButton = screen.getByTestId("btn-new-bill");
      expect(newBillButton).toBeTruthy();
    });

    test("When I click on new bill button, I should be redirected to NewBill page", () => {
      const onNavigate = jest.fn();
      document.body.innerHTML = BillsUI({ data: bills });

      const billsContainer = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage,
      });

      const newBillButton = screen.getByTestId("btn-new-bill");
      newBillButton.addEventListener(
        "click",
        billsContainer.handleClickNewBill
      );
      fireEvent.click(newBillButton);

      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.NewBill);
    });

    test("Then eye icons should be displayed", () => {
      document.body.innerHTML = BillsUI({ data: bills });

      const iconEyes = screen.getAllByTestId("icon-eye");
      expect(iconEyes.length).toBeGreaterThan(0);
    });

    test("When I click on an eye icon, a modal should open", () => {
      $.fn.modal = jest.fn();
      document.body.innerHTML = BillsUI({ data: bills });

      const onNavigate = jest.fn();
      const billsContainer = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage,
      });

      const iconEye = screen.getAllByTestId("icon-eye")[0];
      iconEye.addEventListener("click", () =>
        billsContainer.handleClickIconEye(iconEye)
      );
      fireEvent.click(iconEye);

      expect($.fn.modal).toHaveBeenCalledWith("show");
    });

    test("When API returns an error, it should display an error message", async () => {
      mockStore.bills = jest.fn(() => ({
        list: jest.fn(() => Promise.reject(new Error("Erreur 500"))),
      }));

      document.body.innerHTML = BillsUI({ error: "Erreur 500" });

      expect(screen.getByText("Erreur 500")).toBeTruthy();
    });
  });
});

/**
 * Test d'intégration GET
 */
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills Page", () => {
    test("fetches bills from mock API GET", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();

      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.findByText("Mes notes de frais"));

      const billRows = screen.getAllByTestId("icon-eye");
      expect(billRows.length).toBeGreaterThan(0);
    });
  });

  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    });

    test("fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => Promise.reject(new Error("Erreur 404")),
        };
      });

      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = await screen.findAllByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });

    test("fetches bills from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => Promise.reject(new Error("Erreur 500")),
        };
      });

      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = await screen.getAllByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});