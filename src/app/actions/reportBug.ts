// /app/actions/reportBug.ts
'use server';

import nodemailer from 'nodemailer';

export type BugReportState = {
  success: boolean;
  message: string;
};

export async function reportBug(
  prevState: BugReportState,
  formData: FormData
): Promise<BugReportState> {
  try {
    const email = formData.get('email') as string | null;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const steps = formData.get('steps') as string | null;

    if (!category || !description) {
      return {
        success: false,
        message: 'Category and description are required.'
      };
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Bug Reporter" <${process.env.EMAIL_USER}>`,
      to: process.env.BUG_REPORT_TO,
      subject: `New Bug Report: ${category}`,
      html: `
<h3>Reporter Email:</h3> 
${email || 'Not provided'}

<h3>Category:</h3>
${category}

<h3>Description:</h3>
${description}

<h3>Steps to Reproduce:</h3>
${steps || 'Not provided'}
      `
    });

    return {
      success: true,
      message: 'Bug report sent successfully. Thank you!'
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: 'Failed to send bug report. Please try again later.'
    };
  }
}
