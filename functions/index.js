const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const { HttpsError, onCall } = require('firebase-functions/v2/https');

initializeApp();

const db = getFirestore();
const INVALID_TOKEN_CODES = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
]);

exports.sendPushToUser = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in before sending a notification.');
  }
  if (request.auth.token.admin !== true) {
    throw new HttpsError('permission-denied', 'An administrator role is required.');
  }

  const { uid, title, body, data } = request.data ?? {};
  if (typeof uid !== 'string' || !uid || typeof title !== 'string' || !title.trim()) {
    throw new HttpsError('invalid-argument', 'A target user, title, and body are required.');
  }
  if (typeof body !== 'string' || !body.trim() || title.length > 120 || body.length > 500) {
    throw new HttpsError('invalid-argument', 'Notification title or body is invalid.');
  }

  const messageData = {};
  if (data !== undefined) {
    if (data === null || typeof data !== 'object' || Array.isArray(data)) {
      throw new HttpsError('invalid-argument', 'Notification data must be a string map.');
    }
    for (const [key, value] of Object.entries(data)) {
      if (
        !/^[A-Za-z0-9_]{1,64}$/.test(key) ||
        key === 'from' ||
        key.startsWith('google.') ||
        key.startsWith('gcm.') ||
        typeof value !== 'string' ||
        value.length > 1024 ||
        Object.keys(messageData).length >= 20
      ) {
        throw new HttpsError(
          'invalid-argument',
          'Notification data keys and values must be short, non-reserved strings.'
        );
      }
      messageData[key] = value;
    }
  }

  const tokenSnapshot = await db.collection('users').doc(uid).collection('fcmTokens').get();
  const tokenDocuments = tokenSnapshot.docs.filter(
    (document) => document.get('provider') === 'fcm' && typeof document.get('token') === 'string'
  );
  const tokens = tokenDocuments.map((document) => document.get('token'));
  if (tokens.length === 0) return { successCount: 0, failureCount: 0 };

  let successCount = 0;
  let failureCount = 0;
  for (let offset = 0; offset < tokens.length; offset += 500) {
    const batchTokens = tokens.slice(offset, offset + 500);
    const batchDocuments = tokenDocuments.slice(offset, offset + 500);
    const response = await getMessaging().sendEachForMulticast({
      tokens: batchTokens,
      notification: { title: title.trim(), body: body.trim() },
      data: messageData,
      android: {
        priority: 'high',
        notification: { channelId: 'default' },
      },
      apns: {
        payload: { aps: { sound: 'default' } },
      },
    });
    successCount += response.successCount;
    failureCount += response.failureCount;

    await Promise.all(
      response.responses.map(async (result, index) => {
        if (!result.success && result.error && INVALID_TOKEN_CODES.has(result.error.code)) {
          await batchDocuments[index].ref.delete();
        }
      })
    );
  }

  return { successCount, failureCount };
});
