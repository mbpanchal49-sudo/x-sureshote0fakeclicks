export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'Webhook Active' });
  }

  try {
    const update = req.body;

    let userId = null;

    // 1. Direct Member Join Detect Karo
    if (update.chat_member) {
      const newStatus = update.chat_member.new_chat_member.status;
      const oldStatus = update.chat_member.old_chat_member.status;

      if (['member'].includes(newStatus) && ['left', 'kicked', 'restricted'].includes(oldStatus)) {
        userId = update.chat_member.new_chat_member.user.id;
      }
    } 
    // 2. Join Request Detect Karo (Fallback)
    else if (update.chat_join_request) {
      userId = update.chat_join_request.from.id;
    }

    if (userId) {
      const PIXEL_ID = "1418629833467614";
      const ACCESS_TOKEN = "EAATCZANWBwMEBSPRuIAdvrKEgvDsSdLbWhdHHJFknu7K8gAYGCIV9IEMLTvIsPqkFZBEExgDo1qX9aQKXYs9QP2ocmD8pkIczUzPPKw9LU2obbukMAXzbrBmjqjmkAtiNbBaGymOOhvrPc2mZCZBmkQeVnjsWtiSSHfxSSo5EuKeCpZApqolcjeJQK7UV2AZDZD";
      const TEST_CODE = "TEST41060";

      // Meta Conversions API (CAPI) Trigger
      const capiUrl = `https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;
      
      const capiResponse = await fetch(capiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [{
            event_name: 'Subscribe',
            event_time: Math.floor(Date.now() / 1000),
            action_source: 'website',
            event_source_url: 'https://x-sureshot-testing-com.vercel.app/',
            user_data: {
              external_id: [String(userId)]
            }
          }],
          test_event_code: TEST_CODE
        })
      });

      const capiResult = await capiResponse.json();
      console.log('Meta CAPI Response:', capiResult);

      // Supabase Analytics Dashboard Log
      await fetch('https://uybcfnjlpqrqlnppsvww.supabase.co/rest/v1/campaign_stats', {
        method: 'POST',
        headers: {
          'apikey': 'sb_publishable_amAdJgwMkcko1NcwFvkOcA_zgVyMZnD',
          'Authorization': 'Bearer sb_publishable_amAdJgwMkcko1NcwFvkOcA_zgVyMZnD',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_type: 'telegram_join',
          user_id: String(userId),
          status: JSON.stringify(capiResult)
        })
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
