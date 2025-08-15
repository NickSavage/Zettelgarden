const zettel_env = import.meta.env.VITE_ENV || "";

/**
 * Sets the document title in a standardized format across the app.
 * @param pageTitle Optional page-specific title. If not provided, only the base title will be used.
 */
export function setDocumentTitle(pageTitle?: string) {
  const base = "Zettelgarden" + zettel_env;
  document.title = pageTitle ? `${pageTitle} - ${base}` : base;
}
