import Link from 'next/link';

export const metadata = {
  title: "Terms of Service | Daddy's AI",
  description: "Terms of service for Daddy's AI platform"
};

export default function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <Link href="/" className="text-orange-500 hover:text-orange-600 transition-colors">
          ← Back to Home
        </Link>
      </div>
      
      <h1 className="text-4xl font-montserrat font-bold mb-8">Terms of Service</h1>
      
      <div className="prose prose-invert max-w-none">
        <p className="text-lg mb-6">
          Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>
            Welcome to Daddy's AI. These Terms of Service govern your use of our website and services.
            By accessing or using our service, you agree to be bound by these Terms. If you disagree with any part of the terms,
            you may not access the service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Definitions</h2>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li><strong>"Service"</strong> refers to the Daddy's AI website and platform.</li>
            <li><strong>"User"</strong> refers to the person who accesses or uses the Service.</li>
            <li><strong>"Content"</strong> refers to all information and data made available through our Service.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
          <p>
            When you create an account with us, you must provide information that is accurate, complete, and current at all times.
            Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
          </p>
          <p className="mt-4">
            You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
            You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Intellectual Property</h2>
          <p>
            The Service and its original content, features, and functionality are and will remain the exclusive property of Daddy's AI and its licensors.
            The Service is protected by copyright, trademark, and other laws of both India and foreign countries.
            Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Daddy's AI.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. User Content</h2>
          <p>
            Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, or other material.
            You are responsible for the content that you post to the Service, including its legality, reliability, and appropriateness.
          </p>
          <p className="mt-4">
            By posting content to the Service, you grant us the right to use, modify, publicly perform, publicly display, reproduce, and distribute such content on and through the Service.
            You retain any and all of your rights to any content you submit, post or display on or through the Service and you are responsible for protecting those rights.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
          <p>
            In no event shall Daddy's AI, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages,
            including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Disclaimer</h2>
          <p>
            Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis.
            The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability,
            fitness for a particular purpose, non-infringement or course of performance.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Governing Law</h2>
          <p>
            These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.
            Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time.
            If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect.
            What constitutes a material change will be determined at our sole discretion.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
            <br />
            <a href="mailto:daddysartificialintelligence@gmail.com" className="text-orange-500 hover:text-orange-600">daddysartificialintelligence@gmail.com</a>
          </p>
        </section>
      </div>
    </div>
  );
} 