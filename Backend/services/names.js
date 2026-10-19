/* Capitalises personal and place names consistently: "ayesha KHAN" becomes "Ayesha Khan".
   Names already written in mixed case (such as "McDonald") keep their inner capitals. */
export function properName(value) {
  if (typeof value !== "string") return value;
  const clean = value.trim().replace(/\s+/g, " ");
  return clean
    .split(" ")
    .map((word) => {
      const mixed = word !== word.toLowerCase() && word !== word.toUpperCase();
      const base = mixed ? word : word.toLowerCase();
      // Capitalise after hyphens and apostrophes too: "abdul-rahman" -> "Abdul-Rahman", "o'neil" -> "O'Neil".
      return base.replace(/(^|[-'’])(\p{L})/gu, (_, sep, letter) => sep + letter.toUpperCase());
    })
    .join(" ");
}
