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

export const UNFILED_LOCATION = "In Process (Not yet filed)";

export const cabinetGroups = [
  {
    id: "cabinet-3-staff",
    title: "CICT Cabinet 3",
    owner: "College Staff",
    drawers: [
      { id: "CICT Cabinet 3 - D1", shortLabel: "D1", label: "CICT Cabinet 3 · D1 (College Staff)" },
      { id: "CICT Cabinet 3 - D2", shortLabel: "D2", label: "CICT Cabinet 3 · D2 (College Staff)" },
      { id: "CICT Cabinet 3 - D3", shortLabel: "D3", label: "CICT Cabinet 3 · D3 (College Staff)" },
      { id: "CICT Cabinet 3 - D4", shortLabel: "D4", label: "CICT Cabinet 3 · D4 (College Staff)" },
    ],
  },
  {
    id: "cabinet-4-sec",
    title: "CICT Cabinet 4",
    owner: "College Sec",
    drawers: [
      { id: "CICT Cabinet 4 - D1", shortLabel: "D1", label: "CICT Cabinet 4 · D1 (College Sec)" },
      { id: "CICT Cabinet 4 - D2", shortLabel: "D2", label: "CICT Cabinet 4 · D2 (College Sec)" },
      { id: "CICT Cabinet 4 - D3", shortLabel: "D3", label: "CICT Cabinet 4 · D3 (College Sec)" },
      { id: "CICT Cabinet 4 - D4", shortLabel: "D4", label: "CICT Cabinet 4 · D4 (College Sec)" },
    ],
  },
  {
    id: "cabinet-dean",
    title: "College Dean Cabinet",
    owner: "College Dean",
    drawers: [
      {
        id: "College Dean - Instruction",
        shortLabel: "Instruction",
        label: "College Dean · Instruction",
      },
      {
        id: "College Dean - Research & Extension",
        shortLabel: "Research & Extension",
        label: "College Dean · Research & Extension",
      },
      {
        id: "College Dean - Administration",
        shortLabel: "Administration",
        label: "College Dean · Administration",
      },
    ],
  },
];

export const cabinetLocations = [
  UNFILED_LOCATION,
  ...cabinetGroups.flatMap((group) => group.drawers.map((drawer) => drawer.id)),
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
  fileLocation: UNFILED_LOCATION,
});
