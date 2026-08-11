export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'Webhook Active' });
  }

  try {
    const update = req.body;

    let userId = null;
    let userName = 'Telegram User';
    let inviteLinkUsed = '';

    const MY_LINK_KEY = "JasEYKHjpqxhMjFl";

    // 1. Admin Approval (Join Request) Flow
    if (update.chat_join_request) {
      userId = update.chat_join_request.from.id;
      const u = update.chat_join_request.from;
      userName = u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : 'Telegram User';
      inviteLinkUsed = update.chat_join_request.invite_link ? update.chat_join_request.invite_link.invite_link : '';
    } 
    // 2. Direct Member Join Flow
    else if (update.chat_member) {
      const newStatus = update.chat_member.new_chat_member.status;
      if (['member'].includes(newStatus)) {
        userId = update.chat_member.new_chat_member.user.id;
        const u = update.chat_member.new_chat_member.user;
        userName = u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : 'Telegram User';
        inviteLinkUsed = update.chat_member.invite_link ? update.chat_member.invite_link.invite_link : '';
      }
    }

    // SMART CHECK: Agar link me aapki key "JasEYKHjpqxhMjFl" hai, YA link missing bhi ho, toh ACCEPT karo!
    const isMyLink = inviteLinkUsed.includes(MY_LINK_KEY) || inviteLinkUsed === '';

    if (userId && isMyLink) {
      console.log(`✅ MATCHED REQUEST FOR USER: ${userName} (${userId})`);

      const PIXEL_ID = "1418629833467614";
      const ACCESS_TOKEN = "EAATCZANWBwMEBSPRuIAdvrKEgvDsSdLbWhdHHJFknu7K8gAYGCIV9IEMLTvIsPqkFZBEExgDo1qX9aQKXYs9QP2ocmD8pkIczUzPPKw9LU2obbukMAXzbrBmjqjmkAtiNbBaGymOOhvrPc2mZCZBmkQeVnjsWtiSSHfxSSo5EuKeCpZApqolcjeJQK7UV2AZDZD";

      // Meta CAPI Call
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
    } else if (userId) {
      console.log(` Ignored join request from another link: ${inviteLinkUsed}`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
