import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { EMI } from './types';

const notificationId = (id: string) => {
  // Capacitor notification IDs must be integers. Use a stable positive hash.
  let hash = 7;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return Math.abs(hash) || 1;
};

export async function syncDueNotifications(emis: EMI[]) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    let permission = await LocalNotifications.checkPermissions();
    if (permission.display !== 'granted') {
      permission = await LocalNotifications.requestPermissions();
    }
    if (permission.display !== 'granted') return;

    const ids = emis.map((emi) => ({ id: notificationId(emi.id) }));
    if (ids.length) await LocalNotifications.cancel({ notifications: ids });

    const now = new Date();
    const notifications = emis
      .filter((emi) => emi.active && emi.nextDue)
      .map((emi) => {
        const due = new Date(`${emi.nextDue}T09:00:00`);
        due.setDate(due.getDate() - 1);
        return {
          id: notificationId(emi.id),
          title: `EMI due tomorrow: ${emi.name}`,
          body: `${emi.bank || 'Your lender'} · ₹${emi.amount.toLocaleString('en-IN')} is due tomorrow.`,
          schedule: { at: due },
          extra: { emiId: emi.id, dueDate: emi.nextDue },
        };
      })
      .filter((notification) => notification.schedule.at.getTime() > now.getTime());

    if (notifications.length) {
      await LocalNotifications.schedule({ notifications });
    }
  } catch (error) {
    // Web preview does not provide native notification scheduling; don't block app use.
    console.warn('Could not schedule EMI due notifications:', error);
  }
}
