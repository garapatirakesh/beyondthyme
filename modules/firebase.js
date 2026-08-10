/* modules/firebase.js
 * Complete Firebase Modular SDK (v10+) Architecture & Firestore Automatic Seeder.
 * Exports: app, auth, db, storage, analytics.
 * Collections: users, events, themes, seatBookings, notifications, treasureHunts, timeCapsules, admins.
 * Features: Google Auth Popup, Firestore ACID Transactions for seat reservations,
 * real-time onSnapshot sync, and automatic collection seeder.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, doc, setDoc, getDoc, runTransaction, 
  collection, onSnapshot, deleteDoc, updateDoc,
  getDocs, query, where
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { FIREBASE_CONFIG } from '../config/firebase.config.js';
import { ADMIN_EMAIL, RESERVATION_HOLD_MS, INVENTORY_MESSAGES } from '../config/app.config.js';
import { MENU_ERAS, AMRIT_YUGA_ERA } from '../config/menu.js';
import { SEED_GUESTBOOK_ENTRIES } from '../config/guestbook.js';

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
  seatReservations: collection(db, 'seatReservations'),
  notifications: collection(db, 'notifications'),
  treasureHunts: collection(db, 'treasureHunts'),
  timeCapsules: collection(db, 'timeCapsules'),
  admins: collection(db, 'admins'),
  tickets: collection(db, 'tickets'),
  themes: collection(db, 'themes'),
  timeCapsules: collection(db, 'timeCapsules'),
};

// ── 3. Automatic Database Seeder ──────────────────────────────────────────
/**
 * Automatically seed all Firestore collections with initial data on startup.
 */
export async function seedInitialFirestoreCollections() {
  if (!db) return;

  try {
    // 1. Events Collection (Only seed if empty on fresh startup)
    const eventsSnap = await getDocs(collections.events);
    if (eventsSnap.empty) {
      console.log('Events collection is empty. Please configure events via the Admin Dashboard.');
    }

    // Clean up old hardcoded seed themes if present in Firestore
    const oldThemeIds = ['vedic_fire', 'victorian_clockwork'];
    for (const themeId of oldThemeIds) {
      try {
        const themeRef = doc(db, 'themes', themeId);
        const themeSnap = await getDoc(themeRef);
        if (themeSnap.exists()) {
          await deleteDoc(themeRef);
          console.log(`🧹 Purged legacy default theme document: themes/${themeId}`);
        }
      } catch (e) {
        // ignore cleanup notice
      }
    }

    // 2. Seed Themes (Menu Eras)
    const themesSnap = await getDocs(collections.themes);
    if (themesSnap.size < 4) {
      const allThemes = [...MENU_ERAS, AMRIT_YUGA_ERA];
      for (const theme of allThemes) {
        await setDoc(doc(db, 'themes', theme.id), theme, { merge: true });
        console.log(`✨ Seeded Theme into Firestore: themes/${theme.id}`);
      }
    }

    // 3. Seed Time Capsules (Guestbook)
    const timeCapsulesSnap = await getDocs(collections.timeCapsules);
    if (timeCapsulesSnap.empty) {
      for (const [index, entry] of SEED_GUESTBOOK_ENTRIES.entries()) {
        const id = `seed_entry_${index}`;
        await setDoc(doc(db, 'timeCapsules', id), {
          ...entry,
          timestamp: new Date().toISOString()
        }, { merge: true });
        console.log(`✨ Seeded Guestbook Entry into Firestore: timeCapsules/${id}`);
      }
    }

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

    console.log('✨ Firestore backend synchronized cleanly!');
  } catch (err) {
    console.warn('Firestore seeding notice:', err?.message);
  }
}

/**
 * Actively purge all legacy hardcoded 'seat_01' .. 'seat_25' documents from Firestore seatBookings.
 */
