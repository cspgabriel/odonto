"use server";

import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendContactEmail(data: { name: string; email: string; message: string; toEmail: string }) {
    const escapeHtml = (value: string) =>
        value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");

    const safeName = escapeHtml(data.name ?? "");
    const safeEmail = escapeHtml(data.email ?? "");
    const safeMessage = escapeHtml(data.message ?? "");
    const replyToEmail = (data.email ?? "").replace(/[\r\n]+/g, "").trim();
    const subjectName = (data.name ?? "").replace(/[\r\n]+/g, " ").trim();
    const mailtoHref = `mailto:${encodeURIComponent((data.email ?? "").trim())}`;

    if (!resend) {
        if (process.env.NODE_ENV === "development") {
            console.log("[CareNova] Mock email sent (dev only)");
        }
        // Simulate a brief delay to show loading state
        await new Promise((resolve) => setTimeout(resolve, 800));
        return { success: true };
    }

    try {
        // Resend's free/testing tier strictly only allows sending to your verified registered email address.
        // During development, we force routing to dev010contact@gmail.com to bypass the domain restriction error.
        const recipientEmail = process.env.NODE_ENV === "development"
            ? "dev010contact@gmail.com"
            : data.toEmail;

        const { error } = await resend.emails.send({
            from: "Clinic Contact Form <onboarding@resend.dev>", // Use a real domain in production like updates@yourdomain.com
            replyTo: replyToEmail,
            to: [recipientEmail],
            subject: `New Contact Form Submission from ${subjectName}`,
            html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #e11d48; margin-top: 0; margin-bottom: 24px; font-size: 24px; font-weight: 600;">New Contact Form Message</h2>
          
          <div style="margin-bottom: 20px;">
            <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;">Name</p>
            <p style="margin: 4px 0 0 0; color: #0f172a; font-size: 16px; font-weight: 500;">${safeName}</p>
          </div>

          <div style="margin-bottom: 24px;">
            <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;">Email Address</p>
            <p style="margin: 4px 0 0 0; color: #0f172a; font-size: 16px; font-weight: 500;">
              <a href="${mailtoHref}" style="color: #3b82f6; text-decoration: none;">${safeEmail}</a>
            </p>
          </div>
          
          <div style="margin-bottom: 24px;">
            <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;">Message / Inquiry</p>
            <div style="margin-top: 8px; padding: 16px; background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; color: #334155; font-size: 15px; line-height: 1.5; white-space: pre-wrap;">${safeMessage}</div>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0 24px;" />
          
          <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 0;">
            This email was generated from your ClinicMaster website's contact form.
          </p>
        </div>
      `
        });

        if (error) {
            console.error("Resend error:", error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error("Failed to send email:", error);
        return { success: false, error: "Failed to send email." };
    }
}
