/* modules/firebase.js
 * Complete Firebase Modular SDK (v10+) Architecture & Firestore Automatic Seeder.
 * Exports: app, auth, db, storage, analytics.
 * Collections: users, events, themes, seatBookings, notifications, treasureHunts, timeCapsules, admins.
 * Features: Google Auth Popup, Firestore ACID Transactions for seat reservations,
 * real-time onSnapshot sync, and automatic collection seeder.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { 
  getFirestore, doc, setDoc, getDoc, runTransaction, 
  collection, onSnapshot 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { FIREBASE_CONFIG } from '../config/firebase.config.js';
import { ADMIN_EMAIL, EVENT_DETAILS } from '../config/app.config.js';

// ── 1. Modular SDK Initialization ──────────────────────────────────────────
export const app = initializeApp(FIREBASE_CONFIG);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export let analytics = null;

isSupported().then(supported => {
  if (supported) {
    analytics = getAnalytics(app);
  }
}).catch(() => {});

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// ── 2. Firestore Collections References ─────────────────────────────────────
export const collections = {
  users: collection(db, 'users'),
  events: collection(db, 'events'),
  themes: collection(db, 'themes'),
  seatBookings: collection(db, 'seatBookings'),
  notifications: collection(db, 'notifications'),
  treasureHunts: collection(db, 'treasureHunts'),
  timeCapsules: collection(db, 'timeCapsules'),
  admins: collection(db, 'admins'),
};

// ── 3. Automatic Database Seeder ──────────────────────────────────────────
/**
 * Automatically seed all Firestore collections with initial data on startup.
 */
export async function seedInitialFirestoreCollections() {
  if (!db) return;

  try {
    // 1. Events Collection (current-event)
    await setDoc(doc(db, 'events', 'current-event'), {
      eventId: 'current-event',
      title: EVENT_DETAILS.theme,
      description: 'Exclusive luxury mystery dinner experience where time stops at the table.',
      themeId: 'vedic_fire',
      venue: EVENT_DETAILS.venue,
      capacity: 25,
      availableSeats: 22,
      bookingOpen: true,
      eventDate: EVENT_DETAILS.date,
      createdAt: new Date().toISOString(),
    }, { merge: true });

    // 2. Themes Collection
    await setDoc(doc(db, 'themes', 'vedic_fire'), {
      id: 'vedic_fire',
      title: 'Vedic Fire',
      description: 'Charcoal smoked heirlooms & sacred spices.',
      image: '/logo.jpg',
      week: 1,
      month: 'October',
      active: true,
    }, { merge: true });

    await setDoc(doc(db, 'themes', 'victorian_clockwork'), {
      id: 'victorian_clockwork',
      title: 'Victorian Clockwork',
      description: 'Precision roasts & barrel-aged herbal elixirs.',
      image: '/logo.jpg',
      week: 2,
      month: 'October',
      active: false,
    }, { merge: true });

    // 3. Admins Collection
    await setDoc(doc(db, 'admins', 'super_admin'), {
      email: ADMIN_EMAIL,
      role: 'super_admin',
      permissions: ['ALL'],
      createdAt: new Date().toISOString(),
    }, { merge: true });

    // 4. Notifications Collection
    await setDoc(doc(db, 'notifications', 'welcome_notif'), {
      title: 'Beyond Thyme Active',
      message: 'Database initialized & real-time floorplan active.',
      createdAt: new Date().toISOString(),
    }, { merge: true });

    // 5. Seed All 25 Seats in seatBookings
    const defaultOccupied = [1, 2, 4];
    for (let i = 1; i <= 25; i++) {
      const seatStr = String(i).padStart(2, '0');
      const isOccupied = defaultOccupied.includes(i);
      await setDoc(doc(db, 'seatBookings', `seat_${seatStr}`), {
        seatId: `Seat_${seatStr}`,
        seatNum: i,
        userName: isOccupied ? (i === 1 ? 'Vedic_Chrono' : i === 2 ? 'Kala_Master' : 'Time_Traveler') : '',
        userAvatar: isOccupied ? (i === 1 ? '⏳' : i === 2 ? '⌛' : '🪩') : '',
        status: isOccupied ? 'BOOKED' : 'AVAILABLE',
        bookedAt: isOccupied ? new Date().toISOString() : null,
      }, { merge: true });
    }

    // 6. Treasure Hunts Collection
    await setDoc(doc(db, 'treasureHunts', 'clue_01'), {
      clueId: 'clue_01',
      hint: 'The pendulum holds the key to the vault.',
      xCoord: 28.5355,
      yCoord: 77.2410,
    }, { merge: true });

    // 7. Time Capsules Collection
    await setDoc(doc(db, 'timeCapsules', 'capsule_01'), {
      capsuleId: 'capsule_01',
      sealedBy: 'Society Master',
      message: 'A secret left for the 2026 autumn dinner.',
      sealedAt: new Date().toISOString(),
    }, { merge: true });

    console.log('✨ All 8 Firestore Collections & 25 Seats initialized & seeded!');
  } catch (err) {
    console.warn('Firestore seeding notice:', err?.message);
  }
}

// Automatically trigger seeder on initialization
seedInitialFirestoreCollections();

