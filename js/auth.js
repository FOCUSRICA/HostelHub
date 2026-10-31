
import { supabase } from "./supabase.js";

const byId = id => document.getElementById(id);

const signInForm = byId("signin-form");
const registerForm = byId("register-form");
const applicationForm = byId("application-form");
const applicationHostel = byId("application-hostel");

const authForms = byId("auth-forms");
const studentAccount = byId("student-account");
const applicationLoginNote = byId("application-login-note");

let currentUser = null;

function message(id, text) {
  const element = byId(id);
  if (element) element.textContent = text;
}

function errorMessage(error) {
  console.error(error);
  const text = (error?.message || "").toLowerCase();

  if (text.includes("invalid login credentials")) {
    return "Email or password is incorrect.";
  }
  if (text.includes("already registered")) {
    return "This email may already be registered. Please sign in.";
  }
  if (text.includes("row-level security") || text.includes("permission denied")) {
    return "Access denied by database security settings.";
  }

  return error?.message || "Something went wrong. Please try again.";
}

/* Load real active hostels from Supabase. */
async function populateHostels() {
  if (!applicationHostel) return;

  applicationHostel.replaceChildren(
    new Option("Loading hostels...", "")
  );

  const { data, error } = await supabase
    .from("hostels")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  applicationHostel.replaceChildren(
    new Option("Choose a hostel", "")
  );

  if (error) {
    message("application-feedback", errorMessage(error));
    return;
  }

  if (!data || data.length === 0) {
    applicationHostel.replaceChildren(
      new Option("No live hostels available yet", "")
    );
    message(
      "application-feedback",
      "No live hostel listings are available yet."
    );
    return;
  }

  data.forEach(hostel => {
    applicationHostel.add(
      new Option(hostel.name, hostel.id)
    );
  });
}

/* Register a new student account. */
registerForm?.addEventListener("submit", async event => {
  event.preventDefault();

  const email = byId("register-email")?.value.trim();
  const password = byId("register-password")?.value;

  if (!email || !password) {
    message("register-feedback", "Enter your email and password.");
    return;
  }

  message("register-feedback", "Creating account...");

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) throw error;

    if (data.session) {
      const { error: signOutError } =
        await supabase.auth.signOut();

      if (signOutError) throw signOutError;
    }

    registerForm.reset();

    message(
      "register-feedback",
      data.session
        ? "Registration successful. Please sign in."
        : "Registration received. Check your email if confirmation is required, then sign in."
    );
  } catch (error) {
    message("register-feedback", errorMessage(error));
  }
});

/* Sign in. */
signInForm?.addEventListener("submit", async event => {
  event.preventDefault();

  const email = byId("signin-email")?.value.trim();
  const password = byId("signin-password")?.value;

  if (!email || !password) {
    message("signin-feedback", "Enter your email and password.");
    return;
  }

  message("signin-feedback", "Signing in...");

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    signInForm.reset();
    message("signin-feedback", "Signed in successfully.");
  } catch (error) {
    message("signin-feedback", errorMessage(error));
  }
});

/* Load a student's applications. */
async function loadApplications(user) {
  const list = byId("application-status-list");

  if (list) list.replaceChildren();

  message("application-status-message", "Loading applications...");

  const { data, error } = await supabase
    .from("applications")
    .select("id, reference, status, created_at, hostels(name)")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    message("application-status-message", errorMessage(error));
    return;
  }

  if (!data || data.length === 0) {
    message(
      "application-status-message",
      "You have not submitted any applications yet."
    );
    return;
  }

  data.forEach(application => {
    const item = document.createElement("li");
    const heading = document.createElement("strong");
    const details = document.createElement("p");

    const hostel = Array.isArray(application.hostels)
      ? application.hostels[0]
      : application.hostels;

    heading.textContent = hostel?.name || "Accommodation application";
    details.textContent =
      `Reference: ${application.reference} · Status: ${application.status}`;

    item.append(heading, details);
    list?.appendChild(item);
  });

  message(
    "application-status-message",
    "Your application records are up to date."
  );
}

