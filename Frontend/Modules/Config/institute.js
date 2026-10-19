/* Institute details. Centres are managed in the admin panel; this list is the fallback. */
export const institute = {
  name: "Professional Skills and Community Development Board",
  shortName: "PSCDB",
  email: "info@pscdb.org",
  // The student learning platform. Links to it stay hidden while this is empty; set it to
  // "https://lms.pscdb.org" once that site is live.
  lmsUrl: "",
};

export const centres = [
  {
    id: "sahiwal",
    name: "Sahiwal Center",
    address: "Office No. 11, 1st Floor, Star Complex, Stadium Road, Sahiwal, Pakistan",
  },
];

/* Centre for a course: the live name from the admin panel, or the built-in fallback. */
export function centreById(id, course) {
  const fallback = centres.find((centre) => centre.id === id);
  if (course?.centreName) return { id, name: course.centreName, address: course.centreAddress || fallback?.address || "" };
  return fallback;
}
