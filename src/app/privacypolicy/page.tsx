export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 font-[family-name:var(--font-geist-sans)] text-zinc-300">
      <h1 className="mb-8 text-3xl font-bold text-white">Privacy Policy</h1>
      <p className="mb-6 text-sm text-zinc-500">Last updated: March 4, 2026</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="mb-2 text-lg font-semibold text-white">1. Introduction</h2>
          <p>
            This Privacy Policy describes how Avalansa (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) handles
            information when you use our application and its integration with Pinterest. This application is intended
            for personal use only and is not distributed to third parties.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-white">2. Information We Collect</h2>
          <p>
            When you connect your Pinterest account, we may access basic profile information and content as permitted
            by the Pinterest API. This includes your Pinterest username, profile data, and pin/board data necessary
            for the app to function.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-white">3. How We Use Your Information</h2>
          <p>
            Any information accessed through the Pinterest API is used solely to provide the app&apos;s functionality
            to you. We do not sell, share, or distribute your data to any third parties.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-white">4. Data Storage</h2>
          <p>
            Data accessed through the Pinterest API is stored securely and is only used for the operation of this
            application. We retain data only as long as necessary to provide the app&apos;s features.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-white">5. Third-Party Services</h2>
          <p>
            This application integrates with Pinterest&apos;s API. Your use of Pinterest is subject to
            Pinterest&apos;s own Privacy Policy and Terms of Service. We also use Vercel for hosting and analytics.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-white">6. Data Security</h2>
          <p>
            We take reasonable measures to protect your information. Access tokens and credentials are stored securely
            and are never exposed publicly.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-white">7. Your Rights</h2>
          <p>
            You may revoke this application&apos;s access to your Pinterest account at any time through your Pinterest
            account settings. Upon revocation, we will cease accessing your Pinterest data.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-white">8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Any changes will be reflected on this page with an
            updated revision date.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-white">9. Contact</h2>
          <p>
            If you have any questions about this Privacy Policy, you can reach us at{" "}
            <a href="mailto:contact@avalansa.com" className="text-white underline underline-offset-4 hover:text-zinc-300">
              contact@avalansa.com
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
