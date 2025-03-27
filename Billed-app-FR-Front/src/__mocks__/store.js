const mockedBills = {
  list() {
    return Promise.resolve([
      {
        id: "47qAXb6fIm2zOKkLzMro",
        vat: "80",
        fileUrl:
          "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
        status: "pending",
        type: "Hôtel et logement",
        commentary: "séminaire billed",
        name: "encore",
        fileName: "preview-facture-free-201801-pdf-1.jpg",
        date: "2004-04-04",
        amount: 400,
        commentAdmin: "ok",
        email: "a@a",
        pct: 20,
      },
    ]);
  },
  // Simule un appel réussi
  create: jest.fn(() => Promise.resolve({
    fileUrl: "https://localhost:3456/images/test.jpg",
    key: "1234",
  })),
  // Simule une erreur lors de l'upload
  createFail: jest.fn(() => Promise.reject(new Error("API Error"))),
  update: jest.fn(() => Promise.resolve({
    id: "47qAXb6fIm2zOKkLzMro",
    vat: "80",
    fileUrl: "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
    status: "pending",
    type: "Hôtel et logement",
    commentary: "séminaire billed",
    name: "encore",
    fileName: "preview-facture-free-201801-pdf-1.jpg",
    date: "2004-04-04",
    amount: 400,
    commentAdmin: "ok",
    email: "a@a",
    pct: 20,
  })),
};

export default {
  bills() {
    return mockedBills;
  },
};
