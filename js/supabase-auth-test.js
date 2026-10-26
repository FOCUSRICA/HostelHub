
import { supabase } from "./supabase.js";

const registerForm = document.getElementById("register-form");
const signinForm = document.getElementById("signin-form");
const signoutButton = document.getElementById("signout-button");
const result = document.getElementById("auth-result");

function showMessage(message) {
  result.textContent = message;
}

function friendlyError(error) {
  return error?.message || "Something went wrong. Please try again.";
}

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const button = registerForm.querySelector('button[type="submit"]');
  button.disabled = true;

  try {
    const fullName = document.getElementById("full-name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value;

    if (!fullName) {
      showMessage("Please enter your full name.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/HostelHub/",
        data: {
          full_name: fullName,
          phone
        }
      }
    });

    if (error) throw error;

    if (data.session) {
      showMessage(
        "Registration successful! You are signed in. Your profile should have the student role."
      );
    } else {
      showMessage(
        "Registration request successful. Check your email to confirm your account before signing in."
      );
    }

    registerForm.reset();
  } catch (error) {
    showMessage("Registration failed: " + friendlyError(error));
  } finally {
    button.disabled = false;
  }
});

signinForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const button = signinForm.querySelector('button[type="submit"]');
  button.disabled = true;

  try {
    const email = document.getElementById("signin-email").value.trim();
    const password = document.getElementById("signin-password").value;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    showMessage(
      "Sign-in successful! Supabase user ID: " + data.user.id
    );

    signoutButton.hidden = false;
  } catch (error) {
    showMessage("Sign-in failed: " + friendlyError(error));
  } finally {
    button.disabled = false;
  }
});

signoutButton.addEventListener("click", async () => {
  signoutButton.disabled = true;

  try {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    showMessage("Signed out successfully.");
    signoutButton.hidden = true;
  } catch (error) {
    showMessage("Sign-out failed: " + friendlyError(error));
  } finally {
    signoutButton.disabled = false;
  }
});

async function checkCurrentSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    showMessage("Session check failed: " + friendlyError(error));
    return;
  }

  if (data.session) {
    showMessage(
      "You already have a Supabase session for: " +
      data.session.user.email
    );
    signoutButton.hidden = false;
  }
}

checkCurrentSession();
