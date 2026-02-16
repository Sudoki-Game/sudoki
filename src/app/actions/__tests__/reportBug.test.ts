import nodemailer from 'nodemailer';
import { reportBug } from '../reportBug';

const sendMailMock = jest.fn();

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(() => ({
      sendMail: sendMailMock,
    })),
  },
}));

function buildFormData(
  values: Partial<{
    email: string;
    category: string;
    description: string;
    steps: string;
  }>,
): FormData {
  const formData = new FormData();
  if (values.email !== undefined) formData.set('email', values.email);
  if (values.category !== undefined) formData.set('category', values.category);
  if (values.description !== undefined) {
    formData.set('description', values.description);
  }
  if (values.steps !== undefined) formData.set('steps', values.steps);
  return formData;
}

describe('reportBug', () => {
  const originalEnv = process.env;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      EMAIL_HOST: 'smtp.test.dev',
      EMAIL_USER: 'bot@test.dev',
      EMAIL_PASS: 'secret',
      BUG_REPORT_TO: 'bugs@test.dev',
    };
    sendMailMock.mockResolvedValue(undefined);
    consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env = originalEnv;
    consoleErrorSpy.mockRestore();
  });

  it('returns validation error when category is missing', async () => {
    const result = await reportBug(
      { success: false, message: '' },
      buildFormData({ description: 'Issue description' }),
    );

    expect(result).toEqual({
      success: false,
      message: 'Category and description are required.',
    });
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });

  it('returns validation error when description is missing', async () => {
    const result = await reportBug(
      { success: false, message: '' },
      buildFormData({ category: 'Gameplay' }),
    );

    expect(result).toEqual({
      success: false,
      message: 'Category and description are required.',
    });
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });

  it('sends bug report email and returns success', async () => {
    const result = await reportBug(
      { success: false, message: '' },
      buildFormData({
        email: 'player@test.dev',
        category: 'UI',
        description: 'Button overlaps on mobile',
        steps: '1. Open app\n2. Resize viewport',
      }),
    );

    expect(result).toEqual({
      success: true,
      message: 'Bug report sent successfully. Thank you!',
    });
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.test.dev',
      port: 587,
      secure: false,
      auth: {
        user: 'bot@test.dev',
        pass: 'secret',
      },
    });
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'bugs@test.dev',
        subject: 'New Bug Report: UI',
      }),
    );
  });

  it('uses "Not provided" placeholders when optional fields are absent', async () => {
    await reportBug(
      { success: false, message: '' },
      buildFormData({
        category: 'Performance',
        description: 'Slow board load',
      }),
    );

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('Not provided'),
      }),
    );
  });

  it('returns failure message when email transport throws', async () => {
    const transportError = new Error('smtp unavailable');
    sendMailMock.mockRejectedValue(transportError);

    const result = await reportBug(
      { success: false, message: '' },
      buildFormData({
        category: 'Gameplay',
        description: 'Cannot submit puzzle',
      }),
    );

    expect(result).toEqual({
      success: false,
      message: 'Failed to send bug report. Please try again later.',
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(transportError);
  });
});
