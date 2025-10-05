'use client';

import { motion } from 'framer-motion';

import { ProjectsList } from '@/components/projects/projects-list';

export default function PublicProjectsPage() {
  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <ProjectsList isPublic={true} />
    </motion.div>
  );
}
