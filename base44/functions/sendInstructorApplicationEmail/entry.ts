import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { applicationData } = await req.json();

    const qualList = (applicationData.qualifications || []).map(q => `<li style="color:#666; margin:4px 0;">${q}</li>`).join('');

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #f1889b 0%, #f7b1bd 30%, #fbe0e2 60%, #f6eee7 100%); padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_690aada19e27fe8fcf067828/33a04cb27_Pilatesinpinklogojusticon1.png" alt="Pilates in Pink" style="width: 80px; height: 80px; margin-bottom: 15px;" />
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a18eb75a9e57a35bc853a/29d852d1f_.png" alt="Pilates in Pink" style="height: 32px;" />
        </div>
        <div style="background: white; border-radius: 20px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #b67651; margin-top: 0; font-size: 24px; font-weight: 300;">New Instructor Application</h2>
          <div style="margin: 20px 0; padding: 15px; background: #fbe0e2; border-radius: 10px;">
            <h3 style="color: #b67651; margin: 0 0 15px 0; font-size: 16px;">Contact Information</h3>
            <p style="margin: 8px 0; color: #666;"><strong style="color: #b67651;">Name:</strong> ${applicationData.first_name} ${applicationData.last_name}</p>
            <p style="margin: 8px 0; color: #666;"><strong style="color: #b67651;">Email:</strong> ${applicationData.email}</p>
            <p style="margin: 8px 0; color: #666;"><strong style="color: #b67651;">Preferred Studio:</strong> ${applicationData.preferred_studio || 'Not provided'}</p>
            <p style="margin: 8px 0; color: #666;"><strong style="color: #b67651;">Postal Code:</strong> ${applicationData.postal_code || 'Not provided'}</p>
            <p style="margin: 8px 0; color: #666;"><strong style="color: #b67651;">Province:</strong> ${applicationData.province || 'Not provided'}</p>
          </div>
          ${qualList ? `
          <div style="margin: 20px 0; padding: 15px; background: #fbe0e2; border-radius: 10px;">
            <h3 style="color: #b67651; margin: 0 0 15px 0; font-size: 16px;">Qualifications</h3>
            <ul style="margin: 0; padding-left: 20px;">${qualList}</ul>
          </div>` : ''}
          ${applicationData.message ? `
          <div style="margin: 20px 0; padding: 15px; background: #fbe0e2; border-radius: 10px;">
            <h3 style="color: #b67651; margin: 0 0 15px 0; font-size: 16px;">Message</h3>
            <p style="margin: 0; color: #666; line-height: 1.6;">${applicationData.message}</p>
          </div>` : ''}
          ${applicationData.resume_url ? `
          <div style="margin: 20px 0; padding: 15px; background: #fbe0e2; border-radius: 10px;">
            <h3 style="color: #b67651; margin: 0 0 15px 0; font-size: 16px;">Resume</h3>
            <a href="${applicationData.resume_url}" style="color: #b67651;">View Attached Resume</a>
          </div>` : ''}
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #f7b1bd;">
            <p style="color: #b67651; margin: 0; font-size: 12px;">© ${new Date().getFullYear()} Pilates in Pink™</p>
          </div>
        </div>
      </div>
    `;

    await base44.integrations.Core.SendEmail({
      to: 'info@pilatesinpinkstudio.com',
      subject: `New Instructor Application: ${applicationData.first_name} ${applicationData.last_name}`,
      body: emailBody,
      from_name: 'Pilates in Pink'
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});