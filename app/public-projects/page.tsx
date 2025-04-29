'use client';

import { ProjectsList } from '@/components/projects/projects-list';
import { motion } from 'framer-motion';

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
