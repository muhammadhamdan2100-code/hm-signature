import LegalPage from "../components/LegalPage";

export default function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="September 2026"
      sections={[
        {
          title: "Information We Collect",
          body: [
            "When you place an order, create an account, or contact us, we collect information such as your name, email address, phone number, shipping address, and payment details necessary to fulfil your order.",
            "We also collect basic usage data — pages visited, items viewed, and cart activity — to improve your shopping experience.",
          ],
        },
        {
          title: "How We Use Your Information",
          body: [
            "Your information is used to process orders, provide customer support, personalize recommendations (such as Scent Finder results), and send order updates or marketing communications you've opted into.",
            "We never sell your personal information to third parties.",
          ],
        },
        {
          title: "Data Storage & Security",
          body: [
            "We take reasonable technical and organizational measures to protect your data from unauthorized access, alteration, or disclosure. Payment details are processed through secure, encrypted channels.",
          ],
        },
        {
          title: "Cookies",
          body: [
            "Our site uses cookies and local storage to remember your cart, wishlist, and preferences between visits. You can clear these at any time through your browser settings.",
          ],
        },
        {
          title: "Your Rights",
          body: [
            "You may request access to, correction of, or deletion of your personal data at any time by contacting us through our Contact page.",
          ],
        },
      ]}
    />
  );
}
