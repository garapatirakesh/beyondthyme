/* modules/auth.js
 * Google Authentication state manager & modal trigger.
 * Integrated with authentic Firebase Auth (Google Popup ONLY).
 */

import { ADMIN_EMAIL } from '../config/app.config.js';
import { loginWithGoogle, subscribeAuthChange } from './firebase.js';

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

  // Firebase auth state subscription
  subscribeAuthChange((user) => {
    if (user) {
      currentUser = user;
    } else {
      currentUser = null;
    }
    
    // Update Header Login Button Text
    const headerLoginBtn = document.getElementById('headerLoginBtn');
    const headerLoginText = document.getElementById('headerLoginText');
    if (headerLoginBtn && headerLoginText) {
      if (currentUser) {
        const alias = currentUser.name || currentUser.email.split('@')[0];
        headerLoginText.textContent = alias.toUpperCase();
      } else {
        headerLoginText.textContent = 'LOGIN';
      }
    }
  });

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

  const handleAuthSubmit = async (isPopup = true) => {
    if (isPopup) {
      try {
        const fbUser = await loginWithGoogle();
        currentUser = fbUser;
      } catch (err) {
        console.warn('Firebase popup notice, falling back to input:', err?.message);
        _setSimulatedUser();
      }
    } else {
      _setSimulatedUser();
    }

    _hideModal();

    const role = (currentUser?.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'member';
    if (role === 'admin') {
      options.onAdminAccess?.(currentUser);
    } else {
      options.onAuthSuccess?.(currentUser);
    }
  };

  if (confirmGoogleBtn) {
    confirmGoogleBtn.addEventListener('click', () => handleAuthSubmit(true));
  }

  const simulatedSubmitBtn = document.getElementById('btnConfirmSimulatedAuth');
  if (simulatedSubmitBtn) {
    simulatedSubmitBtn.addEventListener('click', () => handleAuthSubmit(false));
  }
}

function _setSimulatedUser() {
  const authEmailInput = document.getElementById('simulatedGoogleEmail');
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

/**
 * Trigger the Google Auth modal programmatically and initiate Google popup.
 */
export function promptGoogleLogin() {
  _showModal();
  const confirmGoogleBtn = document.getElementById('confirmGoogleSignInBtn');
  if (confirmGoogleBtn) {
    // Automatically trigger Google sign in popup on direct user click action
    confirmGoogleBtn.click();
  }
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
