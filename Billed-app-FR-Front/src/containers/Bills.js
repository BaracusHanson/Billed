import { ROUTES_PATH } from "../constants/routes.js";
import { formatDate, formatStatus } from "../app/format.js";
import Logout from "./Logout.js";

export default class {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    const buttonNewBill = document.querySelector(
      `button[data-testid="btn-new-bill"]`
    );
    if (buttonNewBill)
      buttonNewBill.addEventListener("click", this.handleClickNewBill);
    const iconEye = document.querySelectorAll(`div[data-testid="icon-eye"]`);
    if (iconEye)
      iconEye.forEach((icon) => {
        icon.addEventListener("click", () => this.handleClickIconEye(icon));
      });
    new Logout({ document, localStorage, onNavigate });
  }

  handleClickNewBill = () => {
    this.onNavigate(ROUTES_PATH["NewBill"]);
  };

  handleClickIconEye = (icon) => {
    const billUrl = icon.getAttribute("data-bill-url");
    const imgWidth = Math.floor($("#modaleFile").width() * 0.5);
    $("#modaleFile")
      .find(".modal-body")
      .html(
        `<div style='text-align: center;' class="bill-proof-container"><img width=${imgWidth} src=${billUrl} alt="Bill" /></div>`
      );
    $("#modaleFile").modal("show");
  };

  getBills = () => {
    return this.store
      .bills()
      .list()
      .then((snapshot) => {
        const bills = snapshot.map((doc) => {
          // console.log(doc.date);
          try {
            const rawDate = new Date(doc.date);
            if (isNaN(rawDate.getTime())) throw new Error("Invalid date");

            return {
              ...doc,
              date: formatDate(doc.date),
              rawDate,
              status: formatStatus(doc.status),
            };
          } catch (e) {
            console.error("Error processing bill:", e, doc);
            return {
              ...doc,
              date: "Invalid Date",
              rawDate: new Date(0),
              status: formatStatus(doc.status),
            };
          }
        });

        // Tri **ascendant** (du plus ancien au plus récent)
        bills.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());

        console.log("Sorted bills:", bills);
        console.log("Total bills:", bills.length);

        return bills;
      });
  };
}