/* Update the account interface when signed in or out. */
async function updateAccount(user) {
  currentUser = user || null;
  const signedIn = Boolean(user);

  if (authForms) authForms.hidden = signedIn;
  if (studentAccount) studentAccount.hidden = !signedIn;
  if (applicationForm) applicationForm.hidden = !signedIn;
  if (applicationLoginNote) applicationLoginNote.hidden = signedIn;

  message(
    "student-email",
    signedIn ? `Signed in as ${user.email || "student"}` : ""
  );

  message(
    "account-feedback",
    signedIn ? "You can now track your applications." : ""
  );

  await populateHostels();

  if (user) await loadApplications(user);
}

/* Sign out. */
byId("signout-button")?.addEventListener("click", async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    message("account-feedback", errorMessage(error));
  } else {
    message("signin-feedback", "You have signed out.");
  }
});

/* Submit a student application. */
applicationForm?.addEventListener("submit", async event => {
  event.preventDefault();

  if (!currentUser) {
    message("application-feedback", "Please sign in first.");
    return;
  }

  const fullName = byId("application-name")?.value.trim();
  const phone = byId("application-phone")?.value.trim();
  const hostelId = applicationHostel?.value;

  if (!fullName || !phone || !hostelId) {
    message("application-feedback", "Complete all fields and choose a hostel.");
    return;
  }

  message("application-feedback", "Submitting application...");

  try {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) throw sessionError;

    if (sessionData.session?.user?.id !== currentUser.id) {
      throw new Error("Please sign in again.");
    }

    const { data: existing, error: checkError } = await supabase
      .from("applications")
      .select("id")
      .eq("student_id", currentUser.id)
      .eq("hostel_id", hostelId)
      .eq("status", "pending")
      .limit(1);

    if (checkError) throw checkError;

    if (existing?.length) {
      message(
        "application-feedback",
        "You already have a pending application for this hostel."
      );
      return;
    }

    const { data, error } = await supabase
      .from("applications")
      .insert({
        student_id: currentUser.id,
        hostel_id: hostelId,
        full_name: fullName,
        phone,
        status: "pending"
      })
      .select("id, reference")
      .single();

    if (error) throw error;

    const reference = byId("application-success-reference");
    if (reference) reference.textContent = data.reference;

    const success = byId("application-success");
    if (success) {
      success.hidden = false;
      success.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }

    applicationForm.reset();

    message(
      "application-feedback",
      `Application submitted! Reference: ${data.reference}`
    );

    await loadApplications(currentUser);
  } catch (error) {
    message("application-feedback", errorMessage(error));
  }
});

/* Apply from the existing listing dialog. */
byId("dialog-apply")?.addEventListener("click", async () => {
  const dialog = byId("listing-dialog");
  const title = byId("dialog-title")?.textContent?.trim();

  await populateHostels();

  const option = [...(applicationHostel?.options || [])]
    .find(item => item.textContent.trim() === title);

  if (option && applicationHostel) {
    applicationHostel.value = option.value;
  }

  dialog?.close();

  byId("application-form-section")?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  if (!currentUser) {
    message(
      "application-feedback",
      "Please sign in or register before applying."
    );
  }
});

/* Dismiss the success panel. */
byId("application-success-dismiss")?.addEventListener("click", () => {
  const panel = byId("application-success");
  if (panel) panel.hidden = true;
});

/* Restore the existing Supabase session. */
supabase.auth.onAuthStateChange((_event, session) => {
  setTimeout(() => {
    updateAccount(session?.user || null).catch(error => {
      console.error("Account loading failed:", error);
    });
  }, 0);
});

supabase.auth.getSession().then(({ data, error }) => {
  if (error) throw error;
  return updateAccount(data.session?.user || null);
}).catch(error => {
  message("signin-feedback", errorMessage(error));
});
