import { useEffect } from "react";
import { ref, onValue, onDisconnect, set, remove, serverTimestamp } from "firebase/database";
import { db } from "../Services/firebase";

export function usePresence(userId, pageLabel, isFirebaseLoading = false) {
  useEffect(() => {
    if (!userId || isFirebaseLoading) return;

    const connectedRef = ref(db, ".info/connected");
    // const myPresenceRef = ref(db, `presence/${userId}_${pageLabel}`);
    const myPresenceRef = ref(db, `presence/${userId}/${pageLabel}`);


    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        onDisconnect(myPresenceRef).remove();
        set(myPresenceRef, {
          page: pageLabel,
          connectedAt: serverTimestamp(),
        });
      }
    });

    return () => {
      unsubscribe();
      remove(myPresenceRef); 
    };
  }, [userId, pageLabel, isFirebaseLoading]);
}