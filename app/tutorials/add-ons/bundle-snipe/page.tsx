import { PageHeader } from '@/components/layout/page-header';

export default function BundleSnipeTutorial() {
  return (
    <>
      <PageHeader title="Bundle Snipe Tutorial" />
      <div className="prose dark:prose-invert max-w-none p-4 md:p-6">
        <h1 className="text-3xl font-bold mb-6">
          How the Bundle Snipe Bot Works
        </h1>
        <div className="space-y-4">
          <p>
            The Bundle Snipe Bot helps you capture profitable trading
            opportunities in transaction bundles. Here's how it works:
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Monitor incoming transaction bundles in real-time</li>
            <li>
              Analyze bundle contents for potential arbitrage opportunities
            </li>
            <li>Execute trades to capture price discrepancies</li>
            <li>Manage risk and optimize profit potential</li>
          </ol>
          <p>
            For more detailed information and step-by-step usage instructions,
            please refer to our comprehensive documentation.
          </p>
        </div>
      </div>
    </>
  );
}
