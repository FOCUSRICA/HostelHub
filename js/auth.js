
import { auth, db, authReady } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

import {
  ref,
  push,
  set,
  get,
  onValue,
  remove,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js";

const byId = id => document.getElementById(id);

const signInForm = byId("signin-form");
const registerForm = byId("register-form");
const applicationForm = byId("application-form");
const applicationHostel = byId("application-hostel");

const authForms = byId("auth-forms");
const studentAccount = byId("student-account");
const applicationLoginNote = byId("application-login-note");

let currentUser = null;
let stopApplicationListener = null;
let submittingApplication = false;

function showMessage(id, message) {
  const element = byId(id);
  if (element) element.textContent = message;
}

function friendlyError(error) {
  const messages = {
    "auth/email-already-in-use": "An account already exists for this email. Please sign in.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/weak-password": "Choose a stronger password with at least 6 characters.",
    "auth/too-many-requests": "Too many attempts. Please wait and try again.",
    "auth/network-request-failed": "Network error. Check your internet connection.",
    "auth/operation-not-allowed": "Email/Password sign-in is not enabled in Firebase.",
    "PERMISSION_DENIED": "Access denied by the database security rules."
  };

  return messages[error.code] ||
    "Something went wrong. Please try again.";
}

/* Fill the hostel dropdown using existing listing cards. */
function populateHostels() {
  if (!applicationHostel) return;

  const previousValue = applicationHostel.value;
  const listings = [...document.querySelectorAll(".hostel-card")];

  applicationHostel.replaceChildren(
    new Option("Choose a hostel", "")
  );

  listings.forEach(card => {
    const heading = card.querySelector("h3");
    if (!heading) return;

    const name = heading.textContent.trim();
    const id = card.dataset.id || name;

    applicationHostel.add(
      new Option(name, id)
    );
  });

  if ([...applicationHostel.options].some(
    option => option.value === previousValue
  )) {
    applicationHostel.value = previousValue;
  }
}

populateHostels();


/* Register first, then require manual sign-in. */
registerForm?.addEventListener("submit", async event => {
  event.preventDefault();

  const email = byId("register-email")?.value.trim();
  const password = byId("register-password")?.value;

  if (!email || !password) {
    showMessage(
      "register-feedback",
      "Please enter your email and password."
    );
    return;
  }

  showMessage("register-feedback", "Creating your account...");

  try {
    await authReady;

    // Create the student's Firebase account.
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Firebase signs the student in automatically.
    // Sign them out so they must use the Sign In form.
    await signOut(credential.user);

    registerForm.reset();

    showMessage(
      "register-feedback",
      "Registration successful! Please sign in with your email and password."
    );

    // Return to the Sign In section.
    byId("signin-form")?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    byId("signin-email")?.focus();

  } catch (error) {
    console.error("Registration failed:", error);

    showMessage(
      "register-feedback",
      friendlyError(error)
    );
  }
});

/* Student sign-in. */
signInForm?.addEventListener("submit", async event => {
  event.preventDefault();

  const email = byId("signin-email").value.trim();
  const password = byId("signin-password").value;

  showMessage("signin-feedback", "Signing in...");

  try {
    await authReady;
    await signInWithEmailAndPassword(auth, email, password);

    signInForm.reset();
    showMessage("signin-feedback", "Signed in successfully.");
  } catch (error) {
    console.error("Sign-in failed:", error);
    showMessage("signin-feedback", friendlyError(error));
  }
});


/* Restore the authenticated student session. */
await authReady;

onAuthStateChanged(auth, user => {
  currentUser = user;

  if (stopApplicationListener) {
    stopApplicationListener();
    stopApplicationListener = null;
  }

  const signedIn = Boolean(user);

  if (authForms) authForms.hidden = signedIn;
  if (studentAccount) studentAccount.hidden = !signedIn;
  if (applicationForm) applicationForm.hidden = !signedIn;
  if (applicationLoginNote) applicationLoginNote.hidden = signedIn;

  showMessage(
    "student-email",
    signedIn ? `Signed in as ${user.email || "student"}` : ""
  );

  showMessage(
    "account-feedback",
    signedIn ? "You can now submit and track applications." : ""
  );

  showMessage(
    "application-status-message",
    signedIn
      ? "Loading your applications..."
      : "Sign in to view your application status."
  );

  const statusList = byId("application-status-list");

  if (statusList) {
    statusList.replaceChildren();
  }

  if (!user) return;

  const applicationsRef = ref(
    db,
    `applications/${user.uid}`
  );

  stopApplicationListener = onValue(
    applicationsRef,
    snapshot => {
      if (statusList) {
        statusList.replaceChildren();
      }

      if (!snapshot.exists()) {
        showMessage(
          "application-status-message",
          "You have not submitted any applications yet."
        );
        return;
      }

      snapshot.forEach(child => {
        const application = child.val();
        const item = document.createElement("li");
        const heading = document.createElement("strong");
        const details = document.createElement("p");

        heading.textContent =
          application.hostelName || "Accommodation application";

        details.textContent =
          `Reference: ${application.reference || child.key} · Status: ${application.status || "pending"}`;

        item.append(heading, details);

        // Allow deletion only for pending applications.
        if ((application.status || "pending") === "pending") {
          const deleteButton = document.createElement("button");

          deleteButton.type = "button";
          deleteButton.textContent = "×";
          deleteButton.className = "application-delete-button";
          deleteButton.setAttribute(
            "aria-label",
            "Delete application"
          );
          deleteButton.title = "Delete application";

          deleteButton.addEventListener("click", async () => {
            const confirmed = window.confirm(
              `Delete your application for "${application.hostelName || "this hostel"}"? This cannot be undone.`
            );

            if (!confirmed) return;

            deleteButton.disabled = true;

            try {
              await authReady;

              if (
                !auth.currentUser ||
                auth.currentUser.uid !== user.uid
              ) {
                throw new Error(
                  "Please sign in again before deleting this application."
                );
              }

              await remove(
                ref(
                  db,
                  `applications/${user.uid}/${child.key}`
                )
              );

              showMessage(
                "application-status-message",
                "Application deleted successfully."
              );

            } catch (error) {
              console.error(
                "Application deletion failed:",
                error
              );

              showMessage(
                "application-status-message",
                error.message?.startsWith("Please sign in")
                  ? error.message
                  : friendlyError(error)
              );

              deleteButton.disabled = false;
            }
          });

          details.appendChild(
            document.createTextNode(" ")
          );

          details.appendChild(deleteButton);
        }

        statusList?.appendChild(item);
      });

      showMessage(
        "application-status-message",
        "Your application records are up to date."
      );
    },
    error => {
      console.error("Application tracking failed:", error);

      showMessage(
        "application-status-message",
        "Unable to load applications. Please refresh and try again."
      );
    }
  );
});

/* Sign out. */
byId("signout-button")?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    showMessage("signin-feedback", "You have signed out.");
  } catch (error) {
    console.error("Sign-out failed:", error);
    showMessage("account-feedback", friendlyError(error));
  }
});

