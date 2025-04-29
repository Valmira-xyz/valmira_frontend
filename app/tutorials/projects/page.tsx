'use client';

import { motion } from 'framer-motion';

export default function ProjectsTutorialPage() {
  return (
    <motion.div
      className="mx-auto"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >

      <div className="prose dark:prose-invert max-w-none px-4 md:px-6 mt-6">
        <h2>Creating and Managing Projects</h2>
        <p>
          This tutorial will guide you through the process of creating and
          managing projects on the Valmira platform. You'll learn how to create
          new projects, configure their settings, and monitor their performance.
        </p>

        {/* Tutorial content would go here */}
        <div className="bg-muted p-6 rounded-lg my-6">
          <p className="text-center text-muted-foreground">
            Tutorial content is being developed.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
