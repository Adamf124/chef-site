// One formatter for both admin surfaces. Locale and timeZone are explicit on
// purpose: a bare toLocaleString() formats with the server's locale during SSR
// and the browser's on hydration, which React reports as a mismatch. Change the
// zone here and every admin screen follows — it used to be declared separately
// in each one.
export const adminDateTime = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/New_York",
});
