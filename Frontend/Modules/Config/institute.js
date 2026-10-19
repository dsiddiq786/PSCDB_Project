/* Institute details. Centres are managed in the admin panel; this list is the fallback. */
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

/* Centre for a course: the live name from the admin panel, or the built-in fallback. */
export function centreById(id, course) {
  const fallback = centres.find((centre) => centre.id === id);
  if (course?.centreName) return { id, name: course.centreName, address: course.centreAddress || fallback?.address || "" };
  return fallback;
}
