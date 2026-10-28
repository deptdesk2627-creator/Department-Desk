export const outgoingStatuses = [
  "Pending",
  "Under Review",
  "Action Needed",
  "Approved",
  "Archived",
];

export const incomingStatuses = [
  "Received",
  "For Signature",
  "Signed by Office",
  "Sent Out",
  "Archived",
];

export const offices = [
  "Registrar",
  "Office of the President",
  "Dean's Office",
  "Secretary's Office",
  "Finance Office",
  "Facilities Office",
  "HR Office",
  "Other",
];

export const categories = ["Document", "Request"];

export const signatureOptions = [
  "Unsigned",
  "Signed by Secretary",
  "Signed by Dean",
  "Signed by Both",
];

export const forwardedDestinations = [
  "Not sent out",
  "Returned to Sender",
  ...offices,
];

export const emptyForm = (direction = "outgoing") => ({
  direction,
  dateTime: new Date().toISOString().slice(0, 16),
  description: "",
  document: "",
  student: "",
  office: "Registrar",
  type: "Document",
  status: direction === "incoming" ? "Received" : "Pending",
  signedByOffice: "Unsigned",
  forwardedTo: "Not sent out",
});
