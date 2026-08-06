/* modules/admin/adminAuth.js
 * Admin Authentication guard & access control for beyondthyme.in@gmail.com.
 */

import { ADMIN_AUTHORIZED_EMAIL, ADMIN_SIDEBAR_NAV } from '../../config/admin.config.js';
import { loginWithGoogle, logoutFirebaseUser } from '../firebase.js';

let currentAdminUser = null;
let currentTabId = 'dashboard';

/**
 * Initialize Admin Portal Auth & Navigation event listeners.
 * @param {object} callbacks - { onTabChange(tabId), onAuthChange(user) }
 */
export function initAdminAuth(callbacks = {}) {
  const overlay = document.getElementById('adminPortalOverlay');
  const googleBtn = document.getElementById('btnAdminGoogleLogin');
  const closeLockBtn = document.getElementById('btnAdminCloseLock');
  const closePortalBtn = document.getElementById('btnAdminClosePortal');
  const logoutBtn = document.getElementById('btnAdminLogout');
  const toggleSidebarBtn = document.getElementById('btnToggleAdminSidebar');

  // Google Login for Admin
  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      try {
        const user = await loginWithGoogle();
        if (user && user.email === ADMIN_AUTHORIZED_EMAIL.toLowerCase()) {
          currentAdminUser = user;
          _showAdminShell();
          callbacks.onAuthChange?.(currentAdminUser);
        } else {
          alert(`Access Denied: Only ${ADMIN_AUTHORIZED_EMAIL} is authorized to access the Admin Portal.`);
        }
      } catch (err) {
        console.warn('Admin Google Login notice:', err?.message);
        // Fallback for offline/simulation testing
        const email = prompt('Enter Admin Email for Portal Verification:', ADMIN_AUTHORIZED_EMAIL);
        if (email && email.toLowerCase() === ADMIN_AUTHORIZED_EMAIL.toLowerCase()) {
          currentAdminUser = {
            displayName: 'Beyond Thyme Executive',
            email: ADMIN_AUTHORIZED_EMAIL,
            photoURL: '👑',
            role: 'admin',
          };
          _showAdminShell();
          callbacks.onAuthChange?.(currentAdminUser);
        } else if (email) {
          alert('Access Denied: Email address is not authorized for Admin access.');
        }
      }
    });
  }

  // Close Lock Button
  if (closeLockBtn) {
    closeLockBtn.addEventListener('click', () => {
      closeAdminPortal();
    });
  }

  // Close Portal Button
  if (closePortalBtn) {
    closePortalBtn.addEventListener('click', () => {
      closeAdminPortal();
    });
  }

  // Logout Button
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await logoutFirebaseUser();
      currentAdminUser = null;
      _showAuthLock();
      callbacks.onAuthChange?.(null);
    });
  }

  // Toggle Sidebar
  if (toggleSidebarBtn) {
    toggleSidebarBtn.addEventListener('click', () => {
      const sidebar = document.getElementById('adminSidebar');
      if (sidebar) sidebar.classList.toggle('collapsed');
    });
  }

  _renderSidebarNav(callbacks.onTabChange);
  _showAuthLock();
}

/**
 * Render Sidebar Items dynamically from config.
 */
function _renderSidebarNav(onTabChange) {
  const container = document.getElementById('adminSidebarNav');
  if (!container) return;

  container.innerHTML = '';
  ADMIN_SIDEBAR_NAV.forEach((item) => {
    const btn = document.createElement('button');
    btn.className = `admin-nav-item ${item.id === currentTabId ? 'active' : ''}`;
    btn.dataset.tabId = item.id;
    btn.innerHTML = `
      <span class="nav-item-icon">${item.icon}</span>
      <span class="nav-item-text">${item.label}</span>
    `;

    btn.addEventListener('click', () => {
      _switchTab(item.id);
      onTabChange?.(item.id);
    });

    container.appendChild(btn);
  });
}

/**
 * Switch Active View Tab.
 */
function _switchTab(tabId) {
  currentTabId = tabId;

  // Update Nav Buttons
  const navBtns = document.querySelectorAll('.admin-nav-item');
  navBtns.forEach(btn => {
    if (btn.dataset.tabId === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update Viewports
  const views = document.querySelectorAll('.admin-tab-view');
  views.forEach(v => {
    if (v.id === `adminView_${tabId}`) {
      v.classList.add('active');
    } else {
      v.classList.remove('active');
    }
  });
}

/**
 * Open the full Admin Portal overlay.
 */
export function openAdminPortal() {
  const overlay = document.getElementById('adminPortalOverlay');
  if (overlay) overlay.classList.add('active');

  const isAuthorized = currentAdminUser && (currentAdminUser.email || '').toLowerCase() === ADMIN_AUTHORIZED_EMAIL.toLowerCase();
  if (isAuthorized) {
    _showAdminShell();
  } else {
    _showAuthLock();
  }
}

/**
 * Close the full Admin Portal overlay.
 */
export function closeAdminPortal() {
  const overlay = document.getElementById('adminPortalOverlay');
  if (overlay) overlay.classList.remove('active');
}

function _showAdminShell() {
  const lock = document.getElementById('adminAuthLock');
  const shell = document.getElementById('adminShell');
  if (lock) lock.classList.add('admin-hidden');
  if (shell) shell.classList.remove('admin-hidden');

  const nameEl = document.getElementById('adminUserName');
  if (nameEl && currentAdminUser) {
    nameEl.innerText = currentAdminUser.displayName || 'Admin';
  }
}

function _showAuthLock() {
  const lock = document.getElementById('adminAuthLock');
  const shell = document.getElementById('adminShell');
  if (lock) lock.classList.remove('admin-hidden');
  if (shell) shell.classList.add('admin-hidden');
}

export function getCurrentAdminUser() {
  return currentAdminUser;
}
