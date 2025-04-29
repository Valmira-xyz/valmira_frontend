'use client';

import { ProjectsList } from '@/components/projects/projects-list';
import { motion } from 'framer-motion';

export default function ProjectsPage() {
  return (
    <motion.div
      className="space-y-6 w-[calc(100vw-320px)]"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <ProjectsList isPublic={false} />
    </motion.div>
  );
}
