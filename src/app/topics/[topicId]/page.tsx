import { notFound } from 'next/navigation';

import { TopicPage } from '@/components/topic/TopicPage';
import { TopicInlineSections } from '@/components/topic/TopicInlineSections';
import { getTopicContent, getQuizPool } from '@/services/content-service';

interface TopicPageRouteProps {
  params: Promise<{ topicId: string }>;
}

export default async function TopicPageRoute({ params }: TopicPageRouteProps) {
  const { topicId } = await params;

  let topic;
  let questions;
  try {
    topic = await getTopicContent(topicId);
    questions = await getQuizPool(topicId);
  } catch {
    notFound();
  }

  return (
    <>
      <TopicPage topic={topic} />
      <TopicInlineSections topicId={topicId} questions={questions} />
    </>
  );
}
