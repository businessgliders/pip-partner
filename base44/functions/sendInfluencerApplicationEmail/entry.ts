Deno.serve(async (req) => {
  try {
    const { applicationData } = await req.json();

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #f1889b 0%, #f7b1bd 30%, #fbe0e2 60%, #f6eee7 100%); padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_690aada19e27fe8fcf067828/33a04cb27_Pilatesinpinklogojusticon1.png" alt="Pilates in Pink™" style="width: 80px; height: 80px; margin-bottom: 15px;" />
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a18eb75a9e57a35bc853a/29d852d1f_.png" alt="Pilates in Pink™" style="height: 32px;" />
        </div>
        <div style="background: white; border-radius: 20px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #b67651; margin-top: 0; font-size: 24px; font-weight: 300;">New Influencer Application</h2>
          <div style="margin: 20px 0; padding: 15px; background: #fbe0e2; border-radius: 10px;">
            <h3 style="color: #b67651; margin: 0 0 15px 0; font-size: 16px;">Contact Information</h3>
            <p style="margin: 8px 0; color: #666;"><strong style="color: #b67651;">Name:</strong> ${applicationData.full_name}</p>
            <p style="margin: 8px 0; color: #666;"><strong style="color: #b67651;">Email:</strong> ${applicationData.email}</p>
            <p style="margin: 8px 0; color: #666;"><strong style="color: #b67651;">Location:</strong> ${applicationData.location || 'Not provided'}</p>
          </div>
          <div style="margin: 20px 0; padding: 15px; background: #fbe0e2; border-radius: 10px;">
            <h3 style="color: #b67651; margin: 0 0 15px 0; font-size: 16px;">Social Media</h3>
            <p style="margin: 8px 0; color: #666;"><strong style="color: #b67651;">Instagram:</strong> ${applicationData.instagram_handle}</p>
            ${applicationData.tiktok_handle ? `<p style="margin: 8px 0; color: #666;"><strong style="color: #b67651;">TikTok:</strong> ${applicationData.tiktok_handle}</p>` : ''}
            <p style="margin: 8px 0; color: #666;"><strong style="color: #b67651;">Follower Count:</strong> ${applicationData.follower_count || 'Not provided'}</p>
            <p style="margin: 8px 0; color: #666;"><strong style="color: #b67651;">Content Style:</strong> ${applicationData.content_style || 'Not provided'}</p>
          </div>
          ${applicationData.why_partner ? `
          <div style="margin: 20px 0; padding: 15px; background: #fbe0e2; border-radius: 10px;">
            <h3 style="color: #b67651; margin: 0 0 15px 0; font-size: 16px;">Why Partner with Us</h3>
            <p style="margin: 0; color: #666; line-height: 1.6;">${applicationData.why_partner}</p>
          </div>` : ''}
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #f7b1bd;">
            <p style="color: #b67651; margin: 0; font-size: 12px;">© ${new Date().getFullYear()} Pilates in Pink™™</p>
          </div>
        </div>
      </div>
    `;

    const recipients = [
      'info@pilatesinpinkstudio.com'
    ];

    const results = await Promise.all(recipients.map(async to => {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'PiP Partner App <partner@pilatesinpink.ca>',
          to,
          subject: `New Influencer Application: ${applicationData.full_name}`,
          html: emailBody,
        }),
      });
      const data = await res.json();
      console.log('Resend response for', to, ':', JSON.stringify(data));
      return data;
    }));

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});