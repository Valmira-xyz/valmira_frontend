// import ProjectCostEstimator from "@/components/feecalculator/project-cost-estimater"
import { TiTick } from 'react-icons/ti';

import { FeeCalculator } from '@/components/feecalculator/fee-calculator';

export default function PricingPage() {
  return (
    <div className="container py-4 px-4 mx-2">
      <div className="space-y-4 max-w-[1018px]">
        <div className="space-y-2">
          <h1 className="text-lg font-bold text-start font-tt">
            Transparent Pricing
          </h1>
          <p className="text-xs text-muted-foreground text-start  ">
            We don't charge retainers. You only pay when you use bots, and only
            when they work for you. Use the calculator below to estimate your
            costs.
          </p>

          <FeeCalculator />
          {/* <ProjectCostEstimator /> */}
          <div className="bg-muted rounded-lg p-6 border border-borde space-y-4">
            <h2 className="text-xl font-semibold">How Valmira Fees Work</h2>
            <p className="text-sm !mt-2 text-muted-foreground">
              How you earn from referred projects.
            </p>

            <div className="space-y-4 px-4">
              <div className="flex gap-4 items-center">
                <div className="bg-background rounded-md h-12 w-12 flex items-center justify-center shrink-0">
                  <span className="text-base font-semibold font-tt">1</span>
                </div>
                <div className="items-center justify-center">
                  <h3 className="text-base font-semibold font-tt">
                    Setup Cost (Optional)
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    $200 one-time setup fee (waived for early users). Covers
                    core infrastructure and support.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-center ">
                <div className="bg-background rounded-md h-12 w-12 flex items-center justify-center shrink-0">
                  <span className="text-base font-semibold font-tt">2</span>
                </div>
                <div>
                  <h3 className="text-base font-semibold font-tt">
                    Daily Bot Fees
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    $3–$5/day per active bot. Keeps your bots live, responsive,
                    and executing. Pause anytime = no daily charge.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-center ">
                <div className="bg-background rounded-md h-12 w-12 flex items-center justify-center shrink-0">
                  <span className="text-base font-semibold font-tt">3</span>
                </div>
                <div>
                  <h3 className="text-base font-semibold font-tt">
                    Performance-Based Fees
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Fees are only charged when bots perform successfully. Each
                    bot has its own fee structure based on its function and
                    value provided.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h3 className="text-base font-semibold font-tt mb-2">
                You Always See Fees Up Front
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1 flex w-fit justify-between">
                <li className="m-1 flex items-center">
                  {' '}
                  <span className="mr-1 bg-primary rounded-full p-0">
                    <TiTick className="w-3 h-3 text-xs text-primary-foreground" />
                  </span>
                  Fee summary updates live as you configure
                </li>
                <li className="m-1 flex items-center">
                  {' '}
                  <span className="mr-1 bg-primary rounded-full p-0">
                    <TiTick className="w-3 h-3 text-xs text-primary-foreground" />
                  </span>
                  No hidden charges, no backend skims
                </li>
                <li className="m-1 flex items-center">
                  {' '}
                  <span className="mr-1 bg-primary rounded-full p-0">
                    <TiTick className="w-3 h-3 text-xs text-primary-foreground" />
                  </span>
                  Stop, edit, or destroy your bots anytime
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
