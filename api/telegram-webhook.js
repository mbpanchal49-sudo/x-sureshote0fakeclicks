export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'Webhook Active' });
  }

  try {
    const update = req.body;

    let userId = null;
    let userName = 'Telegram User';

    // 1. Join Request Detect (Admin Approval - Direct Capture)
    if (update.chat_join_request) {
      userId = update.chat_join_request.from.id;
      const u = update.chat_join_request.from;
      userName = u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : 'Telegram User';
    } 
    // 2. Direct Member Join Detect
    else if (update.chat_member) {
      const newStatus = update.chat_member.new_chat_member.status;
      if (['member'].includes(newStatus)) {
        userId = update.chat_member.new_chat_member.user.id;
        const u = update.chat_member.new_chat_member.user;
        userName = u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : 'Telegram User';
      }
    }

    // Direct Process (No strict link blocking error)
    if (userId) {
      console.log(`✅ MATCHED AND PROCESSING: ${userName} (${userId})`);

      const PIXEL_ID = "1418629833467614";
      const ACCESS_TOKEN = "EAATCZANWBwMEBSPRuIAdvrKEgvDsSdLbWhdHHJFknu7K8gAYGCIV9IEMLTvIsPqkFZBEExgDo1qX9aQKXYs9QP2ocmD8pkIczUzPPKw9LU2obbukMAXzbrBmjqjmkAtiNbBaGymOOhvrPc2mZCZBmkQeVnjsWtiSSHfxSSo5EuKeCpZApqolcjeJQK7UV2AZDZD";

      // Meta CAPI Trigger
      const capiUrl = `https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;
      
      const capiResponse = await fetch(capiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [{
            event_name: 'Subscribe',
            event_time: Math.floor(Date.now() / 1000),
            action_source: 'website',
            event_source_url: 'https://x-sureshote-testingcom.vercel.app/',
            user_data: {
              external_id: [String(userId)]
            }
          }]
        })
      });

      const capiResult = await capiResponse.json();

      // FIREBASE STORE
      const firestoreUrl = 'https://firestore.googleapis.com/v1/projects/x-sure-shote-checkking/databases/(default)/documents/campaign_stats';
      
      await fetch(firestoreUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            event_type: { stringValue: 'telegram_join' },
            user_id: { stringValue: String(userId) },
            user_name: { stringValue: userName },
            status: { stringValue: JSON.stringify(capiResult) },
            created_at: { stringValue: new Date().toISOString() }
          }
        })
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
