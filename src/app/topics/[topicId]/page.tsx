import { notFound } from 'next/navigation';

import { TopicPage } from '@/components/topic/TopicPage';
import { TopicGate } from '@/components/layout/TopicGate';
import { TopicNextStep } from '@/components/topic/TopicNextStep';
import { getTopicContent } from '@/services/content-service';

interface TopicPageRouteProps {
  params: Promise<{ topicId: string }>;
}

export default async function TopicPageRoute({ params }: TopicPageRouteProps) {
  const { topicId } = await params;

  let topic;
  try {
    topic = await getTopicContent(topicId);
  } catch {
    notFound();
  }

  return (
    <TopicGate topicId={topicId}>
      <TopicPage topic={topic} />
      <TopicNextStep topicId={topicId} />
    </TopicGate>
  );
}
