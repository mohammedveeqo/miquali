import { notFound } from 'next/navigation';

import { TopicTabs } from '@/components/topic/TopicTabs';
import { getTopicContent, getProgressionConfig } from '@/services/content-service';
import type { QAQuestion } from '@/types';

interface TopicPageRouteProps {
  params: Promise<{ topicId: string }>;
}

export default async function TopicPageRoute({ params }: TopicPageRouteProps) {
  const { topicId } = await params;

  let topic;
  let progression;
  try {
    topic = await getTopicContent(topicId);
    progression = await getProgressionConfig();
  } catch {
    notFound();
  }

  // Load qaQuestions from the topic JSON (they're part of the JSON file but not in the TS type yet for TopicContent)
  // We read them directly from the raw JSON
  let qaQuestions: QAQuestion[] = [];
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'src', 'content', 'topics', `${topicId}.json`);
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.qaQuestions)) {
      qaQuestions = parsed.qaQuestions as QAQuestion[];
    }
  } catch {
    // No qaQuestions available — that's fine
  }

  return (
    <TopicTabs
      topic={topic}
      qaQuestions={qaQuestions}
      progression={progression}
    />
  );
}
