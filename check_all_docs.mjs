import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { FIREBASE_CONFIG } from './config/firebase.config.js';

const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);

async function checkDocs() {
  console.log("=== SEAT BOOKINGS ===");
  const bSnap = await getDocs(collection(db, 'seatBookings'));
  bSnap.docs.forEach(d => console.log(d.id, JSON.stringify(d.data())));

  console.log("\n=== TICKETS ===");
  const tSnap = await getDocs(collection(db, 'tickets'));
  tSnap.docs.forEach(d => console.log(d.id, JSON.stringify(d.data())));

  console.log("\n=== RESERVATIONS ===");
  const rSnap = await getDocs(collection(db, 'seatReservations'));
  rSnap.docs.forEach(d => console.log(d.id, JSON.stringify(d.data())));

  process.exit(0);
}

checkDocs().catch(err => {
  console.error(err);
  process.exit(1);
});
