import type { Metadata } from 'next';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Read Sudoki privacy policy, including data collection, usage, and your data protection rights.',
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    title: 'Privacy Policy | Sudoki',
    description:
      'Read Sudoki privacy policy, including data collection, usage, and your data protection rights.',
    url: '/privacy',
    type: 'article',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Sudoki - Daily Sudoku and leaderboard competition',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | Sudoki',
    description:
      'Read Sudoki privacy policy, including data collection, usage, and your data protection rights.',
    images: ['/opengraph-image.png'],
  },
};

export default function PrivacyPage() {
  return (
    <div className={styles.container}>
      <h1>Privacy Policy</h1>
      <p>Last Updated: February 3, 2026</p>

      <section>
        <h2>1. Introduction</h2>
        <p>
          This Privacy Policy describes how we collect, use, and protect your
          personal information when you use our Sudoku game application
          (&quot;Service&quot;). We are committed to protecting your privacy and
          complying with the General Data Protection Regulation (GDPR) and other
          applicable data protection laws.
        </p>
      </section>

      <section>
        <h2>2. Data Controller</h2>
        <p>
          The data controller responsible for your personal data is the operator
          of this Service. For questions about this Privacy Policy or to
          exercise your rights, please contact us at the details provided in
          Section 11.
        </p>
      </section>

      <section>
        <h2>3. Information We Collect</h2>

        <h3>3.1 Personal Information</h3>
        <p>We collect the following types of personal information:</p>
        <ul>
          <li>
            <strong>Account Information:</strong> Email address, username, and
            authentication credentials
          </li>
          <li>
            <strong>Profile Information:</strong> Display name and profile
            preferences
          </li>
          <li>
            <strong>Game Data:</strong> Game statistics, scores, completion
            times, and puzzle history
          </li>
          <li>
            <strong>Match Data:</strong> Online match history and results
          </li>
          <li>
            <strong>Bug Reports:</strong> Information you provide when reporting
            issues
          </li>
        </ul>

        <h3>3.2 Automatically Collected Information</h3>
        <ul>
          <li>
            <strong>Device Information:</strong> Browser type, device type,
            operating system
          </li>
          <li>
            <strong>Usage Data:</strong> Interactions with the Service, features
            used, and session duration
          </li>
          <li>
            <strong>Cookies and Similar Technologies:</strong> See Section 5 for
            details
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Legal Basis for Processing (GDPR)</h2>
        <p>
          We process your personal data based on the following legal grounds:
        </p>
        <ul>
          <li>
            <strong>Consent:</strong> You provide explicit consent when creating
            an account
          </li>
          <li>
            <strong>Contractual Necessity:</strong> Processing is necessary to
            provide the Service you requested
          </li>
          <li>
            <strong>Legitimate Interests:</strong> Improving the Service,
            preventing fraud, and ensuring security
          </li>
          <li>
            <strong>Legal Obligations:</strong> Complying with applicable laws
            and regulations
          </li>
        </ul>
      </section>

      <section>
        <h2>5. How We Use Your Information</h2>
        <p>We use your personal information for the following purposes:</p>
        <ul>
          <li>Providing and maintaining the Service</li>
          <li>Creating and managing your account</li>
          <li>Tracking game progress and statistics</li>
          <li>Displaying leaderboards and rankings</li>
          <li>Responding to bug reports and support requests</li>
          <li>Improving and optimizing the Service</li>
          <li>Ensuring security and preventing fraud</li>
          <li>Complying with legal obligations</li>
        </ul>
      </section>

      <section>
        <h2>6. Cookies and Tracking Technologies</h2>
        <p>
          We use cookies and similar tracking technologies to enhance your
          experience. Cookies are small data files stored on your device.
        </p>

        <h3>Types of Cookies We Use:</h3>
        <ul>
          <li>
            <strong>Essential Cookies:</strong> Required for authentication and
            core functionality
          </li>
          <li>
            <strong>Performance Cookies:</strong> Help us understand how you use
            the Service
          </li>
          <li>
            <strong>Preference Cookies:</strong> Remember your settings and
            preferences
          </li>
        </ul>

        <p>
          You can control cookie settings through your browser. Note that
          disabling essential cookies may affect Service functionality.
        </p>
      </section>

      <section>
        <h2>7. Third-Party Services</h2>
        <p>
          We use the following third-party services that may process your data:
        </p>

        <h3>7.1 Firebase (Google)</h3>
        <p>
          We use Firebase for authentication, database services, and hosting.
          Firebase may collect and process data according to{' '}
          <a
            href='https://policies.google.com/privacy'
            target='_blank'
            rel='noopener noreferrer'
          >
            Google&apos;s Privacy Policy
          </a>
          .
        </p>

        <h3>7.2 Cloud Services</h3>
        <p>
          Your data is stored on Firebase/Google Cloud Platform servers. Data
          may be transferred to and processed in countries outside the European
          Economic Area (EEA). Google provides adequate safeguards through
          Standard Contractual Clauses.
        </p>
      </section>

      <section>
        <h2>8. Data Retention</h2>
        <p>
          We retain your personal data for as long as your account is active or
          as needed to provide the Service. You may request deletion of your
          account and associated data at any time (see Section 9).
        </p>
        <p>
          After account deletion, we may retain certain information for legal
          compliance, fraud prevention, or legitimate business purposes for a
          limited period.
        </p>
      </section>

      <section>
        <h2>9. Your Rights Under GDPR</h2>
        <p>
          If you are located in the EEA or UK, you have the following rights:
        </p>
        <ul>
          <li>
            <strong>Right of Access:</strong> Request a copy of your personal
            data
          </li>
          <li>
            <strong>Right to Rectification:</strong> Correct inaccurate or
            incomplete data
          </li>
          <li>
            <strong>Right to Erasure:</strong> Request deletion of your personal
            data (&quot;right to be forgotten&quot;)
          </li>
          <li>
            <strong>Right to Restrict Processing:</strong> Limit how we use your
            data
          </li>
          <li>
            <strong>Right to Data Portability:</strong> Receive your data in a
            structured, machine-readable format
          </li>
          <li>
            <strong>Right to Object:</strong> Object to processing based on
            legitimate interests
          </li>
          <li>
            <strong>Right to Withdraw Consent:</strong> Withdraw consent at any
            time without affecting prior processing
          </li>
          <li>
            <strong>Right to Lodge a Complaint:</strong> File a complaint with
            your local data protection authority
          </li>
        </ul>
        <p>
          To exercise these rights, please contact us using the information in
          Section 11.
        </p>
      </section>

      <section>
        <h2>10. Data Security</h2>
        <p>
          We implement appropriate technical and organizational measures to
          protect your personal data against unauthorized access, loss,
          destruction, or alteration. These measures include:
        </p>
        <ul>
          <li>Encryption of data in transit and at rest</li>
          <li>Secure authentication mechanisms</li>
          <li>Regular security assessments</li>
          <li>Access controls and authentication</li>
          <li>Secure cloud infrastructure (Firebase/Google Cloud)</li>
        </ul>
        <p>
          However, no method of transmission over the internet is 100% secure.
          While we strive to protect your data, we cannot guarantee absolute
          security.
        </p>
      </section>

      <section>
        <h2>11. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy or wish to exercise
          your rights, please contact us at:
        </p>
        <ul>
          <li>
            <strong>Email:</strong>{' '}
            <a href='mailto:dylan@dylanalmond.net'>dylan@dylanalmond.net</a>
          </li>
        </ul>
        <p>
          We will respond to your request within 30 days as required by GDPR.
        </p>
      </section>

      <section>
        <h2>12. Children&apos;s Privacy</h2>
        <p>
          Our Service is not directed to children under 16 years of age. We do
          not knowingly collect personal information from children under 16. If
          you become aware that a child has provided us with personal data,
          please contact us, and we will take steps to delete such information.
        </p>
      </section>

      <section>
        <h2>13. International Data Transfers</h2>
        <p>
          Your information may be transferred to and processed in countries
          outside your country of residence, including the United States. These
          countries may have different data protection laws. We ensure
          appropriate safeguards are in place through:
        </p>
        <ul>
          <li>
            Standard Contractual Clauses approved by the European Commission
          </li>
          <li>Adequacy decisions by the European Commission</li>
        </ul>
      </section>

      <section>
        <h2>14. Changes to This Privacy Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify
          you of any material changes by posting the new Privacy Policy on this
          page and updating the &quot;Last Updated&quot; date.
        </p>
        <p>
          We encourage you to review this Privacy Policy periodically for any
          changes. Continued use of the Service after changes constitutes
          acceptance of the updated policy.
        </p>
      </section>

      <section>
        <h2>15. Automated Decision-Making</h2>
        <p>
          We do not use automated decision-making or profiling that produces
          legal or similarly significant effects on you.
        </p>
      </section>
    </div>
  );
}
