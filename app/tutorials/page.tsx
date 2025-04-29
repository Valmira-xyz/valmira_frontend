'use client';

import { BookOpen, FileText, HelpCircle } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { motion } from 'framer-motion';

export default function TutorialsPage() {
  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 p-4 md:p-6">
        <Card className="border flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Learn the basics of Valmira platform
            </CardDescription>
          </CardHeader>
          <div className="flex flex-col justify-between">
            <CardContent>
              <ul className="space-y-2">
                <li>
                <Button variant="secondary" className="w-full">
                  <Link
                    href="/tutorials/projects"
                    className="hover:underline w-full text-start"
                  >
                    Creating Your First Project
                  </Link>
                </Button>
              </li>
              <li>
                <Button variant="secondary" className="w-full">
                  <Link
                    href="/tutorials/wallet-setup"
                    className="w-full text-start hover:underline"
                  >
                    Wallet Setup Guide
                  </Link>
                </Button>
              </li>
              <li>
                <Button variant="secondary" className="w-full">
                  <Link
                    href="/tutorials/dashboard-overview"
                    className="w-full text-start hover:underline"
                  >
                    Dashboard Overview
                  </Link>
                </Button>
              </li>
            </ul>
            </CardContent>
            <CardFooter>
              <Button variant="default" asChild className="w-full">
                <Link href="/tutorials/projects">
                  <BookOpen className="mr-2 h-4 w-4" />
                  View All Basics
                </Link>
                </Button>
            </CardFooter>
          </div>
        </Card>

        <Card className="border flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Add-Ons & Bots</CardTitle>
            <CardDescription>
              Tutorials for different bot types and add-ons
            </CardDescription>
          </CardHeader>
          <div className="flex flex-col justify-between">
            <CardContent>
              <ul className="space-y-2">
                <li>
                  <Button variant="secondary" className="w-full">
                    <Link
                      href="/tutorials/add-ons/bundle-snipe"
                      className="w-full text-start hover:underline"
                    >
                      Liquidation Snipe Bot
                    </Link>
                  </Button>
                </li>
                <li>
                  <Button variant="secondary" className="w-full">
                    <Link
                      href="/tutorials/add-ons/volume-bot"
                      className="w-full text-start hover:underline"
                    >
                      Volume Bot
                    </Link>
                  </Button>
                </li>
                <li>
                  <Button variant="secondary" className="w-full">
                    <Link
                      href="/tutorials/add-ons/holder-bot"
                      className="w-full text-start hover:underline"
                    >
                      Holder Bot
                    </Link>
                  </Button>
                </li>
              </ul>
            </CardContent>
          <CardFooter>
            <Button variant="default" asChild className="w-full">
              <Link href="/tutorials/add-ons">
                <FileText className="mr-2 h-4 w-4" />
                View All Add-Ons
              </Link>
            </Button>
          </CardFooter>
          </div>

        </Card>

        <Card className="border flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Helpful Resources</CardTitle>
            <CardDescription>
              Additional resources and documentation
            </CardDescription>
          </CardHeader>
          <div className="flex flex-col justify-between">
            <CardContent>
              <ul className="space-y-2">
                <li>
                  <Button variant="secondary" className="w-full">
                    <Link
                      href="/faqs"
                      className="w-full text-start hover:underline"
                    >
                      Frequently Asked Questions
                    </Link>
                  </Button>
                </li>
                <li>
                  <Button variant="secondary" className="w-full">
                    <Link
                      href="/tutorials/glossary"
                      className="w-full text-start hover:underline"
                    >
                      Crypto Trading Glossary
                    </Link>
                  </Button>
                </li>
                <li>
                  <Button variant="secondary" className="w-full">
                    <Link
                      href="/tutorials/best-practices"
                      className="w-full text-start hover:underline"
                    >
                      Trading Best Practices
                    </Link>
                  </Button>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="default" asChild className="w-full">
                <Link href="/faqs">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  View FAQs
                </Link>
              </Button>
            </CardFooter>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
