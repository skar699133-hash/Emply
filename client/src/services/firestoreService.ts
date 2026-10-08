import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, WorkplaceRequest, LeaveRequest } from '../types';

export const firestoreService = {
  // Sync or Save authenticated user to Firestore
  async saveUser(user: Partial<User> & { id: string }): Promise<void> {
    if (!db) return;
    try {
      const userRef = doc(db, 'users', user.id);
      await setDoc(userRef, {
        ...user,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.warn('Firestore user sync notice:', err);
    }
  },

  // Get user from Firestore
  async getUser(id: string): Promise<User | null> {
    if (!db) return null;
    try {
      const userRef = doc(db, 'users', id);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as User;
      }
    } catch (err) {
      console.warn('Firestore getUser notice:', err);
    }
    return null;
  },

  // Workplace Requests
  async createRequest(requestData: any): Promise<string | null> {
    if (!db) return null;
    try {
      const colRef = collection(db, 'requests');
      const docRef = await addDoc(colRef, {
        ...requestData,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (err) {
      console.warn('Firestore createRequest notice:', err);
      return null;
    }
  },

  async getRequests(userId?: string): Promise<WorkplaceRequest[]> {
    if (!db) return [];
    try {
      const colRef = collection(db, 'requests');
      const q = userId
        ? query(colRef, where('userId', '==', userId), orderBy('createdAt', 'desc'))
        : query(colRef, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    } catch (err) {
      console.warn('Firestore getRequests notice:', err);
      return [];
    }
  },

  // Leave Requests
  async createLeaveRequest(leaveData: any): Promise<string | null> {
    if (!db) return null;
    try {
      const colRef = collection(db, 'leave_requests');
      const docRef = await addDoc(colRef, {
        ...leaveData,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (err) {
      console.warn('Firestore createLeaveRequest notice:', err);
      return null;
    }
  },

  async updateLeaveStatus(leaveId: string, status: string, notes?: string): Promise<void> {
    if (!db) return;
    try {
      const leaveRef = doc(db, 'leave_requests', leaveId);
      await updateDoc(leaveRef, {
        status,
        updatedAt: serverTimestamp(),
        decisionNotes: notes || '',
      });
    } catch (err) {
      console.warn('Firestore updateLeaveStatus notice:', err);
    }
  },

  // Audit Logs
  async logAudit(action: string, actor: any, details?: any): Promise<void> {
    if (!db) return;
    try {
      const colRef = collection(db, 'audit_logs');
      await addDoc(colRef, {
        action,
        actor,
        details: details || {},
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Firestore audit log notice:', err);
    }
  }
};
