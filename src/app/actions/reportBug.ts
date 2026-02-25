'use server';

import nodemailer from 'nodemailer';
import { z } from 'zod';
import {
  getFormDataString,
  getZodIssueMessage,
  logActionError,
} from '@/app/actions/lib/validation';

export type BugReportState = {
  success: boolean;
  message: string;
};

const requiredFieldSchema = z
  .string()
  .trim()
  .min(1, 'Category and description are required.');

const optionalStringSchema = z.string().trim().optional();

export async function reportBug(
  _prevState: BugReportState,
  formData: FormData,
): Promise<BugReportState> {
  try {
    const emailRaw = getFormDataString(formData, 'email');
    const categoryRaw = getFormDataString(formData, 'category');
    const descriptionRaw = getFormDataString(formData, 'description');
    const stepsRaw = getFormDataString(formData, 'steps');

    const categoryParsed = requiredFieldSchema.safeParse(categoryRaw ?? '');
    const descriptionParsed = requiredFieldSchema.safeParse(
      descriptionRaw ?? '',
    );

    if (!categoryParsed.success || !descriptionParsed.success) {
      const source = categoryParsed.success ? descriptionParsed : categoryParsed;
      return {
        success: false,
        message: getZodIssueMessage(
          source,
          'Category and description are required.',
        ),
      };
    }

    const emailParsed = optionalStringSchema.safeParse(emailRaw ?? undefined);
    const stepsParsed = optionalStringSchema.safeParse(stepsRaw ?? undefined);

    if (!emailParsed.success || !stepsParsed.success) {
      return {
        success: false,
        message: 'Invalid form submission.',
      };
    }

    const category = categoryParsed.data;
    const description = descriptionParsed.data;
    const email = emailParsed.data;
    const steps = stepsParsed.data;

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
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
      `,
    });

    return {
      success: true,
      message: 'Bug report sent successfully. Thank you!',
    };
  } catch (error) {
    logActionError('ReportBugAction:reportBug', error);
    return {
      success: false,
      message: 'Failed to send bug report. Please try again later.',
    };
  }
}
