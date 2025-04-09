import { BookOpen, FileText, HelpCircle } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Tutorials | Valmira',
  description: 'Learn how to use Valmira platform and its features',
};

export default function TutorialsPage() {
  return (
    <div className="w-[calc(100vw-320px)]">
      <PageHeader title="Tutorials & Resources" />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Learn the basics of Valmira platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/tutorials/projects"
                  className="text-blue-600 hover:underline"
                >
                  Creating Your First Project
                </Link>
              </li>
              <li>
                <Link
                  href="/tutorials/wallet-setup"
                  className="text-blue-600 hover:underline"
                >
                  Wallet Setup Guide
                </Link>
              </li>
              <li>
                <Link
                  href="/tutorials/dashboard-overview"
                  className="text-blue-600 hover:underline"
                >
                  Dashboard Overview
                </Link>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
              <Link href="/tutorials/projects">
                <BookOpen className="mr-2 h-4 w-4" />
                View All Basics
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add-Ons & Bots</CardTitle>
            <CardDescription>
              Tutorials for different bot types and add-ons
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/tutorials/add-ons/bundle-snipe"
                  className="text-blue-600 hover:underline"
                >
                  Liquidation Snipe Bot
                </Link>
              </li>
              <li>
                <Link
                  href="/tutorials/add-ons/volume-bot"
                  className="text-blue-600 hover:underline"
                >
                  Volume Bot
                </Link>
              </li>
              <li>
                <Link
                  href="/tutorials/add-ons/holder-bot"
                  className="text-blue-600 hover:underline"
                >
                  Holder Bot
                </Link>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
              <Link href="/tutorials/add-ons">
                <FileText className="mr-2 h-4 w-4" />
                View All Add-Ons
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Helpful Resources</CardTitle>
            <CardDescription>
              Additional resources and documentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>
                <Link href="/faqs" className="text-blue-600 hover:underline">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link
                  href="/tutorials/glossary"
                  className="text-blue-600 hover:underline"
                >
                  Crypto Trading Glossary
                </Link>
              </li>
              <li>
                <Link
                  href="/tutorials/best-practices"
                  className="text-blue-600 hover:underline"
                >
                  Trading Best Practices
                </Link>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
              <Link href="/faqs">
                <HelpCircle className="mr-2 h-4 w-4" />
                View FAQs
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
