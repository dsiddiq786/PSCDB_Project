/* Institute details. Centres will later be managed from the admin panel. */
export const institute = {
  name: "Professional Skills and Community Development Board",
  shortName: "PSCDB",
  email: "info@pscdb.org",
  // Students sign in to the learning platform here after enrolment.
  lmsUrl: "https://lms.pscdb.org",
};

export const centres = [
  {
    id: "sahiwal",
    name: "Sahiwal Centre",
    address: "Office No. 11, 1st Floor, Star Complex, Stadium Road, Sahiwal, Pakistan",
  },
];

export function centreById(id) {
  return centres.find((centre) => centre.id === id);
}
