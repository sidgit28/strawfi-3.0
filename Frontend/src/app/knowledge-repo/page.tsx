"use client";

import { useAuth } from '@/contexts/AuthContext';
import FintechKnowledgeRepo from '../components/knowledge-repo';

export default function KnowledgeRepoPage() {
  const { user } = useAuth();

  return <FintechKnowledgeRepo user={user} />;
}