/* Submit an application for the authenticated student. */
applicationForm?.addEventListener("submit", async event => {
  event.preventDefault();

  if (!currentUser || submittingApplication) {
    showMessage(
      "application-feedback",
      "Please sign in before submitting an application."
    );
    return;
  }

  const fullName = byId("application-name").value.trim();
  const phone = byId("application-phone").value.trim();
  const hostelId = applicationHostel.value;

  const selectedOption =
    applicationHostel.selectedOptions[0];

  const hostelName = selectedOption?.textContent || "";

  if (!fullName || !phone || !hostelId) {
    showMessage(
      "application-feedback",
      "Complete all fields before submitting."
    );
    return;
  }

  submittingApplication = true;

  const submitButton =
    applicationForm.querySelector('button[type="submit"]');

  if (submitButton) submitButton.disabled = true;

  showMessage("application-feedback", "Submitting your application...");

  try {
    await authReady;

    // Confirm the user is still signed in.
    if (!auth.currentUser ||
        auth.currentUser.uid !== currentUser.uid) {
      throw new Error("Please sign in again before submitting.");
    }

    const applicationsRef = ref(
      db,
      `applications/${currentUser.uid}`
    );

    const existingSnapshot = await get(applicationsRef);
    let duplicateApplication = false;

    existingSnapshot.forEach(child => {
      const existingApplication = child.val();

      if (
        existingApplication.hostelId === hostelId &&
        (existingApplication.status || "pending") === "pending"
      ) {
        duplicateApplication = true;
      }
    });

    if (duplicateApplication) {
      showMessage(
        "application-feedback",
        "You already have a pending application for this hostel. Please check My Applications."
      );
      return;
    }

const newApplicationRef = push(applicationsRef);
const applicationReference = newApplicationRef.key;

await set(newApplicationRef, {
  reference: applicationReference,
  hostelId,
  hostelName,
  fullName,
  phone,
  status: "pending",
  createdAt: serverTimestamp()
});

applicationForm.reset();
populateHostels();

showMessage(
  "application-feedback",
  `Application submitted successfully! Your reference number is ${applicationReference}. Status: Pending review.`
);

  } catch (error) {
    console.error("Application submission failed:", error);

    showMessage(
      "application-feedback",
      error.message?.startsWith("Please sign in")
        ? error.message
        : friendlyError(error)
    );
  } finally {
    submittingApplication = false;
    if (submitButton) submitButton.disabled = false;
  }
});

/* Apply directly from the existing listing details dialog. */
byId("dialog-apply")?.addEventListener("click", () => {
  const dialog = byId("listing-dialog");
  const title = byId("dialog-title")?.textContent?.trim();

  populateHostels();

  const matchingOption = [...(applicationHostel?.options || [])]
    .find(option => option.textContent.trim() === title);

  if (matchingOption && applicationHostel) {
    applicationHostel.value = matchingOption.value;
  }

  dialog?.close();

  byId("application-form-section")?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  if (!currentUser) {
    showMessage(
      "application-feedback",
      "Please sign in or register first. Your selected hostel will remain available when you return."
    );
  }
});

