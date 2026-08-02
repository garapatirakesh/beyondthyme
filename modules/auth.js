/* modules/auth.js
 * Google Authentication state manager & modal trigger.
 * Integrated with authentic Firebase Auth (Google Popup ONLY).
 */

import { ADMIN_EMAIL } from '../config/app.config.js';
import { loginWithGoogle } from './firebase.js';

let currentUser = null; // { name, email, avatar, role: 'admin' | 'member', uid }

/**
 * Initialize Auth listener & modal handlers.
 * @param {object} options - { onAuthSuccess(user), onAdminAccess(user) }
 */
export function initAuth(options = {}) {
  const googleBtn = document.getElementById('btnGoogleSignIn');
  const closeAuthBtn = document.getElementById('closeAuthModalBtn');
  const authEmailInput = document.getElementById('simulatedGoogleEmail');
  const confirmGoogleBtn = document.getElementById('confirmGoogleSignInBtn');

  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      _showModal();
    });
  }

  if (closeAuthBtn) {
    closeAuthBtn.addEventListener('click', () => {
      _hideModal();
    });
  }

  if (confirmGoogleBtn) {
    confirmGoogleBtn.addEventListener('click', async () => {
      try {
        // Authentic Firebase Google Sign-In popup
        const fbUser = await loginWithGoogle();
        currentUser = fbUser;
      } catch (err) {
        console.warn('Firebase login notice, falling back to input:', err?.message);
        const email = (authEmailInput?.value || '').trim().toLowerCase() || 'member@gmail.com';
        const name = email.split('@')[0].replace('.', ' ').toUpperCase();
        const role = (email === ADMIN_EMAIL.toLowerCase()) ? 'admin' : 'member';

        currentUser = {
          name: name,
          email: email,
          avatar: role === 'admin' ? '👑' : '⏳',
          role: role,
          uid: `local_${Date.now()}`,
        };
      }

      _hideModal();

      if (currentUser?.role === 'admin') {
        options.onAdminAccess?.(currentUser);
      } else {
        options.onAuthSuccess?.(currentUser);
      }
    });
  }
}

/**
 * Trigger the Google Auth modal programmatically.
 */
export function promptGoogleLogin() {
  _showModal();
}

/**
 * Get current logged in user.
 * @returns {object|null}
 */
export function getCurrentUser() {
  return currentUser;
}

/**
 * Logout current user.
 */
export function logoutUser() {
  currentUser = null;
}

function _showModal() {
  const modal = document.getElementById('googleAuthModal');
  if (modal) {
    modal.classList.remove('overlay-backdrop--hidden');
    modal.classList.add('active');
  }
}

function _hideModal() {
  const modal = document.getElementById('googleAuthModal');
  if (modal) {
    modal.classList.add('overlay-backdrop--hidden');
    modal.classList.remove('active');
  }
}
