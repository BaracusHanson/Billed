import { ROUTES_PATH } from "../constants/routes.js";
import Logout from "./Logout.js";

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    const formNewBill = this.document.querySelector(
      `form[data-testid="form-new-bill"]`
    );
    formNewBill.addEventListener("submit", this.handleSubmit);
    const file = this.document.querySelector(`input[data-testid="file"]`);
    file.addEventListener("change", this.handleChangeFile);
    this.fileUrl = null;
    this.fileName = null;
    this.billId = null;
    new Logout({ document, localStorage, onNavigate });
  }
  handleChangeFile = (e) => {
    e.preventDefault();
    const file = this.document.querySelector(`input[data-testid="file"]`)
      .files[0];
    const filePath = e.target.value.split(/\\/g);
    const fileName = filePath[filePath.length - 1];
    const fileExtension = fileName.split(".").pop().toLowerCase();
 

    const validExtensions = ["jpg", "jpeg", "png"];
    if (!validExtensions.includes(fileExtension)) {
      alert(
        "Type de fichier invalide. Veuillez télécharger un fichier avec l'une des extensions suivantes : jpg, jpeg, png."
      );
      e.target.value = ""; // Réinitialise l'input après erreur
      console.log("Input file has been reset: ", e.target.value); // Vérifie si la réinitialisation est bien effectuée
      return;
    }

    const formData = new FormData();
    const email = JSON.parse(localStorage.getItem("user")).email;
    formData.append("file", file);
    formData.append("email", email);

    this.store
      .bills()
      .create({
        data: formData,
        headers: {
          noContentType: true,
        },
      })
      .then(({ fileUrl, key }) => {
        console.log(fileUrl);
        this.billId = key;
        this.fileUrl = fileUrl;
        this.fileName = fileName;
      })
      .catch((error) => console.error(error));
  };

  handleSubmit = (e) => {
    e.preventDefault();

    // Récupérer les valeurs des champs du formulaire
    const expenseName = e.target.querySelector(
      `input[data-testid="expense-name"]`
    ).value;
    const amount = e.target.querySelector(`input[data-testid="amount"]`).value;
    const date = e.target.querySelector(
      `input[data-testid="datepicker"]`
    ).value;
    const expenseType = e.target.querySelector(
      `select[data-testid="expense-type"]`
    ).value;

    // Vérifier si tous les champs obligatoires sont remplis
    if (!expenseName || !amount || !date || !expenseType) {
      window.alert("Tous les champs obligatoires doivent être remplis.");
      return; // Arrêter l'exécution si un champ est vide
    }

    // Si tous les champs sont valides, poursuivre avec la soumission
    const email = JSON.parse(localStorage.getItem("user")).email;
    const bill = {
      email,
      type: expenseType,
      name: expenseName,
      amount: parseInt(amount),
      date,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct:
        parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) ||
        20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`)
        .value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: "pending",
    };

    // Appeler la méthode pour mettre à jour la facture
    this.updateBill(bill);

    // Naviguer vers la page des factures après la soumission
    this.onNavigate(ROUTES_PATH["Bills"]);
  };

  // not need to cover this function by tests
  updateBill = (bill) => {
    console.log();
    if (this.store) {
      this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: this.billId })
        .then(() => {
          this.onNavigate(ROUTES_PATH["Bills"]);
        })
        // .catch((error) => console.error(error));
    }
  };
}
