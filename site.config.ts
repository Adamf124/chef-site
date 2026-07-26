// Fill this in once. Everything user-facing reads from here.

export const site = {
  chefName: "Chef Amos Ferguson",
  // One line, kept deliberately open. Names a few directions without
  // committing to any of them.
  tagline: "Chef. Available for private dinners, events, and catering.",
  location: "Northeast Ohio",
  // Shown in the footer and used as the reply-to context.
  contactEmail: "famasamos@gmail.com",
} as const;

// The choices in the inquiry form. Keep these broad early on; whatever gets
// picked most is the signal for where to focus. Add or remove freely.
export const interestOptions = [
  { value: "private-dinner", label: "A private dinner at my place" },
  { value: "event", label: "Cooking for an event or party" },
  { value: "catering", label: "Catering / larger order" },
  { value: "classes", label: "A cooking class or lesson" },
  { value: "other", label: "Something else" },
] as const;
