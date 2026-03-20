Deno.serve(async (req) => {
  try {
    const { applicationData } = await req.json();

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #7b9e9e 0%, #a8c5c5 30%, #d6eaea 60%, #eef6f6 100%); padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_690aada19e27fe8fcf067828/33a04cb27_Pilatesinpinklogojusticon1.png" alt="Pilates in Pink™" style="width: 80px; height: 80px; margin-bottom: 15px;" />
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a18eb75a9e57a35bc853a/29d852d1f_.png" alt="Pilates in Pink™" style="height: 32px;" />
        </div>
        <div style="background: white; border-radius: 20px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #4a7c7c; margin-top: 0; font-size: 24px; font-weight: 300;">New Front Desk Admin Application</h2>
          <div style="margin: 20px 0; padding: 15px; background: #d6eaea; border-radius: 10px;">
            <h3 style="color: #4a7c7c; margin: 0 0 15px 0; font-size: 16px;">Contact Information</h3>
            <p style="margin: 8px 0; color: #666;"><strong style="color: #4a7c7c;">Name:</strong> ${applicationData.first_name} ${applicationData.last_name}</p>
            <p style="margin: 8px 0; color: #666;"><strong style="color: #4a7c7c;">Email:</strong> ${applicationData.email}</p>
            <p style="margin: 8px 0; color: #666;"><strong style="color: #4a7c7c;">Preferred Studio:</strong> ${applicationData.preferred_studio || 'Not provided'}</p>
            <p style="margin: 8px 0; color: #666;"><strong style="color: #4a7c7c;">Postal Code:</strong> ${applicationData.postal_code || 'Not provided'}</p>
            <p style="margin: 8px 0; color: #666;"><strong style="color: #4a7c7c;">Province:</strong> ${applicationData.province || 'Not provided'}</p>
          </div>
          ${applicationData.message ? `
          <div style="margin: 20px 0; padding: 15px; background: #d6eaea; border-radius: 10px;">
            <h3 style="color: #4a7c7c; margin: 0 0 15px 0; font-size: 16px;">Message</h3>
            <p style="margin: 0; color: #666; line-height: 1.6;">${applicationData.message}</p>
          </div>` : ''}
          ${applicationData.resume_url ? `
          <div style="margin: 20px 0; padding: 15px; background: #d6eaea; border-radius: 10px;">
            <h3 style="color: #4a7c7c; margin: 0 0 15px 0; font-size: 16px;">Resume</h3>
            <a href="${applicationData.resume_url}" style="color: #4a7c7c;">View Attached Resume</a>
          </div>` : ''}
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #a8c5c5;">
            <p style="color: #4a7c7c; margin: 0; font-size: 12px;">© ${new Date().getFullYear()} Pilates in Pink™</p>
          </div>
        </div>
      </div>
    `;

    const recipients = [
      'rashmeen@pilatesinpinkstudio.com',
      'gurpreen@pilatesinpinkstudio.com',
      'sahil@pilatesinpinkstudio.com'
    ];

    await Promise.all(recipients.map(to =>
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Pilates in Pink™ <noreply@pilatesinpink.ca>',
          to,
          subject: `New Front Desk Admin Application: ${applicationData.first_name} ${applicationData.last_name}`,
          html: emailBody,
          ...(applicationData.resume_url ? {
            attachments: [{
              filename: 'resume.pdf',
              path: applicationData.resume_url,
            }]
          } : {}),
        }),
      })
    ));

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});