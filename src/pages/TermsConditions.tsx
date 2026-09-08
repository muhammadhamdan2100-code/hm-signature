import LegalPage from "../components/LegalPage";

export default function TermsConditions() {
  return (
    <LegalPage
      title="Terms & Conditions"
      updated="September 2026"
      sections={[
        {
          title: "Acceptance of Terms",
          body: [
            "By accessing or using the HM Signature website, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use this site.",
          ],
        },
        {
          title: "Orders & Pricing",
          body: [
            "All prices are listed in Pakistani Rupees (Rs) and are subject to change without prior notice. We reserve the right to refuse or cancel any order at our discretion, including in cases of suspected fraud or pricing errors.",
          ],
        },
        {
          title: "Product Information",
          body: [
            "We make every effort to display our fragrances accurately, including notes, concentration, and packaging. Minor variations in batch or bottle design may occur and do not affect the fragrance quality.",
          ],
        },
        {
          title: "Intellectual Property",
          body: [
            "All content on this site — including the HM Signature name, logo, product photography, and written copy — is the property of HM Signature and may not be reproduced without permission.",
          ],
        },
        {
          title: "Limitation of Liability",
          body: [
            "HM Signature is not liable for any indirect or consequential damages arising from the use of our products or website, to the fullest extent permitted by law.",
          ],
        },
        {
          title: "Governing Law",
          body: [
            "These terms are governed by the laws of Pakistan, and any disputes shall be subject to the exclusive jurisdiction of the courts of Karachi.",
          ],
        },
      ]}
    />
  );
}