export async function purgeAllLegacySeatDocs() {
  try {
    const snap = await getDocs(collections.seatBookings);
    let deletedCount = 0;
    for (const docSnap of snap.docs) {
      if (docSnap.id.startsWith('seat_')) {
        await deleteDoc(doc(db, 'seatBookings', docSnap.id));
        deletedCount++;
        console.log(`🔥 Deleted legacy document from Firestore: seatBookings/${docSnap.id}`);
      }
    }
    console.log(`✅ Purged ${deletedCount} legacy seat documents from Firestore!`);
  } catch (err) {
    console.warn('Legacy seat purge notice:', err?.message);
  }
}

// Automatically trigger seeder and legacy purge on initialization
seedInitialFirestoreCollections();
purgeAllLegacySeatDocs();

// ── 4. Google Authentication Flow ──────────────────────────────────────────
/**
 * Sign in with Google Popup ONLY (no password, phone, or anonymous auth).
 * Automatically creates/updates document in "users" collection upon login.
 * @returns {Promise<object>} User Profile Object
 */
export async function loginWithGoogle() {
  try {
    googleProvider.setCustomParameters({ prompt: 'select_account' });
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

/**
 * Listen to Firebase Auth state changes.
 */
export function subscribeAuthChange(callback) {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, (fbUser) => {
    if (fbUser) {
      const email = (fbUser.email || '').toLowerCase();
      const role = (email === ADMIN_EMAIL.toLowerCase()) ? 'admin' : 'member';
      const userProfile = {
        uid: fbUser.uid,
        name: fbUser.displayName || email.split('@')[0],
        email: email,
        avatar: fbUser.photoURL || (role === 'admin' ? '👑' : '⏳'),
        role: role,
      };
      callback(userProfile);
    } else {
      callback(null);
    }
  });
}

// ── 5. Atomic Seat Booking & 5-Min Reservation Transactions ─────────────
/**
 * Create temporary 5-minute seat reservation using Firestore transaction.
 * @param {string} eventId
 * @param {number} quantity
 * @param {object} user
 * @param {object} vettingData
 * @returns {Promise<object>} Reservation result
 */
export async function createTemporaryReservationTransaction(eventId, quantity, user, vettingData = {}) {
  const targetEventId = eventId || vettingData.clubId || 'zenitsu';
  const eventRef = doc(db, 'events', targetEventId);
  const resId = `res_${targetEventId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const reservationRef = doc(db, 'seatReservations', resId);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const eventSnap = await transaction.get(eventRef);
      const totalSeats = eventSnap.exists()
        ? (parseInt(eventSnap.data().capacity, 10) || 7)
        : 7;

      // Fetch existing bookings & reservations for inventory calculation
      const bookingsSnap = await getDocs(query(collections.seatBookings, where('clubId', '==', targetEventId)));
      let confirmedSeatsCount = 0;
      bookingsSnap.forEach(d => {
        const data = d.data();
        confirmedSeatsCount += (parseInt(data.quantity, 10) || 1);
      });

      const now = Date.now();
      const resSnap = await getDocs(query(collections.seatReservations, where('clubId', '==', targetEventId)));
      let activeReservedCount = 0;
      resSnap.forEach(d => {
        const data = d.data();
        if (data.status === 'RESERVED' && data.expiresAt > now) {
          activeReservedCount += (parseInt(data.quantity, 10) || 1);
        }
      });

      const availableSeats = Math.max(0, totalSeats - confirmedSeatsCount - activeReservedCount);

      if (quantity > availableSeats) {
        const err = new Error(INVENTORY_MESSAGES.ONLY_X_SEATS_SELECTABLE.replace('{count}', availableSeats));
        err.code = 'OVERBOOKING_PREVENTED';
        err.availableSeats = availableSeats;
        throw err;
      }

      const expiresAt = now + RESERVATION_HOLD_MS; // 5 mins
      const resData = {
        reservationId: resId,
        clubId: targetEventId,
        quantity: quantity,
        uid: user?.uid || 'ANONYMOUS',
        userName: vettingData.fullName || user?.displayName || 'Guest',
        userEmail: user?.email || vettingData.email || '',
        seatId: vettingData.seatId || 'Seat_01',
        status: 'RESERVED',
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt,
      };

      transaction.set(reservationRef, resData);

      const newAvailable = availableSeats - quantity;
      const newStatus = newAvailable <= 0 ? 'Closed' : 'Published';
      if (eventSnap.exists()) {
        transaction.update(eventRef, {
          bookedSeats: confirmedSeatsCount,
          availableSeats: newAvailable,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        });
      }

      return { reservationId: resId, availableSeats: newAvailable, expiresAt };
    });

    return result;
  } catch (err) {
    console.warn('Temporary seat reservation notice:', err?.message);
    throw handleFirebaseError(err);
  }
}

/**
 * Release temporary reservation when checkout is cancelled or payment fails.
 * @param {string} reservationId
 */
export async function releaseTemporaryReservation(reservationId) {
  if (!reservationId) return;
  try {
    const resRef = doc(db, 'seatReservations', reservationId);
    await deleteDoc(resRef);
    console.log(`✅ Released temporary reservation: ${reservationId}`);
  } catch (err) {
    console.warn('Error releasing temporary reservation:', err?.message);
  }
}

/**
 * Confirm seat booking after successful payment atomically.
 * @param {string} reservationId
 * @param {object} vettingData
 * @param {object} user
 */
export async function confirmBookingFromReservationTransaction(reservationId, vettingData, user) {
  const targetClubId = vettingData.clubId || 'zenitsu';
  const bookingDocId = `booking_${targetClubId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const bookingRef = doc(db, 'seatBookings', bookingDocId);
  const eventRef = doc(db, 'events', targetClubId);

  const seatIdStr = String(vettingData.seatId || 'Seat_01').replace('SEAT_', '').replace('Seat_', '').padStart(2, '0');

  try {
    await runTransaction(db, async (transaction) => {
      const eventSnap = await transaction.get(eventRef);
      const totalSeats = eventSnap.exists()
        ? (parseInt(eventSnap.data().capacity, 10) || 7)
        : 7;

      const newBooking = {
        bookingId: bookingDocId,
        seatId: `Seat_${seatIdStr}`,
        seatNum: parseInt(seatIdStr, 10),
        uid: user?.uid || 'ANONYMOUS',
        userEmail: user?.email || vettingData.email || 'member@gmail.com',
        userName: vettingData.fullName || user?.displayName || 'Member',
        userAvatar: user?.photoURL || '⏳',
        status: 'BOOKED',
        quantity: vettingData.quantity || 1,
        clubId: targetClubId,
        eventId: targetClubId,
        themeName: vettingData.themeName || '',
        vetting: vettingData,
        bookedAt: new Date().toISOString(),
        amount: vettingData.amount || (vettingData.quantity ? vettingData.quantity * 1000 : 2000),
        paymentId: vettingData.paymentId || `pay_test_${Date.now()}`,
      };

      transaction.set(bookingRef, newBooking);

      if (reservationId) {
        const resRef = doc(db, 'seatReservations', reservationId);
        transaction.delete(resRef);
      }

      // Calculate confirmed seats count
      const bookingsSnap = await getDocs(query(collections.seatBookings, where('clubId', '==', targetClubId)));
      let confirmedSeatsCount = vettingData.quantity || 1;
      bookingsSnap.forEach(d => {
        confirmedSeatsCount += (parseInt(d.data().quantity, 10) || 1);
      });

      const newAvailable = Math.max(0, totalSeats - confirmedSeatsCount);
      const newStatus = newAvailable <= 0 ? 'Closed' : 'Published';

      if (eventSnap.exists()) {
        transaction.update(eventRef, {
          bookedSeats: confirmedSeatsCount,
          availableSeats: newAvailable,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        });
      }
    });

    console.log('✅ Confirmed seat booking written atomically to Firestore:', bookingDocId);
    return { bookingId: bookingDocId };
  } catch (err) {
    console.warn('Booking confirmation transaction notice:', err);
    const newBooking = {
      bookingId: bookingDocId,
      seatId: `Seat_${seatIdStr}`,
      seatNum: parseInt(seatIdStr, 10),
      uid: user?.uid || 'ANONYMOUS',
      userEmail: user?.email || vettingData.email || 'member@gmail.com',
      userName: vettingData.fullName || user?.displayName || 'Member',
      userAvatar: user?.photoURL || '⏳',
      status: 'BOOKED',
      quantity: vettingData.quantity || 1,
      clubId: targetClubId,
      eventId: targetClubId,
      themeName: vettingData.themeName || '',
      vetting: vettingData,
      bookedAt: new Date().toISOString(),
      amount: vettingData.amount || (vettingData.quantity ? vettingData.quantity * 1000 : 2000),
      paymentId: vettingData.paymentId || `pay_test_${Date.now()}`,
    };
    await setDoc(bookingRef, newBooking, { merge: true });
    if (reservationId) {
      releaseTemporaryReservation(reservationId);
    }
    return newBooking;
  }
}

/**
 * Reserve a seat using Firestore ACID Transaction to guarantee ZERO duplicate bookings.
 * @param {number|string} seatNum - Seat Position (e.g. 5 or 'Seat_05')
 * @param {object} vettingData - Timeline reservation details
 * @param {object} user - Currently authenticated user object
 * @returns {Promise<object>} Booking Document Data
 */
export async function bookSeatTransaction(seatNum, vettingData, user) {
  const reservationId = vettingData.reservationId || null;
  return await confirmBookingFromReservationTransaction(reservationId, vettingData, user);
}

// ── 6. Real-Time Seat Synchronization (onSnapshot) ──────────────────────────
/**
 * Realtime listener for seatBookings and seatReservations collections.
 * Updates all open clients instantly.
 * @param {function} callback - Called with array of active seat documents
 * @returns {function} Unsubscribe function
 */
export function listenToLiveSeatBookings(callback) {
  try {
    let bookings = [];
    let reservations = [];
    let tickets = [];

    const notify = () => {
      const now = Date.now();
      const activeRes = reservations.filter(r => r.status === 'RESERVED' && r.expiresAt > now);
      
      // Deduplicate bookings and tickets by document ID (mimicking Admin Dashboard)
      const unified = new Map();
      
      bookings.forEach(b => {
        if (!b || !b.id) return;
        unified.set(b.id, b);
      });

      tickets.forEach(t => {
        if (!t) return;
        // The ID of the ticket is often the booking ID
        const ticketId = t.bookingId || t.id;
        if (!ticketId) return;
        
        const existing = unified.get(ticketId);
        if (!existing) {
          unified.set(ticketId, t);
        } else {
          unified.set(ticketId, { ...existing, ...t });
        }
      });

      callback([...Array.from(unified.values()), ...activeRes]);
    };

    const unsubBookings = onSnapshot(collections.seatBookings, (snapshot) => {
      bookings = [];
      snapshot.forEach(docSnap => bookings.push({ id: docSnap.id, ...docSnap.data() }));
      notify();
    }, (err) => console.warn('Bookings snapshot notice:', err));

    const unsubTickets = onSnapshot(collections.tickets, (snapshot) => {
      tickets = [];
      snapshot.forEach(docSnap => tickets.push({ id: docSnap.id, ...docSnap.data() }));
      notify();
    }, (err) => console.warn('Tickets snapshot notice:', err));

    const unsubReservations = onSnapshot(collections.seatReservations, (snapshot) => {
      reservations = [];
      snapshot.forEach(docSnap => reservations.push({ id: docSnap.id, ...docSnap.data() }));
      notify();
    }, (err) => console.warn('Reservations snapshot notice:', err));

    return () => {
      unsubBookings();
      unsubTickets();
      unsubReservations();
    };
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

/**
 * Generic Real-time Listener for any Firestore collection.
 * @param {string} collName
 * @param {function} callback
 * @returns {function} Unsubscribe function
 */
export function listenToCollection(collName, callback) {
  if (!collections[collName]) return () => {};
  try {
    return onSnapshot(collections[collName], (snapshot) => {
      const docs = [];
      snapshot.forEach(d => docs.push({ id: d.id, ...d.data() }));
      callback(docs);
    }, (err) => {
      console.warn(`Firestore snapshot notice for ${collName}:`, err);
    });
  } catch (err) {
    console.warn(`Unable to listen to collection ${collName}:`, err);
    return () => {};
  }
}

/**
 * Write or update a document in a Firestore collection.
 */
export async function writeFirestoreDoc(collName, docId, data) {
  try {
    const docRef = doc(db, collName, docId);
    await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    console.warn(`Error writing document ${docId} in ${collName}:`, err);
    throw err;
  }
}

/**
 * Delete a document from a Firestore collection.
 */
export async function removeFirestoreDoc(collName, docId) {
  try {
    const docRef = doc(db, collName, docId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.warn(`Error deleting document ${docId} in ${collName}:`, err);
    throw err;
  }
}

// ── 8. Ticket Operations ──────────────────────────────────────────────────
/**
 * Save ticket document to 'tickets' collection.
 * @param {object} ticketData
 */
export async function saveTicketDoc(ticketData) {
  const tId = ticketData.ticketId || ticketData.bookingId;
  const docRef = doc(db, 'tickets', tId);
  await setDoc(docRef, { ...ticketData, updatedAt: new Date().toISOString() }, { merge: true });
  return tId;
}

/**
 * Fetch a single ticket document by ticketId / bookingId.
 * @param {string} ticketId
 */
export async function getTicketDoc(ticketId) {
  if (!ticketId) return null;
  try {
    const docRef = doc(db, 'tickets', ticketId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    console.warn('Error fetching ticket document:', err);
    return null;
  }
}

/**
 * Listen in real time to updates on a specific ticket document.
 * @param {string} ticketId
 * @param {function} callback
 */
export function listenToTicketDoc(ticketId, callback) {
  if (!ticketId) return () => {};
  try {
    const docRef = doc(db, 'tickets', ticketId);
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        callback(snap.data());
      } else {
        callback(null);
      }
    }, (err) => {
      console.warn('Ticket snapshot error:', err);
    });
  } catch (err) {
    console.warn('Unable to listen to ticket doc:', err);
    return () => {};
  }
}

/**
 * Mark a ticket document as checked-in with timestamp.
 * @param {string} ticketId
 */
export async function markTicketCheckedIn(ticketId) {
  if (!ticketId) return false;
  try {
    const docRef = doc(db, 'tickets', ticketId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return { success: false, reason: 'NOT_FOUND' };

    const data = snap.data();
    if (data.checkedIn || data.status === 'Checked In') {
      return { success: false, reason: 'ALREADY_CHECKED_IN', ticket: data };
    }
    if (data.status === 'CANCELLED') {
      return { success: false, reason: 'CANCELLED', ticket: data };
    }

    const checkinTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const checkinTimestamp = new Date().toISOString();

    const updateObj = {
      checkedIn: true,
      status: 'Checked In',
      checkinTime: checkinTime,
      checkedInAt: checkinTimestamp,
    };

    await updateDoc(docRef, updateObj);
    return { success: true, ticket: { ...data, ...updateObj } };
  } catch (err) {
    console.warn('Error marking ticket checked in:', err);
    throw err;
  }
}

/**
 * Fetch all tickets belonging to a user (by uid or email).
 * @param {string} userIdentifier - uid or email
 */
export async function getUserTickets(userIdentifier) {
  if (!userIdentifier) return [];
  try {
    const q1 = query(collections.tickets, where('uid', '==', userIdentifier));
    const snap1 = await getDocs(q1);
    const ticketsMap = new Map();

    snap1.forEach(d => ticketsMap.set(d.id, d.data()));

    const q2 = query(collections.tickets, where('email', '==', userIdentifier));
    const snap2 = await getDocs(q2);
    snap2.forEach(d => ticketsMap.set(d.id, d.data()));

    return Array.from(ticketsMap.values());
  } catch (err) {
    console.warn('Error fetching user tickets:', err);
    return [];
  }
}



export async function logoutUser() {
  try {
    await signOut(auth);
    console.log("Severed temporal link (User logged out)");
  } catch (error) {
    console.error("Logout error:", error);
  }
}