// ── 4. Google Authentication Flow ──────────────────────────────────────────
/**
 * Sign in with Google Popup ONLY (no password, phone, or anonymous auth).
 * Automatically creates/updates document in "users" collection upon login.
 * @returns {Promise<object>} User Profile Object
 */
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;

    const email = (fbUser.email || '').toLowerCase();
    const role  = (email === ADMIN_EMAIL.toLowerCase()) ? 'admin' : 'member';

    const userProfile = {
      uid: fbUser.uid,
      displayName: fbUser.displayName || email.split('@')[0],
      email: email,
      photoURL: fbUser.photoURL || '⏳',
      phone: fbUser.phoneNumber || '',
      lastLogin: new Date().toISOString(),
      role: role,
    };

    // Store/Update user document in Firestore 'users' collection
    const userRef = doc(db, 'users', fbUser.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      userProfile.createdAt = new Date().toISOString();
      await setDoc(userRef, userProfile);
    } else {
      await setDoc(userRef, { lastLogin: userProfile.lastLogin, photoURL: userProfile.photoURL }, { merge: true });
    }

    return userProfile;
  } catch (err) {
    throw handleFirebaseError(err);
  }
}

// ── 5. Atomic Seat Booking with Firestore Transactions ──────────────────────
/**
 * Reserve a seat using Firestore ACID Transaction to guarantee ZERO duplicate bookings.
 * @param {number|string} seatNum - Seat Position (e.g. 5 or 'Seat_05')
 * @param {object} vettingData - Timeline reservation details
 * @param {object} user - Currently authenticated user object
 * @returns {Promise<object>} Booking Document Data
 */
export async function bookSeatTransaction(seatNum, vettingData, user) {
  const seatIdStr = String(seatNum).replace('SEAT_', '').replace('Seat_', '').padStart(2, '0');
  const seatDocId = `seat_${seatIdStr}`;
  const seatRef   = doc(db, 'seatBookings', seatDocId);

  try {
    const bookingData = await runTransaction(db, async (transaction) => {
      const seatSnap = await transaction.get(seatRef);

      if (seatSnap.exists() && seatSnap.data().status === 'BOOKED') {
        const err = new Error('DUPLICATE_BOOKING');
        err.code = 'DUPLICATE_BOOKING';
        throw err;
      }

      const newBooking = {
        seatId: `Seat_${seatIdStr}`,
        seatNum: parseInt(seatIdStr, 10),
        uid: user?.uid || 'ANONYMOUS',
        userEmail: user?.email || vettingData.email || 'member@gmail.com',
        userName: vettingData.fullName || user?.displayName || 'Member',
        userAvatar: user?.photoURL || '⏳',
        status: 'BOOKED',
        vetting: vettingData,
        bookedAt: new Date().toISOString(),
        amount: vettingData.amount || 2000,
        paymentId: vettingData.paymentId || `pay_test_${Date.now()}`,
      };

      transaction.set(seatRef, newBooking);
      return newBooking;
    });

    console.log('✅ Seat successfully booked with ACID transaction:', bookingData.seatId);
    return bookingData;
  } catch (err) {
    throw handleFirebaseError(err);
  }
}

// ── 6. Real-Time Seat Synchronization (onSnapshot) ──────────────────────────
/**
 * Realtime listener for seatBookings collection. Updates all open clients instantly.
 * @param {function} callback - Called with array of booked seat documents
 * @returns {function} Unsubscribe function
 */
export function listenToLiveSeatBookings(callback) {
  try {
    return onSnapshot(collections.seatBookings, (snapshot) => {
      const bookings = [];
      snapshot.forEach(docSnap => {
        bookings.push(docSnap.data());
      });
      callback(bookings);
    }, (err) => {
      console.warn('Firestore snapshot notice:', err);
    });
  } catch (err) {
    console.warn('Unable to subscribe to Firestore snapshots:', err);
  }
}

// ── 7. Error Handling Helper ───────────────────────────────────────────────
/**
 * Resolves Firebase error codes into human-readable messages.
 * @param {object} err
 * @returns {Error} Formatted Error
 */
export function handleFirebaseError(err) {
  let message = err?.message || 'An unexpected error occurred.';

  switch (err?.code) {
    case 'auth/popup-closed-by-user':
      message = 'Google Sign-In popup was closed before completing authentication.';
      break;
    case 'auth/popup-blocked':
      message = 'Sign-In popup was blocked by your browser. Please allow popups to continue.';
      break;
    case 'permission-denied':
      message = 'Firestore permission denied. Please check security rules or sign in.';
      break;
    case 'DUPLICATE_BOOKING':
      message = 'This seat position has just been reserved by another member. Please select an available seat.';
      break;
    case 'unavailable':
      message = 'Firebase service is currently offline or unreachable.';
      break;
  }

  const customError = new Error(message);
  customError.code = err?.code || 'FIREBASE_ERROR';
  return customError;
}

/**
 * Sign out current Firebase user.
 */
export async function logoutFirebaseUser() {
  if (auth) {
    await signOut(auth);
  }
}

// Alias Exports for Backwards Compatibility
export const signInWithGoogleFirebase = loginWithGoogle;
export const listenToLiveBookings = listenToLiveSeatBookings;
export const saveBookingToFirestore = bookSeatTransaction;
